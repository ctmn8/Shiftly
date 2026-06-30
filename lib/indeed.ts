// Indeed scraper — largest job board. Plain fetch() gets bot-blocked (Indeed
// fingerprints non-browser requests aggressively), so this routes through
// ScraperAPI (rendered, real browser fingerprint) when a key is configured.
// Falls back to direct fetch — which will likely keep getting blocked —
// only when no key is set, so this doesn't silently do nothing.

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
}

async function fetchPage(url: string): Promise<Response> {
  if (SCRAPERAPI_KEY) {
    const params = new URLSearchParams({ api_key: SCRAPERAPI_KEY, url, render: 'true' })
    return fetch(`https://api.scraperapi.com/?${params}`, { signal: AbortSignal.timeout(25000) })
  }
  return fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
}

export interface IndeedJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  salary?: string
  job_key: string
}

const SEARCHES = [
  { q: 'part time', radius: '25' },
  { q: 'cashier', radius: '25' },
  { q: 'crew member', radius: '25' },
  { q: 'team member entry level', radius: '25' },
  { q: 'no experience required', radius: '25' },
  { q: 'seasonal summer', radius: '25' },
  { q: 'food service', radius: '25' },
  { q: 'retail associate', radius: '25' },
]

function parseIndeedJobs(html: string): IndeedJob[] {
  const jobs: IndeedJob[] = []

  // Indeed embeds job data as JSON in a window._initialData or similar structure
  // Also parse from the job cards in HTML

  // Method 1: Extract from JSON in script tags (most reliable)
  const jsonPatterns = [
    /window\._initialData\s*=\s*({[\s\S]*?});\s*<\/script>/,
    /"jobKeysWithQuestionsMap":\s*({[\s\S]*?}),/,
    /"results":\s*(\[[\s\S]*?\])\s*[,}]/,
  ]

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        // Navigate the Indeed data structure
        const jobList = data?.results || data?.jobCards || []
        for (const job of Array.isArray(jobList) ? jobList.slice(0, 20) : []) {
          if (!job.title && !job.jobTitle) continue
          jobs.push({
            title: job.title || job.jobTitle || '',
            company: job.company || job.companyName || '',
            location: job.formattedLocation || job.location || 'Colorado Springs, CO',
            description: job.snippet || job.description || '',
            apply_url: job.link ? `https://www.indeed.com${job.link}` : 'https://www.indeed.com',
            salary: job.salary || job.salarySnippet?.text || '',
            job_key: job.jobkey || job.jobKey || `${job.company}-${job.title}`,
          })
        }
        if (jobs.length > 0) return jobs
      } catch { /* try next pattern */ }
    }
  }

  // No reliable structured data found on this page. Used to fall back to a
  // raw HTML title/company scan here — but that produced cards with no real
  // description and a generic search-page apply_url instead of a real job
  // link, which is worse than just returning nothing for this search.
  return jobs
}

async function fetchSearch(search: { q: string; radius: string }): Promise<IndeedJob[]> {
  try {
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(search.q)}&l=Colorado+Springs%2C+CO&radius=${search.radius}&fromage=14&limit=50`
    const res = await fetchPage(url)
    if (!res.ok) return []
    const html = await res.text()
    return parseIndeedJobs(html).filter(j => j.title)
  } catch {
    return []
  }
}

export async function fetchIndeedJobs(): Promise<IndeedJob[]> {
  const settled = await Promise.allSettled(SEARCHES.map(fetchSearch))
  const all = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  const seen = new Set<string>()
  return all.filter(j => {
    if (seen.has(j.job_key)) return false
    seen.add(j.job_key)
    return true
  })
}
