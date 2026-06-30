// Employer career page scraper — uses ScraperAPI to render JS-heavy pages
// and bypass bot detection. Works in Vercel serverless (no binary needed).
// Get free key (5000 req/month): https://www.scraperapi.com
//
// Until SCRAPERAPI_KEY is set, falls back to direct fetch with browser headers.

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY
const COS_EMPLOYERS = [
  { company: "Dutch Bros Coffee",    url: 'https://careers.dutchbros.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "King Soopers",         url: 'https://jobs.kroger.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Walmart",              url: 'https://careers.walmart.com/results?q=&l=Colorado+Springs%2C+CO&radius=25mi&partTime=true' },
  { company: "Target",               url: 'https://jobs.target.com/search?q=&l=Colorado+Springs%2C+CO&radius=15mi&parttime=true' },
  { company: "McDonald's",           url: 'https://careers.mcdonalds.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO&radius=25' },
  { company: "Chick-fil-A",          url: 'https://www.chick-fil-a.com/careers/restaurant-careers?q=&l=Colorado+Springs' },
  { company: "Starbucks",            url: 'https://www.starbucks.com/careers/find-a-job/' },
  { company: "Chipotle",             url: 'https://jobs.chipotle.com/search/jobs?location=Colorado+Springs%2C+CO&radius=25' },
  { company: "Raising Cane's",       url: 'https://www.raisingcanes.com/crewmember-positions/?location=Colorado+Springs' },
  { company: "Five Guys",            url: 'https://jobs.fiveguys.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Hobby Lobby",          url: 'https://careers.hobbylobby.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "PetSmart",             url: 'https://jobs.petsmart.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "AMC Theaters",         url: 'https://careers.amctheatres.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Cheyenne Mtn Zoo",     url: 'https://www.cmzoo.org/explore/jobs/' },
  { company: "Apogee Rocketry",      url: 'https://www.apogeerockets.com/about/employment' },
  { company: "The Broadmoor",        url: 'https://www.broadmoor.com/about-the-broadmoor/careers/' },
  { company: "Dollar Tree",          url: 'https://careers.dollartree.com/job-search-results/?location=Colorado+Springs%2C+CO' },
  { company: "Five Below",           url: 'https://careers.fivebelow.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "GameStop",             url: 'https://jobs.gamestop.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Panera Bread",         url: 'https://jobs.panerabread.com/search-jobs?location=Colorado+Springs%2C+CO&radius=25' },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export interface EmployerJob {
  title: string
  company: string
  location: string
  apply_url: string
  source_id: string
}

async function fetchPage(url: string): Promise<string> {
  // Use ScraperAPI if available — renders JS and bypasses bot detection
  const targetUrl = SCRAPERAPI_KEY
    ? `https://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&render=true`
    : url

  const res = await fetch(targetUrl, {
    headers: SCRAPERAPI_KEY ? {} : HEADERS,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return ''
  return res.text()
}

function extractJobsFromHtml(html: string, company: string, applyUrl: string): EmployerJob[] {
  const jobs: EmployerJob[] = []
  const seen = new Set<string>()

  // Try JSON-LD structured data first (most reliable across sites)
  const jsonLdPattern = /"@type"\s*:\s*"JobPosting"[\s\S]*?"title"\s*:\s*"([^"]+)"/g
  let m: RegExpExecArray | null

  while ((m = jsonLdPattern.exec(html)) !== null) {
    const title = m[1].trim()
    if (title && !seen.has(title)) {
      seen.add(title)
      jobs.push({ title, company, location: 'Colorado Springs, CO', apply_url: applyUrl, source_id: `emp-${company}-${title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100) })
    }
    if (jobs.length >= 8) break
  }

  if (jobs.length > 0) return jobs

  // Common ATS title patterns
  const patterns = [
    /data-automation-id="[^"]*jobTitle[^"]*"[^>]*>([^<]{4,80})/g,
    /class="[^"]*job[^"]*title[^"]*"[^>]*>([^<]{4,80})/gi,
    /class="[^"]*position[^"]*title[^"]*"[^>]*>([^<]{4,80})/gi,
    /<h[23][^>]*>([^<]{4,60}(?:member|associate|crew|cashier|cook|barista|stocker|host|clerk|server)[^<]{0,40})<\/h[23]>/gi,
  ]

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags)
    while ((m = re.exec(html)) !== null) {
      const title = m[1].trim().replace(/\s+/g, ' ')
      if (title.length >= 4 && !seen.has(title)) {
        seen.add(title)
        jobs.push({ title, company, location: 'Colorado Springs, CO', apply_url: applyUrl, source_id: `emp-${company}-${title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100) })
      }
      if (jobs.length >= 8) break
    }
    if (jobs.length > 0) break
  }

  // If nothing parsed but page mentions hiring, add the company as a "check their site" entry
  if (jobs.length === 0 && /apply|hiring|career|position|opening|join/i.test(html)) {
    jobs.push({
      title: 'Open Positions — Check Website',
      company,
      location: 'Colorado Springs, CO',
      apply_url: applyUrl,
      source_id: `emp-${company}-check`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    })
  }

  return jobs
}

export async function scrapeEmployerJobs(): Promise<EmployerJob[]> {
  if (!SCRAPERAPI_KEY) {
    console.log('[scrape-employers] No SCRAPERAPI_KEY — using direct fetch (may be blocked)')
  }

  const results: EmployerJob[] = []

  // Process in small batches to avoid overwhelming ScraperAPI rate limits
  const BATCH = 5
  for (let i = 0; i < COS_EMPLOYERS.length; i += BATCH) {
    const batch = COS_EMPLOYERS.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(
      batch.map(async ({ company, url }) => {
        try {
          const html = await fetchPage(url)
          return extractJobsFromHtml(html, company, url)
        } catch {
          return []
        }
      })
    )
    results.push(...batchResults.flatMap(r => r.status === 'fulfilled' ? r.value : []))

    // Small delay between batches to be respectful
    if (i + BATCH < COS_EMPLOYERS.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  return results.filter(j => {
    if (seen.has(j.source_id)) return false
    seen.add(j.source_id)
    return true
  })
}
