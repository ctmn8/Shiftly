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

// Generic HTML scraper — extracts job titles from career pages
async function scrapeGenericCareerPage(company: string, url: string): Promise<ScrapedCareerJob[]> {
  try {
    const res = await fetchWithScraperAPI(url)
    if (!res.ok) return []
    const html = await res.text()

    // Check if page has Colorado Springs content
    const hasCOS = /colorado springs|cos|80903|80904|80905|80906|80907|80908|80909|80910|80911|80912|80913|80914|80915|80916|80917|80918|80919|80920|80921|80922|80923|80924|80925|80926|80927|80928|80929|80930|80931|80932|80933|80934|80935|80936|80937|80938|80939|80941|80942|80944|80945|80946|80947|80949|80950|80951|80960|80962|80977|80995|80997/i.test(html)

    // Extract job titles from common ATS patterns
    const patterns = [
      // Workday
      /data-automation-id="[^"]*jobTitle[^"]*"[^>]*>([^<]+)/gi,
      // Taleo
      /<span[^>]*class="[^"]*requisition[^"]*"[^>]*>([^<]+)<\/span>/gi,
      // SmartRecruiters
      /class="[^"]*job-item__name[^"]*"[^>]*>([^<]+)/gi,
      // iCIMS
      /class="[^"]*iCIMS_JobTitle[^"]*"[^>]*>([^<]+)/gi,
      // BambooHR
      /class="[^"]*BambooHR-ATS-Jobs-Item[^"]*"[\s\S]*?<h2[^>]*>([^<]+)/gi,
      // BreezyHR
      /class="[^"]*position[^"]*"[^>]*>[\s\n]*<h2[^>]*>([^<]+)/gi,
      // Generic job title patterns
      /<h[23][^>]*class="[^"]*(?:job|position|role|title|opening)[^"]*"[^>]*>([^<]{5,80})</gi,
    ]

    const titles: string[] = []
    for (const pattern of patterns) {
      let m
      const re = new RegExp(pattern.source, pattern.flags)
      while ((m = re.exec(html)) !== null) {
        const t = m[1].trim().replace(/\s+/g, ' ')
        if (t.length >= 3 && t.length <= 100 && !titles.includes(t)) {
          titles.push(t)
        }
        if (titles.length >= 10) break
      }
      if (titles.length >= 3) break
    }

    if (titles.length === 0) {
      // If we can't extract specific jobs but the page exists and mentions COS or jobs,
      // add a "check their site" entry so teens know this company is worth checking
      const mentionsJobs = /apply|career|job|position|opening|hiring|join our team|join us/i.test(html)
      if (mentionsJobs) {
        return [{
          title: 'Open Positions — Check Website',
          company,
          location: 'Colorado Springs, CO',
          description: `${company} is hiring in Colorado Springs. Visit their careers page for current openings.`,
          apply_url: url,
          source_id: `career-${company.replace(/\s+/g, '-').toLowerCase()}`,
        }]
      }
      return []
    }

    return titles.map((title, i) => ({
      title,
      company,
      location: 'Colorado Springs, CO',
      description: '',
      apply_url: url,
      source_id: `career-${company.replace(/\s+/g, '-').toLowerCase()}-${i}`,
    }))
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
