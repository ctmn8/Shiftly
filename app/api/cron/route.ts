import { NextRequest, NextResponse } from 'next/server'
import { fetchAdzunaJobs } from '@/lib/adzuna'
import { fetchCareerjetJobs } from '@/lib/careerjet'
import { fetchMuseJobs } from '@/lib/muse'
import { fetchJoobleJobs } from '@/lib/jooble'
import { fetchGoogleJobs } from '@/lib/google-jobs'
import { fetchIndeedJobs } from '@/lib/indeed'
import { insertNormalizedJobs, type NormalizedJob } from '@/lib/job-pipeline'

export const maxDuration = 60 // Vercel Hobby plan hard caps serverless functions at 60s
                              // regardless of this value. The full ingestion pipeline used
                              // to be one giant function — split into several smaller, time-
                              // offset cron jobs (see vercel.json) so each one comfortably
                              // fits the budget instead of one slow source timing out everything.

// "Core" sources: the fast, official job-board APIs. Local/discovery scraping
// (cron-local), remote/internship boards (cron-remote), and match generation +
// emails (cron-matches) each run as their own offset cron job. Employer
// career-page scraping runs separately in GitHub Actions (15-min budget, no
// time pressure) — see .github/workflows/scrape.yml.

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    log.push('Fetching core API sources...')
    const results = await Promise.allSettled([
      fetchAdzunaJobs(),
      fetchCareerjetJobs(),
      fetchMuseJobs(),
      fetchJoobleJobs(),
      fetchGoogleJobs(),
      fetchIndeedJobs(),
    ])
    const names = ['adzuna', 'careerjet', 'muse', 'jooble', 'googleJobs', 'indeed']
    const settled = (i: number) => (results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any[]>).value : [])
    const [adzuna, careerjet, muse, jooble, googleJobs, indeed] = names.map((_, i) => settled(i))

    results.forEach((r, i) => {
      if (r.status === 'rejected') log.push(`${names[i]} FAILED: ${String(r.reason).slice(0, 150)}`)
    })
    log.push(`Raw: Adzuna=${adzuna.length}, CJ=${careerjet.length}, Muse=${muse.length}, Jooble=${jooble.length}, Google=${googleJobs.length}, Indeed=${indeed.length}`)

    const normalized: NormalizedJob[] = [
      ...adzuna.map(j => ({
        title: j.title,
        company: j.company.display_name,
        description: j.description ?? '',
        location: j.location.display_name,
        apply_url: j.redirect_url,
        pay_min: j.salary_min ?? null,
        pay_max: j.salary_max ?? null,
        pay_display: j.salary_min ? `$${Math.round(j.salary_min / 2080)}/hr` : null,
        lat: j.latitude ?? null,
        lng: j.longitude ?? null,
        source: 'adzuna',
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
        source: 'careerjet',
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
        source: 'muse',
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
        source: 'jooble',
        source_id: j.id || j.link,
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
        source: 'google',
        source_id: `google-${j.job_id}`,
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
        source: 'indeed',
        source_id: `indeed-${j.job_key}`,
      })),
    ]

    const inserted = await insertNormalizedJobs(normalized, log)
    log.push('Done.')
    return NextResponse.json({ ok: true, log, inserted })
  } catch (err) {
    return NextResponse.json({ ok: false, log, error: String(err) }, { status: 500 })
  }
}
