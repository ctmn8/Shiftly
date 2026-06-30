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
  // Disabled 2026-06-30: every themuse.com/jobs/* landing_page link returns a
  // 403 "Request blocked" page (confirmed in browser, not just curl/bot
  // detection) — TheMuse is blocking this traffic at the CDN level. Showing
  // jobs with dead apply links is worse than showing fewer real ones.
  // Re-enable by removing this early return once verified working again.
  return []
}
