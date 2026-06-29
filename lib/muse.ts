// The Muse — free, no key required
export interface MuseJob {
  id: number
  name: string
  company: { name: string }
  contents: string
  refs: { landing_page: string }
  locations: { name: string }[]
  levels: { name: string }[]
}

export async function fetchMuseJobs(): Promise<MuseJob[]> {
  try {
    const res = await fetch(
      'https://www.themuse.com/api/public/jobs?location=Colorado%20Springs%2C%20CO&level=Entry+Level&page=0&descending=true',
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}
