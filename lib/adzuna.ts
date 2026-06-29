const APP_ID = process.env.ADZUNA_APP_ID!
const APP_KEY = process.env.ADZUNA_APP_KEY!
const BASE = 'https://api.adzuna.com/v1/api/jobs/us/search'

export interface RawJob {
  title: string
  company: { display_name: string }
  description: string
  location: { display_name: string; area: string[] }
  redirect_url: string
  salary_min?: number
  salary_max?: number
  latitude?: number
  longitude?: number
  id: string
}

const SEARCHES = [
  // Core teen entry-level terms
  'part time no experience',
  'crew member',
  'team member retail',
  'barista cashier',
  'entry level food service',
  // More specific role types
  'cashier part time',
  'stocker bagger grocery',
  'dishwasher kitchen helper',
  'host hostess restaurant',
  'ride operator amusement',
  // Seasonal and summer
  'seasonal part time summer',
  'after school part time',
  // Specific high-hiring industries in COS
  'fast food hamburger pizza',
  'movie theater concessions',
  'pet store animal care',
  // Colorado Springs specific employers
  'king soopers safeway grocery',
  'target walmart retail associate',
  'chick-fil-a dutch bros',
]

export async function fetchAdzunaJobs(): Promise<RawJob[]> {
  const results: RawJob[] = []

  for (const query of SEARCHES) {
    try {
      const params = new URLSearchParams({
        app_id: APP_ID,
        app_key: APP_KEY,
        results_per_page: '50',
        what: query,
        where: 'Colorado Springs, CO',
        distance: '15',
        sort_by: 'date',
        max_days_old: '14',
      })
      const res = await fetch(`${BASE}/1?${params}`)
      if (!res.ok) continue
      const data = await res.json()
      results.push(...(data.results ?? []))
    } catch {
      // continue on error — other sources fill the gap
    }
  }

  // Deduplicate by Adzuna ID
  const seen = new Set<string>()
  return results.filter(j => {
    if (seen.has(j.id)) return false
    seen.add(j.id)
    return true
  })
}
