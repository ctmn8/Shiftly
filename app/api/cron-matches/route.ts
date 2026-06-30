import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateMatches } from '@/lib/groq'
import { distanceMiles } from '@/lib/schools'
import { sendFollowUpReminder } from '@/lib/mailjet'

export const maxDuration = 60

// Runs last (see vercel.json schedule) — after cron, cron-local, and
// cron-remote have had a chance to insert that night's new jobs.

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    // Clean up listings older than 21 days
    await supabaseAdmin
      .from('jobs')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())

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
          distance_miles: profile.lat && j.lat ? distanceMiles(profile.lat, profile.lng, j.lat, j.lng) : null,
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
    return NextResponse.json({ ok: true, log, matches: matchesGenerated, emails: emailsSent })
  } catch (err) {
    return NextResponse.json({ ok: false, log, error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 })
  }
}
