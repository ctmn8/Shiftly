// Additional job boards — Monster, CareerBuilder, Glassdoor, ConnectingColorado, Handshake, Jobcase

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

export interface BoardJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  salary?: string
  source_id: string
}

function parseJsonFromHtml(html: string, patterns: RegExp[]): any[] {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        if (Array.isArray(data) && data.length > 0) return data
        if (data?.jobs) return data.jobs
        if (data?.results) return data.results
        if (data?.data) return data.data
      } catch { /* try next */ }
    }
  }
  return []
}

// Monster.com — one of the original job boards, still big
async function fetchMonster(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.monster.com/jobs/search?q=part+time+entry+level&where=Colorado+Springs%2C+CO&radius=25&tm=14',
    'https://www.monster.com/jobs/search?q=cashier+team+member&where=Colorado+Springs%2C+CO&radius=25',
    'https://www.monster.com/jobs/search?q=crew+member+food+service&where=Colorado+Springs%2C+CO&radius=25',
    'https://www.monster.com/jobs/search?q=retail+associate+stocker&where=Colorado+Springs%2C+CO&radius=25',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const jobs = parseJsonFromHtml(html, [
        /"jobResults"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?});\s*<\/script>/,
      ])

      for (const job of jobs.slice(0, 20)) {
        const id = `monster-${job.jobId || job.id || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || job.jobTitle || '',
          company: job.company?.name || job.companyName || '',
          location: job.location || 'Colorado Springs, CO',
          description: job.snippet || job.descriptionTeaser || '',
          apply_url: job.jobUrl || job.applyUrl || url,
          salary: job.salary || '',
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// CareerBuilder — large board with good hourly coverage
async function fetchCareerBuilder(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.careerbuilder.com/jobs?keywords=part+time+entry+level&location=Colorado+Springs%2C+CO&radius=25&posted=7',
    'https://www.careerbuilder.com/jobs?keywords=cashier+team+member&location=Colorado+Springs%2C+CO&radius=25',
    'https://www.careerbuilder.com/jobs?keywords=crew+member+no+experience&location=Colorado+Springs%2C+CO&radius=25',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const jobs = parseJsonFromHtml(html, [
        /"job_list"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
      ])

      for (const job of jobs.slice(0, 20)) {
        const id = `cb-${job.job_did || job.id || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company_name || job.company || '',
          location: job.location || 'Colorado Springs, CO',
          description: job.description_teaser || '',
          apply_url: job.job_url || url,
          salary: job.salary_offered || '',
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Glassdoor — jobs with company reviews
async function fetchGlassdoor(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.glassdoor.com/Job/colorado-springs-part-time-jobs-SRCH_IL.0,16_IC1148171_KO17,26.htm',
    'https://www.glassdoor.com/Job/colorado-springs-entry-level-jobs-SRCH_IL.0,16_IC1148171_KO17,28.htm',
    'https://www.glassdoor.com/Job/colorado-springs-no-experience-jobs-SRCH_IL.0,16_IC1148171_KO17,30.htm',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      // Glassdoor embeds jobs in a script tag
      const jobs = parseJsonFromHtml(html, [
        /"jobListings"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"applyUrl"\s*:\s*"[^"]+"/g,
      ])

      for (const job of jobs.slice(0, 20)) {
        const id = `gd-${job.jobListingId || job.id || job.jobTitle}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.jobTitle || job.title || '',
          company: job.employer?.name || job.company || '',
          location: job.location || 'Colorado Springs, CO',
          description: job.jobDescriptionText?.slice(0, 300) || '',
          apply_url: job.applyUrl || url,
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// ConnectingColorado.com — official Colorado state workforce job board
// Real government program specifically for Colorado workers
async function fetchConnectingColorado(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const urls = [
    // Colorado Workforce Development job search for El Paso County (COS area)
    'https://www.connectingcolorado.com/vosnet/jobbanks/jobsearch.aspx?enc=W5QMFWnStpY%2BEhHSuMGdgA%3D%3D&County=08041&PartTime=true&Radius=25',
    'https://www.connectingcolorado.com/vosnet/jobbanks/jobsearch.aspx?enc=W5QMFWnStpY%2BEhHSuMGdgA%3D%3D&City=Colorado+Springs&State=CO&Radius=25&PartTime=true',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      // Extract job links and titles
      const pattern = /<a[^>]+href="([^"]*(?:jobdetail|job-detail)[^"]*)"[^>]*>([^<]{5,100})<\/a>/gi
      let m
      while ((m = pattern.exec(html)) !== null) {
        const [, href, title] = m
        const cleaned = title.trim()
        if (!cleaned || seen.has(href)) continue
        seen.add(href)
        results.push({
          title: cleaned,
          company: 'Colorado Springs Employer',
          location: 'Colorado Springs, CO',
          description: 'Posted on Colorado Workforce Center',
          apply_url: href.startsWith('http') ? href : `https://www.connectingcolorado.com${href}`,
          source_id: `ccco-${href}`.slice(0, 100),
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Jobcase.com — focused on hourly, blue-collar, and entry-level workers
async function fetchJobcase(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const urls = [
    'https://www.jobcase.com/search?q=part+time&l=Colorado+Springs%2C+CO&r=25',
    'https://www.jobcase.com/search?q=entry+level+no+experience&l=Colorado+Springs%2C+CO&r=25',
    'https://www.jobcase.com/search?q=cashier+crew+member&l=Colorado+Springs%2C+CO&r=25',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const jobs = parseJsonFromHtml(html, [
        /"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"results"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
      ])

      for (const job of jobs.slice(0, 20)) {
        const id = `jc-${job.id || job.job_id || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || job.job_title || '',
          company: job.company || job.employer || '',
          location: job.location || 'Colorado Springs, CO',
          description: job.description?.slice(0, 300) || '',
          apply_url: job.url || job.apply_url || url,
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// SimplyHired — aggregates from multiple sources
async function fetchSimplyHired(): Promise<BoardJob[]> {
  const results: BoardJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.simplyhired.com/search?q=part+time+entry+level&l=Colorado+Springs%2C+CO&radius=25&dateposted=14',
    'https://www.simplyhired.com/search?q=cashier+team+member&l=Colorado+Springs%2C+CO&radius=25',
    'https://www.simplyhired.com/search?q=no+experience+required&l=Colorado+Springs%2C+CO&radius=25',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      // SimplyHired embeds job data in JSON
      const jobs = parseJsonFromHtml(html, [
        /"jobResults"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
      ])

      for (const job of jobs.slice(0, 20)) {
        const id = `sh-${job.jobKey || job.id || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company || '',
          location: job.location || 'Colorado Springs, CO',
          description: job.snippet || '',
          apply_url: job.url || url,
          salary: job.salaryRange || '',
          source_id: id,
        })
      }
    } catch { /* continue */ }
  }

  return results
}

export async function fetchMoreBoardJobs(): Promise<BoardJob[]> {
  const [monster, careerbuilder, glassdoor, ccco, jobcase, simplyhired] = await Promise.allSettled([
    fetchMonster(),
    fetchCareerBuilder(),
    fetchGlassdoor(),
    fetchConnectingColorado(),
    fetchJobcase(),
    fetchSimplyHired(),
  ])

  return [
    ...(monster.status === 'fulfilled' ? monster.value : []),
    ...(careerbuilder.status === 'fulfilled' ? careerbuilder.value : []),
    ...(glassdoor.status === 'fulfilled' ? glassdoor.value : []),
    ...(ccco.status === 'fulfilled' ? ccco.value : []),
    ...(jobcase.status === 'fulfilled' ? jobcase.value : []),
    ...(simplyhired.status === 'fulfilled' ? simplyhired.value : []),
  ]
}
