// Jooble API — free, global aggregator, strong US coverage
// Get key at: https://jooble.org/api
const KEY = process.env.JOOBLE_API_KEY

export interface JoobleJob {
  title: string
  company: string
  snippet: string
  link: string
  location: string
  salary: string
  type: string
  updated: string
  id: string
}

const KEYWORDS = [
  'part time entry level',
  'crew member cashier',
  'team member no experience',
  'barista food service',
  'retail associate seasonal',
]

async function fetchKeyword(keywords: string): Promise<JoobleJob[]> {
  try {
    const res = await fetch(`https://jooble.org/api/${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location: 'Colorado Springs, CO',
        radius: '15',
        page: '1',
        resultsOnPage: '20',
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.jobs ?? []
  } catch {
    return []
  }
}

export async function fetchJoobleJobs(): Promise<JoobleJob[]> {
  if (!KEY) return [] // Skip if no key configured

  const settled = await Promise.allSettled(KEYWORDS.map(fetchKeyword))
  const results = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  // Deduplicate by link
  const seen = new Set<string>()
  return results.filter(j => {
    if (seen.has(j.link)) return false
    seen.add(j.link)
    return true
  })
}
