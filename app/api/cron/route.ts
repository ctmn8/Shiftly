import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchAdzunaJobs } from '@/lib/adzuna'
import { fetchCareerjetJobs } from '@/lib/careerjet'
import { fetchMuseJobs } from '@/lib/muse'
import { classifyJobs } from '@/lib/groq'

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
    const [adzuna, careerjet, muse] = await Promise.all([
      fetchAdzunaJobs(),
      fetchCareerjetJobs(),
      fetchMuseJobs(),
    ])
    log.push(`Raw: Adzuna=${adzuna.length}, Careerjet=${careerjet.length}, Muse=${muse.length}`)

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

    // 4. Classify with Groq
    log.push('Classifying with Groq...')
    const classifications = await classifyJobs(
      newJobs.map(j => ({ title: j.title, company: j.company, description: j.description }))
    )

    // 5. Filter teen-appropriate and merge
    const toInsert = newJobs
      .map((j, i) => ({ ...j, ...classifications[i] }))
      .filter(j => j.teen_appropriate)

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
          min_age: j.min_age ?? 16,
          tags: j.tags ?? [],
          source: j.source,
          source_id: j.source_id,
        }))
      )
      if (error) throw error
    }

    // 7. Clean up listings older than 21 days
    await supabaseAdmin
      .from('jobs')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())

    log.push('Done.')
    return NextResponse.json({ ok: true, log, inserted: toInsert.length })

  } catch (err) {
    return NextResponse.json({ ok: false, log, error: String(err) }, { status: 500 })
  }
}
