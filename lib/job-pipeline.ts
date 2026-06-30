// Shared tail of the job ingestion pipeline: dedup -> classify -> tag -> insert.
// Each cron route builds its own normalized array from its own subset of
// sources (so one slow source can't block the others — see app/api/cron*/route.ts),
// then hands off to insertNormalizedJobs to finish the job.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { classifyJobs, detectFlags } from '@/lib/groq'

export interface NormalizedJob {
  title: string
  company: string
  description: string
  location: string
  apply_url: string
  pay_min: number | null
  pay_max: number | null
  pay_display: string | null
  lat: number | null
  lng: number | null
  source: string
  source_id: string
  min_age?: number
  tags?: string[]
  job_type?: 'in-person' | 'remote' | 'internship'
}

export async function insertNormalizedJobs(normalized: NormalizedJob[], log: string[]): Promise<number> {
  if (normalized.length === 0) return 0

  // Dedup against existing rows
  const sourceIds = normalized.map(j => j.source_id)
  const { data: existing } = await supabaseAdmin.from('jobs').select('source_id').in('source_id', sourceIds)
  const existingIds = new Set((existing ?? []).map(r => r.source_id))
  const newJobs = normalized.filter(j => !existingIds.has(j.source_id))
  log.push(`New jobs after dedup: ${newJobs.length}`)

  if (newJobs.length === 0) return 0

  // Remote/internship jobs are pre-approved by source; everything else goes through Groq
  const preApproved = newJobs.filter(j => j.job_type === 'remote' || j.job_type === 'internship')
  const needsClassification = newJobs.filter(j => j.job_type !== 'remote' && j.job_type !== 'internship')

  // Groq's free tier rate limit caps how many jobs get classified in one
  // run (see lib/groq.ts) — anything beyond that cap simply isn't inserted
  // this time and naturally retries on the next cron run.
  const GROQ_BATCH_SIZE = 20
  const MAX_BATCHES_PER_RUN = 3
  const classifyCap = GROQ_BATCH_SIZE * MAX_BATCHES_PER_RUN
  log.push(`Classifying with Groq... (cap ${classifyCap}/run, ${needsClassification.length} candidates)`)
  const classifications = await classifyJobs(
    needsClassification.map(j => ({ title: j.title, company: j.company, description: j.description }))
  )

  const toInsert = [
    ...preApproved,
    ...needsClassification
      .map((j, i) => ({ ...j, ...classifications[i] }))
      .filter((j: any) => j.teen_appropriate),
  ]
  log.push(`Teen-appropriate: ${toInsert.length}`)

  // Supabase batch inserts are all-or-nothing — one row missing a required
  // field (e.g. a source mapping bug returning company: null) throws a
  // NOT NULL violation and silently discards every other good row in the
  // batch too. Filter out malformed rows before insert instead of betting
  // every source's mapping is always correct.
  const validToInsert = toInsert.filter((j: any) =>
    j.title && String(j.title).trim() && j.company && String(j.company).trim() &&
    j.apply_url && String(j.apply_url).trim() && j.source_id && String(j.source_id).trim()
  )
  const droppedCount = toInsert.length - validToInsert.length
  if (droppedCount > 0) {
    log.push(`Dropped ${droppedCount} malformed job(s) missing title/company/apply_url/source_id`)
  }

  if (validToInsert.length > 0) {
    const { error } = await supabaseAdmin.from('jobs').insert(
      validToInsert.map((j: any) => ({
        title: j.title,
        company: j.company,
        // Some sources don't capture a real description. A job with no
        // description shows as a blank card to the teen reading it —
        // always fall back to a short, honest line instead of leaving it empty.
        description: j.description && j.description.trim().length > 10
          ? j.description
          : `${j.title} at ${j.company} in Colorado Springs. Click apply to see full details on the employer's site.`,
        location: j.location,
        apply_url: j.apply_url,
        pay_min: j.pay_min,
        pay_max: j.pay_max,
        pay_display: j.pay_display,
        lat: j.lat,
        lng: j.lng,
        min_age: j.min_age ?? 16,
        tags: (() => {
          const base: string[] = j.tags ?? []
          const flags = detectFlags(j.title, j.description ?? '')
          if (flags.commission_pay) base.push('commission-pay')
          if (flags.vehicle_needed) base.push('vehicle-needed')
          if (flags.license_needed) base.push('license-needed')
          if (flags.physical_labor) base.push('physical')
          if (flags.night_shift) base.push('night-shift')
          if (flags.requires_18) base.push('requires-18')
          if (flags.exp_preferred) base.push('exp-preferred')
          return [...new Set(base)]
        })(),
        source: j.source,
        source_id: j.source_id,
        job_type: j.job_type ?? 'in-person',
      }))
    )
    if (error) throw error
  }

  return validToInsert.length
}
