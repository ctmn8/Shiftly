// Workday ATS API scraper — no Playwright needed, hits the public JSON API directly.
// Workday is used by King Soopers/Kroger, Target, Kohl's, Sky Zone, Safeway/Albertsons,
// Bath & Body Works, Best Buy, Ross, Burlington, AutoZone, and dozens more COS employers.
// API endpoint is undocumented but stable: every Workday tenant exposes the same POST route.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// API: POST https://{tenant}.{wdVersion}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
// Apply URL: https://{tenant}.{wdVersion}.myworkdayjobs.com/{site}{job.externalPath}
const WORKDAY_EMPLOYERS = [
  { company: 'King Soopers',      tenant: 'kroger',        site: 'External',             wdVersion: 'wd5' },
  { company: 'Target',            tenant: 'target',        site: 'careersatTarget',       wdVersion: 'wd5' },
  { company: "Kohl's",           tenant: 'kohls',         site: 'External',             wdVersion: 'wd5' },
  { company: 'Sky Zone',          tenant: 'skyzone',       site: 'SkyZone',              wdVersion: 'wd1' },
  { company: 'Safeway',           tenant: 'albertsons',    site: 'albertsons_careers',   wdVersion: 'wd5' },
  { company: 'Bath & Body Works', tenant: 'lbrands',       site: 'BathandBodyWorks',     wdVersion: 'wd5' },
  { company: 'Best Buy',          tenant: 'bestbuy',       site: 'BestBuyCareers',       wdVersion: 'wd5' },
  { company: 'Ross',              tenant: 'rossstores',    site: 'External',             wdVersion: 'wd5' },
  { company: 'Burlington',        tenant: 'burlington',    site: 'External',             wdVersion: 'wd5' },
  { company: 'AutoZone',          tenant: 'autozone',      site: 'External',             wdVersion: 'wd5' },
  { company: 'Dollar General',    tenant: 'dollargeneral', site: 'External',             wdVersion: 'wd5' },
  { company: 'Dollar Tree',       tenant: 'dollartree',    site: 'External',             wdVersion: 'wd5' },
  { company: 'Lowe\'s',          tenant: 'lowes',         site: 'Lowes',                wdVersion: 'wd5' },
  { company: 'Starbucks',         tenant: 'starbucks',     site: 'starbucksExternal',    wdVersion: 'wd5' },
  { company: 'CVS Health',        tenant: 'cvs',           site: 'CVS_External',         wdVersion: 'wd5' },
  { company: 'Bowlero',           tenant: 'bowlero',       site: 'External',             wdVersion: 'wd5' },
]

const COS_PATTERN = /colorado\s*springs/i
const COS_ZIPS = /\b809(0[0-9]|1[0-9]|2[0-9]|3[0-9])\b/
const TITLE_HARD_BLOCK = ['bartender', 'cannabis', 'dispensary', 'security guard', 'casino', 'meat cutter', 'forklift', 'cdl driver', 'truck driver', 'attorney', 'registered nurse', 'financial analyst']

function isColoradoSprings(text) {
  if (!text) return false
  return COS_PATTERN.test(text) || COS_ZIPS.test(text)
}

function isBlocked(title) {
  const t = (title || '').toLowerCase()
  return TITLE_HARD_BLOCK.some(w => t.includes(w))
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

async function fetchWorkdayJobs({ company, tenant, site, wdVersion }) {
  const apiUrl = `https://${tenant}.${wdVersion}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`
  const baseUrl = `https://${tenant}.${wdVersion}.myworkdayjobs.com/${site}`

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: 'Colorado Springs',
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.log(`  ${company}: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    const postings = data.jobPostings ?? []

    const cosJobs = postings.filter(j => {
      const locText = [
        j.locationsText,
        ...(j.locationHierarchyRef ?? []).map(l => l.descriptor),
      ].filter(Boolean).join(' ')
      return isColoradoSprings(locText)
    })

    const results = cosJobs
      .filter(j => !isBlocked(j.title))
      .map(j => ({
        title: j.title,
        company,
        location: 'Colorado Springs, CO',
        description: stripHtml(j.jobDescription) || `${j.title} at ${company} in Colorado Springs.`,
        apply_url: `${baseUrl}${j.externalPath}`,
        source: 'workday',
        source_id: `workday-${tenant}-${(j.externalPath || j.title).replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 80)}`,
        min_age: 16,
        tags: [],
        job_type: 'in-person',
        pay_min: null,
        pay_max: null,
        pay_display: null,
        lat: null,
        lng: null,
      }))

    console.log(`  ${company}: ${results.length}/${postings.length} COS jobs`)
    return results
  } catch (err) {
    console.log(`  ${company}: error (${err.message?.slice(0, 60)})`)
    return []
  }
}

async function main() {
  console.log('Fetching jobs from Workday ATS APIs...')

  const settled = await Promise.allSettled(WORKDAY_EMPLOYERS.map(fetchWorkdayJobs))
  const allJobs = settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  console.log(`\nTotal Workday COS jobs: ${allJobs.length}`)

  if (allJobs.length === 0) return

  const sourceIds = allJobs.map(j => j.source_id)
  const { data: existing } = await supabase.from('jobs').select('source_id').in('source_id', sourceIds)
  const existingSet = new Set((existing ?? []).map(r => r.source_id))
  const newJobs = allJobs.filter(j => !existingSet.has(j.source_id))

  console.log(`New after dedup: ${newJobs.length}`)

  if (newJobs.length > 0) {
    const { error } = await supabase.from('jobs').insert(newJobs)
    if (error) console.error('Insert error:', error.message)
    else console.log(`✓ Inserted ${newJobs.length} Workday jobs`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
