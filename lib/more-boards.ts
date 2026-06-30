// Additional job boards. Audited 2026-06-30 against live responses:
// - Monster, CareerBuilder, Glassdoor: pages load, but the actual job data only
//   populates client-side after JS runs. ScraperAPI's render=true is required —
//   and all three are flagged as "protected domains" needing the premium/
//   ultra_premium proxy pools, which the free tier doesn't include (confirmed:
//   403 "current plan does not allow..."). Disabled — unreachable on $0 budget.
// - ConnectingColorado: URL returns a flat 404. Disabled.
// - Jobcase: page loads but its job array is empty in the initial HTML, same
//   client-render problem as Monster/CareerBuilder/Glassdoor. Disabled.
// - SimplyHired: works. Real Colorado Springs job data present in the initial
//   HTML (no rendering needed), verified directly.

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function fetchViaScraperAPI(url: string): Promise<Response> {
  if (SCRAPERAPI_KEY) {
    const params = new URLSearchParams({ api_key: SCRAPERAPI_KEY, url })
    return fetch(`https://api.scraperapi.com/?${params}`, { signal: AbortSignal.timeout(20000) })
  }
  return fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
}

export interface BoardJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  salary?: string
  source_id: string
}

// Extracts a JSON array embedded in HTML as "key":[...] by counting bracket
// depth instead of a lazy regex. A lazy regex (/\[[\s\S]*?\]/) matches the
// FIRST "]" it finds, which for a deeply nested object (e.g. a job with a
// "requirements":[...] array inside it) cuts the capture off mid-structure
// and fails to parse. This walks the string and tracks nesting properly.
function extractJsonArray(html: string, key: string): any[] {
  const marker = `"${key}":[`
  const start = html.indexOf(marker)
  if (start === -1) return []

  const arrayStart = start + marker.length - 1 // index of the opening [
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = arrayStart; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(arrayStart, i + 1))
        } catch {
          return []
        }
      }
    }
  }
  return []
}

// SimplyHired — verified working: real Colorado Springs listings present in
// the initial HTML response, no JS rendering required.
async function fetchSimplyHired(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.simplyhired.com/search?q=part+time+entry+level&l=Colorado+Springs%2C+CO&radius=25&dateposted=14',
    'https://www.simplyhired.com/search?q=cashier+team+member&l=Colorado+Springs%2C+CO&radius=25',
    'https://www.simplyhired.com/search?q=no+experience+required&l=Colorado+Springs%2C+CO&radius=25',
  ]

  await Promise.all(searches.map(async url => {
    try {
      const res = await fetchViaScraperAPI(url)
      if (!res.ok) return
      const html = await res.text()
      const jobs = extractJsonArray(html, 'jobs')

      for (const job of jobs.slice(0, 20)) {
        const id = `sh-${job.jobKey || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company || '',
          location: job.location || 'Colorado Springs, CO',
          description: (job.snippet || '').replace(/�/g, ' ').trim(),
          apply_url: job.botUrl ? `https://www.simplyhired.com${job.botUrl}` : url,
          salary: job.salaryInfo || '',
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }))

  return results.filter(j => j.title && j.company && j.description.length > 10)
}

export async function fetchMoreBoardJobs(): Promise<BoardJob[]> {
  return fetchSimplyHired()
}
