// Remote and online job sources for teens
// Things you can do from your phone or laptop and actually get paid

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

export interface RemoteJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  pay_display?: string
  source_id: string
  job_type: 'remote' | 'internship'
}

// Indeed with remote filter — same board, much wider reach
async function fetchIndeedRemote(): Promise<RemoteJob[]> {
  const results: RemoteJob[] = []
  const seen = new Set<string>()

  const searches = [
    // Teen-appropriate remote work
    'https://www.indeed.com/jobs?q=remote+part+time+no+experience&l=&radius=25&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=remote+data+entry+no+experience&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=remote+customer+service+entry+level&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=remote+social+media+coordinator&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=online+tutor+high+school+student&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=remote+content+moderator+entry+level&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=virtual+assistant+part+time+no+experience&remotejob=1&fromage=14&limit=50',
    'https://www.indeed.com/jobs?q=remote+chat+support+no+experience&remotejob=1&fromage=14&limit=50',
    // Colorado-based remote
    'https://www.indeed.com/jobs?q=remote+part+time&l=Colorado&remotejob=1&fromage=14&limit=50',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const jsonMatch = html.match(/"jobResults"\s*:\s*(\[[\s\S]*?\])\s*[,}]/) ||
                        html.match(/"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
      if (!jsonMatch) continue

      const jobs = JSON.parse(jsonMatch[1])
      for (const job of jobs.slice(0, 15)) {
        const id = `remote-indeed-${job.jobkey || job.jobKey || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company || '',
          location: 'Remote',
          description: job.snippet || '',
          apply_url: job.link ? `https://www.indeed.com${job.link}` : url,
          pay_display: job.salary || undefined,
          source_id: id,
          job_type: 'remote',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// We Work Remotely — entry-level remote jobs
async function fetchWeWorkRemotely(): Promise<RemoteJob[]> {
  const results: RemoteJob[] = []
  const seen = new Set<string>()

  const urls = [
    'https://weworkremotely.com/categories/remote-customer-support-jobs.json',
    'https://weworkremotely.com/categories/remote-marketing-jobs.json',
    'https://weworkremotely.com/categories/remote-writing-editing-jobs.json',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data.jobs || []

      for (const job of jobs.slice(0, 10)) {
        const id = `wwr-${job.slug || job.id}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company || '',
          location: 'Remote',
          description: job.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
          apply_url: job.url || `https://weworkremotely.com${job.url}`,
          source_id: id,
          job_type: 'remote',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Remote.co — curated remote jobs including entry-level
async function fetchRemoteCo(): Promise<RemoteJob[]> {
  const results: RemoteJob[] = []
  const seen = new Set<string>()

  const urls = [
    'https://remote.co/remote-jobs/customer-service/',
    'https://remote.co/remote-jobs/data-entry/',
    'https://remote.co/remote-jobs/social-media/',
    'https://remote.co/remote-jobs/writing/',
    'https://remote.co/remote-jobs/tutoring-teaching/',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const pattern = /<a[^>]+class="[^"]*job[^"]*"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/gi
      let m
      while ((m = pattern.exec(html)) !== null) {
        const [, href, title, company] = m
        const id = `remoteco-${href}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: title.trim(),
          company: company.trim(),
          location: 'Remote',
          description: '',
          apply_url: href.startsWith('http') ? href : `https://remote.co${href}`,
          source_id: id,
          job_type: 'remote',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Adzuna remote filter — same API key, different query
async function fetchAdzunaRemote(): Promise<RemoteJob[]> {
  const APP_ID = process.env.ADZUNA_APP_ID!
  const APP_KEY = process.env.ADZUNA_APP_KEY!
  const BASE = 'https://api.adzuna.com/v1/api/jobs/us/search'
  const results: RemoteJob[] = []
  const seen = new Set<string>()

  const queries = [
    'remote part time no experience',
    'remote data entry',
    'remote customer service entry level',
    'online tutor part time',
    'remote social media assistant',
    'work from home chat support',
    'remote content moderator',
    'virtual assistant no experience',
  ]

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        app_id: APP_ID,
        app_key: APP_KEY,
        results_per_page: '20',
        what: query,
        what_or: 'remote work from home online virtual',
        distance: '0',
        sort_by: 'date',
        max_days_old: '14',
      })
      const res = await fetch(`${BASE}/1?${params}`)
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.results ?? [])) {
        // Only include if description mentions remote
        const isRemote = /remote|work from home|wfh|online|virtual|anywhere/i.test(
          (job.description ?? '') + (job.title ?? '') + (job.location?.display_name ?? '')
        )
        if (!isRemote) continue

        const id = `remote-adzuna-${job.id}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title,
          company: job.company.display_name,
          location: 'Remote',
          description: job.description?.slice(0, 300) || '',
          apply_url: job.redirect_url,
          pay_display: job.salary_min ? `$${Math.round(job.salary_min / 2080)}/hr` : undefined,
          source_id: id,
          job_type: 'remote',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Specific platforms known to hire teens remotely
const TEEN_REMOTE_PLATFORMS = [
  {
    company: 'Wyzant',
    title: 'Online Tutor (Math, Science, English)',
    description: 'Tutor students in subjects you excel at. Set your own hours, teach from home. Wyzant connects tutors with students and takes a commission. Great for teens who do well in school.',
    url: 'https://www.wyzant.com/tutors/signup',
    pay: '$20-50/hr',
  },
  {
    company: 'Tutor.com',
    title: 'Online Homework Tutor',
    description: 'Help K-12 students with homework online. Work from home on your schedule. Must be 18 — apply now for when you turn 18.',
    url: 'https://www.tutor.com/apply',
    pay: '$12-15/hr',
  },
  {
    company: 'Varsity Tutors',
    title: 'Online Academic Tutor',
    description: 'Tutor students online in subjects you know. Flexible hours, work from home. Excellent for teens with strong grades.',
    url: 'https://www.varsitytutors.com/tutors',
    pay: '$15-40/hr',
  },
  {
    company: 'Rev',
    title: 'Transcriptionist / Caption Writer',
    description: 'Convert audio and video to text. Work from home on your own schedule. Must be 18 — but start the application process now.',
    url: 'https://www.rev.com/freelancers',
    pay: '$0.45-1.10/min of audio',
  },
  {
    company: 'Fiverr',
    title: 'Freelance Designer / Video Editor / Writer',
    description: 'Sell services online: graphic design, video editing, social media posts, writing. Under 18 needs parent account. One of the best ways to earn online as a teen.',
    url: 'https://www.fiverr.com/start_selling',
    pay: '$5-200/project',
  },
  {
    company: 'Etsy',
    title: 'Online Shop — Sell Handmade / Digital Products',
    description: 'Sell art, crafts, digital downloads, or print-on-demand items. No minimum age with parent permission. Many teens make $200-1000/month.',
    url: 'https://www.etsy.com/sell',
    pay: 'Variable — keep ~80% of each sale',
  },
  {
    company: 'UserTesting',
    title: 'Website / App Tester',
    description: 'Test websites and apps and give feedback via screen recording. $10/test, tests take 20 min. Must be 18 — plan for when you turn 18.',
    url: 'https://www.usertesting.com/be-a-user-tester',
    pay: '$10/20-min test',
  },
  {
    company: 'Amazon Mechanical Turk',
    title: 'Micro-Task Worker (Data / AI Training)',
    description: 'Complete small tasks: image labeling, surveys, data entry for AI companies. Must be 18.',
    url: 'https://www.mturk.com/worker',
    pay: '$6-15/hr depending on tasks',
  },
]

export async function fetchRemoteJobs(): Promise<RemoteJob[]> {
  const [indeedRemote, wwr, remoteCo, adzunaRemote] = await Promise.allSettled([
    fetchIndeedRemote(),
    fetchWeWorkRemotely(),
    fetchRemoteCo(),
    fetchAdzunaRemote(),
  ])

  const scraped = [
    ...(indeedRemote.status === 'fulfilled' ? indeedRemote.value : []),
    ...(wwr.status === 'fulfilled' ? wwr.value : []),
    ...(remoteCo.status === 'fulfilled' ? remoteCo.value : []),
    ...(adzunaRemote.status === 'fulfilled' ? adzunaRemote.value : []),
  ]

  // Add curated teen remote platforms as permanent listings
  const curated: RemoteJob[] = TEEN_REMOTE_PLATFORMS.map(p => ({
    title: p.title,
    company: p.company,
    location: 'Remote / Online',
    description: p.description,
    apply_url: p.url,
    pay_display: p.pay,
    source_id: `remote-platform-${p.company.replace(/\s+/g, '-').toLowerCase()}`,
    job_type: 'remote' as const,
  }))

  return [...scraped, ...curated]
}
