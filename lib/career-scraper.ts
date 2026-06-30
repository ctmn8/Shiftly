// Smart career page scraper — handles Workday, Greenhouse, Lever, and plain HTML
// Uses ScraperAPI when available (bypasses bot detection, renders JS)
// Falls back to direct fetch with browser headers

import { COS_EMPLOYERS } from './employers'

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function fetchWithScraperAPI(url: string): Promise<Response> {
  if (SCRAPERAPI_KEY) {
    return fetch(`https://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&render=true`)
  }
  return fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
}

export interface ScrapedCareerJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  source_id: string
}

// Greenhouse — many companies use this ATS, has public JSON API
async function scrapeGreenhouse(company: string, orgSlug: string): Promise<ScrapedCareerJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${orgSlug}/jobs?content=true`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs ?? [])
      .filter((j: any) => j.location?.name?.toLowerCase().includes('colorado') || j.location?.name?.toLowerCase().includes('co'))
      .map((j: any) => ({
        title: j.title,
        company,
        location: j.location?.name || 'Colorado Springs, CO',
        description: j.content?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
        apply_url: j.absolute_url || `https://boards.greenhouse.io/${orgSlug}`,
        source_id: `greenhouse-${j.id}`,
      }))
  } catch { return [] }
}

// Lever — another common ATS with public JSON API
async function scrapeLever(company: string, orgSlug: string): Promise<ScrapedCareerJob[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${orgSlug}?mode=json&commitment=Part-time`)
    if (!res.ok) return []
    const data = await res.json()
    return (data ?? [])
      .filter((j: any) => j.categories?.location?.toLowerCase().includes('colorado') ||
                          j.categories?.location?.toLowerCase().includes('colorado springs'))
      .map((j: any) => ({
        title: j.text,
        company,
        location: j.categories?.location || 'Colorado Springs, CO',
        description: j.descriptionPlain?.slice(0, 300) || '',
        apply_url: j.hostedUrl || `https://jobs.lever.co/${orgSlug}`,
        source_id: `lever-${j.id}`,
      }))
  } catch { return [] }
}

const TITLE_JUNK = ['sign in', 'search all', 'see all', 'who we are', 'corporate', 'linkedin', 'instagram', 'privacy notice', 'english', 'home', 'login', 'apply now', 'external link']

function isJunkTitle(title: string): boolean {
  const t = title.toLowerCase()
  return TITLE_JUNK.some(w => t.includes(w))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

// Generic HTML scraper — extracts job titles + descriptions from career pages.
// Only trusts JSON-LD structured JobPosting data: the old regex-based ATS
// title scan (Workday/Taleo/SmartRecruiters/etc selectors) and the
// "check their site" stub both produced cards with no real description and
// occasionally picked up nav links as fake jobs. Fewer, real listings beat
// more, fake ones.
async function scrapeGenericCareerPage(company: string, url: string): Promise<ScrapedCareerJob[]> {
  try {
    const res = await fetchWithScraperAPI(url)
    if (!res.ok) return []
    const html = await res.text()

    const jobs: ScrapedCareerJob[] = []
    const seen = new Set<string>()
    const jsonLdBlockPattern = /\{[^{}]*"@type"\s*:\s*"JobPosting"[^{}]*\}/g
    let block: RegExpExecArray | null

    while ((block = jsonLdBlockPattern.exec(html)) !== null) {
      const titleMatch = /"title"\s*:\s*"([^"]+)"/.exec(block[0])
      const descMatch = /"description"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(block[0])
      if (!titleMatch) continue
      const title = titleMatch[1].trim()
      if (!title || seen.has(title) || isJunkTitle(title)) continue
      const description = stripHtml(descMatch ? descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : '')
      if (description.length < 20) continue

      seen.add(title)
      jobs.push({
        title,
        company,
        location: 'Colorado Springs, CO',
        description,
        apply_url: url,
        source_id: `career-${company.replace(/\s+/g, '-').toLowerCase()}-${jobs.length}`,
      })
      if (jobs.length >= 8) break
    }

    return jobs
  } catch { return [] }
}

// Known Greenhouse slugs for major employers
const GREENHOUSE_EMPLOYERS: Record<string, string> = {
  'Chipotle': 'chipotle',
  'Five Guys': 'fiveguys',
  'Noodles & Company': 'noodlescompany',
}

// Known Lever slugs
const LEVER_EMPLOYERS: Record<string, string> = {
  // add as discovered
}

export async function scrapeAllEmployerCareerPages(): Promise<ScrapedCareerJob[]> {
  const results: ScrapedCareerJob[] = []

  // Run in batches of 10 to avoid overwhelming servers
  const BATCH_SIZE = 10
  for (let i = 0; i < COS_EMPLOYERS.length; i += BATCH_SIZE) {
    const batch = COS_EMPLOYERS.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async ({ company, url }) => {
        // Try Greenhouse API first
        if (GREENHOUSE_EMPLOYERS[company]) {
          return scrapeGreenhouse(company, GREENHOUSE_EMPLOYERS[company])
        }
        // Try Lever API
        if (LEVER_EMPLOYERS[company]) {
          return scrapeLever(company, LEVER_EMPLOYERS[company])
        }
        // Fall back to generic HTML scrape
        return scrapeGenericCareerPage(company, url)
      })
    )
    results.push(...batchResults.flatMap(r => r.status === 'fulfilled' ? r.value : []))
  }

  // Deduplicate
  const seen = new Set<string>()
  return results.filter(j => {
    if (seen.has(j.source_id)) return false
    seen.add(j.source_id)
    return true
  })
}
