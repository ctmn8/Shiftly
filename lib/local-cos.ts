// Direct scraping of COS-specific job sources and local business career pages
// No API key needed — uses fetch() + HTML parsing
// Catches jobs that never appear on major job boards

export interface LocalJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  source_id: string
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Known local COS businesses that hire teens and post on their own sites
const LOCAL_EMPLOYERS = [
  { company: 'Apogee Rocketry', url: 'https://www.apogeerockets.com/about/employment', name_hint: 'rocketry' },
  { company: 'Cheyenne Mountain Zoo', url: 'https://www.cmzoo.org/explore/jobs/', name_hint: 'zoo' },
  { company: 'Pikes Peak State Park', url: 'https://parks.colorado.gov/about/employment', name_hint: 'state park' },
  { company: 'Garden of the Gods', url: 'https://www.gardenofgods.com/about/employment', name_hint: 'garden of gods' },
  { company: 'ProRodeo Hall of Fame', url: 'https://prorodeohalloffame.com/employment/', name_hint: 'rodeo' },
  { company: 'United States Air Force Academy', url: 'https://www.usafa.af.mil/Careers/', name_hint: 'air force' },
  { company: 'Pikes Peak Summit Visitor Center', url: 'https://www.pikes-peak.com/jobs/', name_hint: 'pikes peak' },
  { company: 'Western Museum of Mining', url: 'https://www.wmmi.org/', name_hint: 'museum mining' },
  { company: 'Ivywild School', url: 'https://ivywild.com/', name_hint: 'ivywild' },
  { company: 'Colorado Springs Switchbacks FC', url: 'https://www.switchbacksfc.com/jobs', name_hint: 'soccer' },
]

// Snagajob — focuses specifically on hourly/part-time workers, great for teens
const SNAGAJOB_SEARCHES = [
  'https://www.snagajob.com/jobs/?location=Colorado+Springs%2C+CO&radius=15&partTime=true',
  'https://www.snagajob.com/jobs/?location=Colorado+Springs%2C+CO&radius=15&keyword=cashier',
  'https://www.snagajob.com/jobs/?location=Colorado+Springs%2C+CO&radius=15&keyword=crew+member',
  'https://www.snagajob.com/jobs/?location=Colorado+Springs%2C+CO&radius=25',
]

function extractJobsFromHtml(html: string, company: string, baseUrl: string): LocalJob[] {
  const jobs: LocalJob[] = []

  // Look for common job listing patterns in HTML
  const patterns = [
    // JSON-LD structured data (most reliable)
    /"@type"\s*:\s*"JobPosting"[\s\S]*?"title"\s*:\s*"([^"]+)"/g,
    // Common job board HTML patterns
    /class="[^"]*job[^"]*title[^"]*"[^>]*>([^<]+)</gi,
    /class="[^"]*position[^"]*"[^>]*>([^<]+)</gi,
    /<h[23][^>]*>([^<]*(?:associate|team member|cashier|crew|barista|server|host|clerk)[^<]*)<\/h[23]>/gi,
  ]

  for (const pattern of patterns) {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(html)) !== null) {
      const title = match[1].trim().replace(/\s+/g, ' ')
      if (title.length < 3 || title.length > 100) continue
      if (/^\d+$/.test(title)) continue

      const id = `local-${company}-${title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100)
      jobs.push({
        title,
        company,
        location: 'Colorado Springs, CO',
        description: `Position at ${company} in Colorado Springs.`,
        apply_url: baseUrl,
        source_id: id,
      })

      if (jobs.length >= 5) break
    }
    if (jobs.length >= 5) break
  }

  return jobs
}

async function scrapeSnagajob(): Promise<LocalJob[]> {
  const results: LocalJob[] = []
  const seen = new Set<string>()

  for (const url of SNAGAJOB_SEARCHES) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      // Extract from Snagajob's job cards
      // They embed job data as JSON in script tags
      const jsonMatch = html.match(/"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
      if (jsonMatch) {
        try {
          const jobs = JSON.parse(jsonMatch[1])
          for (const job of jobs.slice(0, 20)) {
            const id = `snagajob-${job.id || job.jobId || job.title}`
            if (seen.has(id)) continue
            seen.add(id)
            results.push({
              title: job.title || job.jobTitle || '',
              company: job.employer?.name || job.companyName || '',
              location: job.location?.city ? `${job.location.city}, ${job.location.state}` : 'Colorado Springs, CO',
              description: job.description?.slice(0, 300) || '',
              apply_url: job.jobDetailUrl || url,
              source_id: id,
            })
          }
        } catch { /* continue */ }
      }
    } catch { /* continue */ }
  }

  return results
}

async function scrapeLocalEmployer(employer: typeof LOCAL_EMPLOYERS[0]): Promise<LocalJob[]> {
  try {
    const res = await fetch(employer.url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const html = await res.text()

    // Check if the page mentions hiring at all
    const hiringKeywords = ['apply', 'career', 'job', 'position', 'opening', 'hiring', 'employment']
    const hasHiringContent = hiringKeywords.some(kw => html.toLowerCase().includes(kw))
    if (!hasHiringContent) return []

    return extractJobsFromHtml(html, employer.company, employer.url)
  } catch {
    return []
  }
}

// LocalHelpWanted — free local job board, good for small COS businesses
async function scrapeLocalHelpWanted(): Promise<LocalJob[]> {
  try {
    const res = await fetch('https://www.localhelpwanted.net/jobs-in-colorado-springs-co', { headers: HEADERS })
    if (!res.ok) return []
    const html = await res.text()

    const jobs: LocalJob[] = []
    const seen = new Set<string>()

    // Extract job listings from their HTML structure
    const listingPattern = /<a[^>]+href="([^"]+localhelpwanted[^"]+)"[^>]*>([^<]+)<\/a>/g
    let match
    while ((match = listingPattern.exec(html)) !== null) {
      const [, href, title] = match
      const cleaned = title.trim()
      if (cleaned.length < 3) continue

      const id = `lhw-${cleaned}`.toLowerCase().replace(/\s+/g, '-').slice(0, 80)
      if (seen.has(id)) continue
      seen.add(id)

      jobs.push({
        title: cleaned,
        company: 'Local Colorado Springs Business',
        location: 'Colorado Springs, CO',
        description: '',
        apply_url: href.startsWith('http') ? href : `https://www.localhelpwanted.net${href}`,
        source_id: id,
      })

      if (jobs.length >= 30) break
    }

    return jobs
  } catch {
    return []
  }
}

export async function fetchLocalCOSJobs(): Promise<LocalJob[]> {
  const [snagajob, localHelpWanted, ...localEmployers] = await Promise.allSettled([
    scrapeSnagajob(),
    scrapeLocalHelpWanted(),
    ...LOCAL_EMPLOYERS.map(e => scrapeLocalEmployer(e)),
  ])

  const results: LocalJob[] = [
    ...(snagajob.status === 'fulfilled' ? snagajob.value : []),
    ...(localHelpWanted.status === 'fulfilled' ? localHelpWanted.value : []),
    ...localEmployers.flatMap(r => r.status === 'fulfilled' ? r.value : []),
  ]

  return results
}
