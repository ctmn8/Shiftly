import { NextRequest, NextResponse } from 'next/server'
import { fetchRemoteJobs } from '@/lib/remote-jobs'
import { fetchInternships } from '@/lib/internships'
import { insertNormalizedJobs, type NormalizedJob } from '@/lib/job-pipeline'

export const maxDuration = 60 // see app/api/cron/route.ts for why this is split out

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    log.push('Fetching remote/internship sources...')
    const results = await Promise.allSettled([
      fetchRemoteJobs(),
      fetchInternships(),
    ])
    const names = ['remote', 'internships']
    const settled = (i: number) => (results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any[]>).value : [])
    const [remote, internships] = names.map((_, i) => settled(i))

    results.forEach((r, i) => {
      if (r.status === 'rejected') log.push(`${names[i]} FAILED: ${String(r.reason).slice(0, 150)}`)
    })
    log.push(`Raw: Remote=${remote.length}, Internships=${internships.length}`)

    const normalized: NormalizedJob[] = [
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
        source: 'remote',
        source_id: j.source_id,
        job_type: 'remote' as const,
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
        source: 'internship',
        source_id: j.source_id,
        job_type: 'internship' as const,
      })),
    ]

    const inserted = await insertNormalizedJobs(normalized, log)
    log.push('Done.')
    return NextResponse.json({ ok: true, log, inserted })
  } catch (err) {
    return NextResponse.json({ ok: false, log, error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 })
  }
}
