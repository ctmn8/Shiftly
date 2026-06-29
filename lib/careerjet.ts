const KEY = process.env.CAREERJET_KEY!
const BASE = 'http://public.api.careerjet.net/search'

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
  'part time entry level',
  'cashier no experience',
  'food service team member',
  'retail associate',
]

export async function fetchCareerjetJobs(): Promise<CareerjetJob[]> {
  const results: CareerjetJob[] = []

  for (const keywords of QUERIES) {
    try {
      const params = new URLSearchParams({
        affid: KEY,
        keywords,
        location: 'Colorado Springs, Colorado',
        sort: 'date',
        contracttype: 'p', // part-time
        pagesize: '50',
        page: '1',
      })
      const res = await fetch(`${BASE}?${params}`)
      if (!res.ok) continue
      const data = await res.json()
      if (data.jobs) results.push(...data.jobs)
    } catch {
      // continue
    }
  }

  const seen = new Set<string>()
  return results.filter(j => {
    if (seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })
}
