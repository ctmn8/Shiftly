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

export async function fetchCareerjetJobs(): Promise<CareerjetJob[]> {
  const results: CareerjetJob[] = []

  for (const keywords of QUERIES) {
    for (const location of LOCATIONS.slice(0, 1)) { // try first location format
      try {
        const params = new URLSearchParams({
          affid: KEY,
          keywords,
          location,
          sort: 'date',
          pagesize: '50',
          page: '1',
          locale_code: 'en_US',
        })
        const res = await fetch(`${BASE}?${params}`, {
          headers: { 'User-Agent': 'Shiftly/1.0' },
        })
        if (!res.ok) continue
        const data = await res.json()
        if (data.jobs && data.jobs.length > 0) {
          results.push(...data.jobs)
          break // found results, skip other location formats
        }
      } catch {
        // continue
      }
    }
  }

  const seen = new Set<string>()
  return results.filter(j => {
    if (!j.url || seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })
}
