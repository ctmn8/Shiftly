import { NextRequest, NextResponse } from 'next/server'
import { fetchLocalCOSJobs } from '@/lib/local-cos'
import { fetchLocalDiscoveryJobs } from '@/lib/local-discovery'
import { fetchMoreBoardJobs } from '@/lib/more-boards'
import { insertNormalizedJobs, type NormalizedJob } from '@/lib/job-pipeline'

export const maxDuration = 60 // see app/api/cron/route.ts for why this is split out

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    log.push('Fetching local/discovery sources...')
    const results = await Promise.allSettled([
      fetchLocalCOSJobs(),
      fetchLocalDiscoveryJobs(),
      fetchMoreBoardJobs(),
    ])
    const names = ['localCOS', 'localDisc', 'moreBoards']
    const settled = (i: number) => (results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any[]>).value : [])
    const [localCOS, localDisc, moreBoards] = names.map((_, i) => settled(i))

    results.forEach((r, i) => {
      if (r.status === 'rejected') log.push(`${names[i]} FAILED: ${String(r.reason).slice(0, 150)}`)
    })
    log.push(`Raw: Local=${localCOS.length}, Discovery=${localDisc.length}, Boards=${moreBoards.length}`)

    const normalized: NormalizedJob[] = [
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
        source: 'local',
        source_id: j.source_id,
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
        source: 'discovery',
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
        source: 'board',
        source_id: j.source_id,
      })),
    ]

    const inserted = await insertNormalizedJobs(normalized, log)
    log.push('Done.')
    return NextResponse.json({ ok: true, log, inserted })
  } catch (err) {
    return NextResponse.json({ ok: false, log, error: String(err) }, { status: 500 })
  }
}
