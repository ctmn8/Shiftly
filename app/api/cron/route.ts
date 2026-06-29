import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchAdzunaJobs } from '@/lib/adzuna'
import { fetchCareerjetJobs } from '@/lib/careerjet'
import { fetchMuseJobs } from '@/lib/muse'
import { fetchJoobleJobs } from '@/lib/jooble'
import { scrapeEmployerJobs } from '@/lib/scrape-employers'
import { fetchGoogleJobs } from '@/lib/google-jobs'
import { fetchLocalCOSJobs } from '@/lib/local-cos'
import { fetchIndeedJobs } from '@/lib/indeed'
import { fetchLocalDiscoveryJobs } from '@/lib/local-discovery'
import { scrapeAllEmployerCareerPages } from '@/lib/career-scraper'
import { fetchMoreBoardJobs } from '@/lib/more-boards'
import { fetchRemoteJobs } from '@/lib/remote-jobs'
import { fetchInternships } from '@/lib/internships'
import { classifyJobs, generateMatches } from '@/lib/groq'
import { distanceMiles } from '@/lib/schools'
import { sendFollowUpReminder, sendNewMatchesEmail } from '@/lib/mailjet'

export const maxDuration = 300 // 5 min

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    // 1. Fetch from all sources in parallel
    log.push('Fetching jobs...')
    const [adzuna, careerjet, muse, jooble, scraped, googleJobs, localCOS, indeed, localDisc, employers, moreBoards, remote, internships] = await Promise.all([
      fetchAdzunaJobs(),
      fetchCareerjetJobs(),
      fetchMuseJobs(),
      fetchJoobleJobs(),
      scrapeEmployerJobs(),
      fetchGoogleJobs(),
      fetchLocalCOSJobs(),
      fetchIndeedJobs(),
      fetchLocalDiscoveryJobs(),
      scrapeAllEmployerCareerPages(),
      fetchMoreBoardJobs(),
      fetchRemoteJobs(),
      fetchInternships(),
    ])
    log.push(`Raw: Adzuna=${adzuna.length}, CJ=${careerjet.length}, Muse=${muse.length}, Jooble=${jooble.length}, Google=${googleJobs.length}, Indeed=${indeed.length}, Employers=${employers.length}, Boards=${moreBoards.length}, Remote=${remote.length}, Internships=${internships.length}, Local=${localCOS.length}+${localDisc.length}+${scraped.length}`)

    // 2. Normalize to a common shape
    const normalized = [
      ...adzuna.map(j => ({
        title: j.title,
        company: j.company.display_name,
        description: j.description ?? '',
        location: j.location.display_name,
        apply_url: j.redirect_url,
        pay_min: j.salary_min ?? null,
        pay_max: j.salary_max ?? null,
        pay_display: j.salary_min
          ? `$${Math.round(j.salary_min / 2080)}/hr`
          : null,
        lat: j.latitude ?? null,
        lng: j.longitude ?? null,
        source: 'adzuna' as const,
        source_id: j.id,
      })),
      ...careerjet.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description,
        location: j.locations,
        apply_url: j.url,
        pay_min: null,
        pay_max: null,
        pay_display: j.salary || null,
        lat: null,
        lng: null,
        source: 'careerjet' as const,
        source_id: j.url,
      })),
      ...muse.map(j => ({
        title: j.name,
        company: j.company.name,
        description: j.contents?.replace(/<[^>]*>/g, '').slice(0, 500) ?? '',
        location: j.locations[0]?.name ?? 'Colorado Springs, CO',
        apply_url: j.refs.landing_page,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        source: 'muse' as const,
        source_id: String(j.id),
      })),
      ...jooble.map(j => ({
        title: j.title,
        company: j.company,
        description: j.snippet ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.link,
        pay_min: null,
        pay_max: null,
        pay_display: j.salary || null,
        lat: null,
        lng: null,
        source: 'jooble' as const,
        source_id: j.id || j.link,
      })),
      ...scraped.map(j => ({
        title: j.title,
        company: j.company,
        description: '',
        location: j.location,
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        source: 'scrape' as const,
        source_id: j.source_id,
      })),
      ...googleJobs.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url || `https://www.google.com/search?q=${encodeURIComponent(j.title + ' ' + j.company)}`,
        pay_min: null,
        pay_max: null,
        pay_display: j.detected_extensions?.salary || null,
        lat: null,
        lng: null,
        source: 'google' as const,
        source_id: `google-${j.job_id}`,
      })),
      ...localCOS.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        source: 'local' as const,
        source_id: j.source_id,
      })),
      ...indeed.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: j.salary || null,
        lat: null,
        lng: null,
        source: 'indeed' as const,
        source_id: `indeed-${j.job_key}`,
      })),
      ...localDisc.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        source: 'discovery' as const,
        source_id: j.source_id,
      })),
      ...employers.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        source: 'employer' as const,
        source_id: j.source_id,
      })),
      ...moreBoards.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: j.salary || null,
        lat: null,
        lng: null,
        source: 'board' as const,
        source_id: j.source_id,
      })),
      ...remote.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: 'Remote / Online',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: j.pay_display || null,
        lat: null,
        lng: null,
        min_age: 16,
        tags: ['remote', 'online', 'work-from-home'],
        source: 'remote' as const,
        source_id: j.source_id,
        job_type: 'remote',
      })),
      ...internships.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description ?? '',
        location: j.location || 'Colorado Springs, CO',
        apply_url: j.apply_url,
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
        min_age: 16,
        tags: ['internship', 'experience', 'resume'],
        source: 'internship' as const,
        source_id: j.source_id,
        job_type: 'internship',
      })),
    ]

    // 3. Check which source_ids already exist (dedup across runs)
    const sourceIds = normalized.map(j => j.source_id)
    const { data: existing } = await supabaseAdmin
      .from('jobs')
      .select('source_id')
      .in('source_id', sourceIds)
    const existingIds = new Set((existing ?? []).map(r => r.source_id))
    const newJobs = normalized.filter(j => !existingIds.has(j.source_id))
    log.push(`New jobs after dedup: ${newJobs.length}`)

    if (newJobs.length === 0) {
      return NextResponse.json({ ok: true, log, inserted: 0 })
    }

    // 4. Separate pre-approved (remote/internship) from jobs needing classification
    const preApproved = newJobs.filter(j => ['remote', 'internship'].includes((j as any).job_type ?? ''))
    const needsClassification = newJobs.filter(j => !['remote', 'internship'].includes((j as any).job_type ?? ''))

    // 5. Classify in-person jobs with Groq
    log.push('Classifying with Groq...')
    const classifications = await classifyJobs(
      needsClassification.map(j => ({ title: j.title, company: j.company, description: j.description }))
    )

    // 6. Merge: pre-approved pass through, classified jobs filtered
    const toInsert = [
      ...preApproved, // remote/internship always pass through
      ...needsClassification
        .map((j, i) => ({ ...j, ...classifications[i] }))
        .filter(j => j.teen_appropriate),
    ]

    log.push(`Teen-appropriate: ${toInsert.length}`)

    // 6. Insert into Supabase
    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin.from('jobs').insert(
        toInsert.map(j => ({
          title: j.title,
          company: j.company,
          description: j.description,
          location: j.location,
          apply_url: j.apply_url,
          pay_min: j.pay_min,
          pay_max: j.pay_max,
          pay_display: j.pay_display,
          lat: j.lat,
          lng: j.lng,
          min_age: (j as any).min_age ?? 16,
          tags: (j as any).tags ?? [],
          source: j.source,
          source_id: j.source_id,
          job_type: (j as any).job_type ?? 'in-person',
        }))
      )
      if (error) throw error
    }

    // 7. Clean up listings older than 21 days
    await supabaseAdmin
      .from('jobs')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())

    // 8. Generate matches for all onboarded users
    log.push('Generating matches...')
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, school, availability, interests, transport, lat, lng')
      .eq('onboarded', true)

    const { data: allJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, location, pay_display, tags, lat, lng')
      .gte('min_age', 0)
      .lte('min_age', 16)
      .order('fetched_at', { ascending: false })
      .limit(50)

    let matchesGenerated = 0
    for (const profile of profiles ?? []) {
      try {
        const jobsWithDist = (allJobs ?? []).map(j => ({
          ...j,
          distance_miles: profile.lat && j.lat
            ? distanceMiles(profile.lat, profile.lng, j.lat, j.lng)
            : null,
        }))

        const results = await generateMatches(
          { school: profile.school, availability: profile.availability, interests: profile.interests, transport: profile.transport },
          jobsWithDist.map(j => ({ id: j.id, title: j.title, company: j.company, location: j.location, pay_display: j.pay_display ?? '', tags: j.tags ?? [], distance_miles: j.distance_miles ?? undefined }))
        )

        if (results.length > 0) {
          await supabaseAdmin.from('matches').upsert(
            results.map(r => ({ user_id: profile.id, job_id: r.job_id, score: r.score, explanation: r.explanation })),
            { onConflict: 'user_id,job_id' }
          )
          matchesGenerated += results.length
        }
      } catch { /* continue for other profiles */ }
    }
    log.push(`Matches generated: ${matchesGenerated}`)

    // 9. Send follow-up reminders for due applications
    log.push('Checking follow-up reminders...')
    const today = new Date().toISOString().split('T')[0]
    const { data: dueApps } = await supabaseAdmin
      .from('applications')
      .select('user_id, jobs(title, company)')
      .eq('followup_date', today)
      .eq('status', 'applied')

    let emailsSent = 0
    for (const app of dueApps ?? []) {
      try {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(app.user_id)
        const { data: prof } = await supabaseAdmin.from('profiles').select('name').eq('id', app.user_id).single()
        if (user?.user?.email && prof?.name) {
          const job = (app.jobs as unknown) as { title: string; company: string } | null
          if (job) {
            await sendFollowUpReminder(user.user.email, prof.name, job.title, job.company)
            emailsSent++
          }
        }
      } catch { /* continue */ }
    }
    log.push(`Follow-up emails sent: ${emailsSent}`)

    log.push('Done.')
    return NextResponse.json({ ok: true, log, inserted: toInsert.length, matches: matchesGenerated, emails: emailsSent })

  } catch (err) {
    return NextResponse.json({ ok: false, log, error: String(err) }, { status: 500 })
  }
}
