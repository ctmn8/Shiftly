// Google Jobs scraper — finds everything, including small local businesses
// that only post on their own websites (Apogee Rocketry, local shops, etc.)
// Uses SerpAPI free tier: 100 searches/month
// Get free key at: https://serpapi.com/users/sign_up

const SERPAPI_KEY = process.env.SERPAPI_KEY

export interface GoogleJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  detected_extensions?: {
    salary?: string
    schedule_type?: string
  }
  job_id: string
}

// Wide coverage — different angles on the same market
// These find the jobs that never appear on Adzuna/Muse/Jooble
const SEARCHES = [
  // Broad entry-level
  { q: 'part time jobs colorado springs co no experience', location: 'Colorado Springs, Colorado' },
  { q: 'entry level jobs colorado springs co teens', location: 'Colorado Springs, Colorado' },
  { q: 'hiring now colorado springs co part time', location: 'Colorado Springs, Colorado' },
  // Specific industries
  { q: 'cashier retail jobs colorado springs', location: 'Colorado Springs, Colorado' },
  { q: 'food service restaurant jobs colorado springs', location: 'Colorado Springs, Colorado' },
  { q: 'grocery store jobs colorado springs', location: 'Colorado Springs, Colorado' },
  // Geographic coverage — surrounding areas
  { q: 'part time jobs fountain co', location: 'Fountain, Colorado' },
  { q: 'part time jobs security widefield co', location: 'Security-Widefield, Colorado' },
  { q: 'part time jobs manitou springs', location: 'Manitou Springs, Colorado' },
  { q: 'part time jobs monument co', location: 'Monument, Colorado' },
  // Local/small business discovery — these find Apogee Rocketry types
  { q: 'local small business hiring colorado springs', location: 'Colorado Springs, Colorado' },
  { q: 'summer jobs 2026 colorado springs high school', location: 'Colorado Springs, Colorado' },
  { q: 'seasonal jobs colorado springs outdoors recreation', location: 'Colorado Springs, Colorado' },
  // Specific types teens do well at
  { q: 'movie theater amusement park jobs colorado springs', location: 'Colorado Springs, Colorado' },
  { q: 'pet store animal care jobs colorado springs', location: 'Colorado Springs, Colorado' },
]

async function fetchSearch(search: { q: string; location: string }): Promise<GoogleJob[]> {
  try {
    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: search.q,
      location: search.location,
      hl: 'en',
      gl: 'us',
      api_key: SERPAPI_KEY!,
      num: '20',
    })

    const res = await fetch(`https://serpapi.com/search?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []

    const data = await res.json()
    const jobs: GoogleJob[] = data.jobs_results ?? []
    return jobs.map(job => ({ ...job, job_id: job.job_id || `${job.company}-${job.title}`.toLowerCase().replace(/\s+/g, '-') }))
  } catch {
    return []
  }
}

export async function fetchGoogleJobs(): Promise<GoogleJob[]> {
  if (!SERPAPI_KEY) {
    console.log('[google-jobs] No SERPAPI_KEY configured, skipping')
    return []
  }

  // NOTE: SerpAPI's free tier is 100 searches/month. SEARCHES has 14 entries,
  // and this runs once per nightly cron — that's ~420/month, well over quota.
  // Worth trimming SEARCHES or running this source less often; left as-is here
  // since that's a cost/coverage tradeoff, not part of the timeout fix.
  const settled = await Promise.allSettled(SEARCHES.map(fetchSearch))
  const results = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  const seen = new Set<string>()
  return results.filter(job => {
    if (seen.has(job.job_id)) return false
    seen.add(job.job_id)
    return true
  })
}
