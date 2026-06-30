const KEY = process.env.CAREERJET_KEY!
const BASE = 'https://public.api.careerjet.net/search'

export interface CareerjetJob {
  title: string
  company: string
  description: string
  url: string
  salary: string
  locations: string
  id: string
}

const QUERIES = [
  'part time cashier',
  'crew member entry level',
  'team member retail',
  'food service no experience',
  'stocker bagger',
  'dishwasher kitchen',
  'host hostess',
  'barista coffee',
]

// CareerJet covers US well — try multiple location formats
const LOCATIONS = [
  'Colorado Springs, CO',
  'Colorado Springs, Colorado',
  'Colorado Springs CO 80903',
]

async function fetchKeyword(keywords: string): Promise<CareerjetJob[]> {
  try {
    const params = new URLSearchParams({
      affid: KEY,
      keywords,
      location: LOCATIONS[0], // try first location format
      sort: 'date',
      pagesize: '50',
      page: '1',
      locale_code: 'en_US',
    })
    const res = await fetch(`${BASE}?${params}`, {
      headers: { 'User-Agent': 'Shiftly/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.jobs ?? []
  } catch {
    return []
  }
}

export async function fetchCareerjetJobs(): Promise<CareerjetJob[]> {
  const settled = await Promise.allSettled(QUERIES.map(fetchKeyword))
  const results = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  const seen = new Set<string>()
  return results.filter(j => {
    if (!j.url || seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })
}
