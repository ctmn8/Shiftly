// Greenhouse + Lever ATS API scraper — public APIs, no auth, no Playwright.
// Greenhouse: Chipotle, Five Guys, Raising Cane's, Panera, GameStop, and many others.
// Lever: used by various mid-size employers.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const COS_PATTERN = /colorado\s*springs/i
const COS_ZIPS = /\b809(0[0-9]|1[0-9]|2[0-9]|3[0-9])\b/
const TITLE_HARD_BLOCK = ['bartender', 'cannabis', 'dispensary', 'security guard', 'casino', 'meat cutter', 'forklift', 'cdl driver', 'truck driver', 'attorney', 'registered nurse', 'financial analyst']

function isColoradoSprings(text) {
  return COS_PATTERN.test(text || '') || COS_ZIPS.test(text || '')
}

function isBlocked(title) {
  const t = (title || '').toLowerCase()
  return TITLE_HARD_BLOCK.some(w => t.includes(w))
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

// --- Greenhouse ---
// API: GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
// Response: { jobs: [{ id, title, location: { name }, absolute_url, content }] }

const GREENHOUSE_EMPLOYERS = [
  { company: 'Chipotle',        slug: 'chipotle' },
  { company: 'Five Guys',       slug: 'fiveguys' },
  { company: 'Panera Bread',    slug: 'panerabread' },
  { company: 'GameStop',        slug: 'gamestop' },
  { company: 'PetSmart',        slug: 'petsmart' },
  { company: 'AMC Theatres',    slug: 'amctheatres' },
  { company: 'Great Wolf Lodge',slug: 'greatwolflodge' },
  { company: 'Life Time',       slug: 'lifetime' },
  { company: 'Raising Cane\'s', slug: 'raisingcanes' },
]

async function fetchGreenhouseJobs({ company, slug }) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; job-board-bot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) { console.log(`  Greenhouse ${company}: HTTP ${res.status}`); return [] }

    const data = await res.json()
    const jobs = (data.jobs ?? []).filter(j =>
      isColoradoSprings(j.location?.name) && !isBlocked(j.title)
    )

    console.log(`  Greenhouse ${company}: ${jobs.length} COS jobs`)
    return jobs.map(j => ({
      title: j.title,
      company,
      location: j.location?.name || 'Colorado Springs, CO',
      description: stripHtml(j.content),
      apply_url: j.absolute_url,
      source: 'greenhouse',
      source_id: `greenhouse-${slug}-${j.id}`,
      min_age: 16,
      tags: [],
      job_type: 'in-person',
      pay_min: null,
      pay_max: null,
      pay_display: null,
      lat: null,
      lng: null,
    }))
  } catch (err) {
    console.log(`  Greenhouse ${company}: error (${err.message?.slice(0, 60)})`)
    return []
  }
}

// --- Lever ---
// API: GET https://api.lever.co/v0/postings/{slug}?mode=json&location=Colorado+Springs
// Response: [{ id, text (title), categories: { location, team }, hostedUrl, descriptionPlain }]

const LEVER_EMPLOYERS = [
  { company: 'Dutch Bros Coffee', slug: 'dutchbros' },
  { company: 'Bowlero',           slug: 'bowlero' },
  { company: 'Sky Zone',          slug: 'skyzone' },
]

async function fetchLeverJobs({ company, slug }) {
  // Try with location filter first; Lever ignores it gracefully if not matching
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; job-board-bot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) { console.log(`  Lever ${company}: HTTP ${res.status}`); return [] }

    const jobs = await res.json()
    if (!Array.isArray(jobs)) { console.log(`  Lever ${company}: unexpected response`); return [] }

    const cosJobs = jobs.filter(j =>
      isColoradoSprings(j.categories?.location) && !isBlocked(j.text)
    )

    console.log(`  Lever ${company}: ${cosJobs.length}/${jobs.length} COS jobs`)
    return cosJobs.map(j => ({
      title: j.text,
      company,
      location: j.categories?.location || 'Colorado Springs, CO',
      description: (j.descriptionPlain || '').slice(0, 500),
      apply_url: j.hostedUrl,
      source: 'lever',
      source_id: `lever-${slug}-${j.id}`,
      min_age: 16,
      tags: [],
      job_type: 'in-person',
      pay_min: null,
      pay_max: null,
      pay_display: null,
      lat: null,
      lng: null,
    }))
  } catch (err) {
    console.log(`  Lever ${company}: error (${err.message?.slice(0, 60)})`)
    return []
  }
}

async function main() {
  console.log('Fetching jobs from Greenhouse + Lever ATS APIs...')

  const [ghResults, leverResults] = await Promise.all([
    Promise.allSettled(GREENHOUSE_EMPLOYERS.map(fetchGreenhouseJobs)),
    Promise.allSettled(LEVER_EMPLOYERS.map(fetchLeverJobs)),
  ])

  const allJobs = [
    ...ghResults.flatMap(r => r.status === 'fulfilled' ? r.value : []),
    ...leverResults.flatMap(r => r.status === 'fulfilled' ? r.value : []),
  ]

  console.log(`\nTotal ATS COS jobs: ${allJobs.length}`)

  if (allJobs.length === 0) return

  const sourceIds = allJobs.map(j => j.source_id)
  const { data: existing } = await supabase.from('jobs').select('source_id').in('source_id', sourceIds)
  const existingSet = new Set((existing ?? []).map(r => r.source_id))
  const newJobs = allJobs.filter(j => !existingSet.has(j.source_id))

  console.log(`New after dedup: ${newJobs.length}`)

  if (newJobs.length > 0) {
    const { error } = await supabase.from('jobs').insert(newJobs)
    if (error) console.error('Insert error:', error.message)
    else console.log(`✓ Inserted ${newJobs.length} ATS jobs`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
