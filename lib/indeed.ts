// Indeed scraper — largest job board, no API needed
// Uses fetch() with browser headers to get public search results

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
}

export interface IndeedJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  salary?: string
  job_key: string
}

const SEARCHES = [
  { q: 'part time', radius: '25' },
  { q: 'cashier', radius: '25' },
  { q: 'crew member', radius: '25' },
  { q: 'team member entry level', radius: '25' },
  { q: 'no experience required', radius: '25' },
  { q: 'seasonal summer', radius: '25' },
  { q: 'food service', radius: '25' },
  { q: 'retail associate', radius: '25' },
]

function parseIndeedJobs(html: string): IndeedJob[] {
  const jobs: IndeedJob[] = []

  // Indeed embeds job data as JSON in a window._initialData or similar structure
  // Also parse from the job cards in HTML

  // Method 1: Extract from JSON in script tags (most reliable)
  const jsonPatterns = [
    /window\._initialData\s*=\s*({[\s\S]*?});\s*<\/script>/,
    /"jobKeysWithQuestionsMap":\s*({[\s\S]*?}),/,
    /"results":\s*(\[[\s\S]*?\])\s*[,}]/,
  ]

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        // Navigate the Indeed data structure
        const jobList = data?.results || data?.jobCards || []
        for (const job of Array.isArray(jobList) ? jobList.slice(0, 20) : []) {
          if (!job.title && !job.jobTitle) continue
          jobs.push({
            title: job.title || job.jobTitle || '',
            company: job.company || job.companyName || '',
            location: job.formattedLocation || job.location || 'Colorado Springs, CO',
            description: job.snippet || job.description || '',
            apply_url: job.link ? `https://www.indeed.com${job.link}` : 'https://www.indeed.com',
            salary: job.salary || job.salarySnippet?.text || '',
            job_key: job.jobkey || job.jobKey || `${job.company}-${job.title}`,
          })
        }
        if (jobs.length > 0) return jobs
      } catch { /* try next pattern */ }
    }
  }

  // Method 2: Parse job titles from HTML structure
  const titlePattern = /data-testid="job-title"[^>]*><[^>]+>([^<]+)<\/[^>]+>/g
  const companyPattern = /data-testid="company-name"[^>]*>([^<]+)</g
  const locationPattern = /data-testid="text-location"[^>]*>([^<]+)</g

  const titles: string[] = []
  const companies: string[] = []
  const locations: string[] = []

  let m
  while ((m = titlePattern.exec(html)) !== null) titles.push(m[1].trim())
  while ((m = companyPattern.exec(html)) !== null) companies.push(m[1].trim())
  while ((m = locationPattern.exec(html)) !== null) locations.push(m[1].trim())

  for (let i = 0; i < titles.length; i++) {
    jobs.push({
      title: titles[i] || '',
      company: companies[i] || '',
      location: locations[i] || 'Colorado Springs, CO',
      description: '',
      apply_url: 'https://www.indeed.com/jobs?q=&l=Colorado+Springs%2C+CO',
      job_key: `indeed-${i}-${titles[i]}`.replace(/\s+/g, '-').toLowerCase().slice(0, 80),
    })
  }

  return jobs
}

export async function fetchIndeedJobs(): Promise<IndeedJob[]> {
  const results: IndeedJob[] = []
  const seen = new Set<string>()

  for (const search of SEARCHES) {
    try {
      const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(search.q)}&l=Colorado+Springs%2C+CO&radius=${search.radius}&fromage=14&limit=50`
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue

      const html = await res.text()
      const jobs = parseIndeedJobs(html)

      for (const job of jobs) {
        if (!job.title || seen.has(job.job_key)) continue
        seen.add(job.job_key)
        results.push(job)
      }
    } catch { /* continue */ }
  }

  return results
}
