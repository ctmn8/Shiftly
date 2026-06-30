// Employer career page scraper — runs in GitHub Actions with real Playwright browser
// Scrapes 20 COS employer career pages, pushes results to Supabase
// GitHub's IPs are trusted, far less likely to be blocked than Vercel

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const EMPLOYERS = [
  { company: "Dutch Bros Coffee",  url: 'https://careers.dutchbros.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "King Soopers",       url: 'https://jobs.kroger.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Walmart",            url: 'https://careers.walmart.com/results?q=&l=Colorado+Springs%2C+CO&radius=25mi&partTime=true' },
  { company: "Target",             url: 'https://jobs.target.com/search?q=&l=Colorado+Springs%2C+CO&radius=15mi' },
  { company: "McDonald's",         url: 'https://careers.mcdonalds.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO' },
  { company: "Chick-fil-A",        url: 'https://www.chick-fil-a.com/careers/restaurant-careers', timeout: 35000 },
  { company: "Starbucks",          url: 'https://www.starbucks.com/careers/find-a-job/' },
  { company: "Chipotle",           url: 'https://jobs.chipotle.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Raising Cane's",     url: 'https://www.raisingcanes.com/crewmember-positions/' },
  { company: "Five Guys",          url: 'https://jobs.fiveguys.com/search/jobs?location=Colorado+Springs%2C+CO', timeout: 35000 },
  { company: "Hobby Lobby",        url: 'https://careers.hobbylobby.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "PetSmart",           url: 'https://jobs.petsmart.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "AMC Theaters",       url: 'https://careers.amctheatres.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Cheyenne Mtn Zoo",   url: 'https://www.cmzoo.org/explore/jobs/' },
  { company: "Apogee Rocketry",    url: 'https://www.apogeerockets.com/about/employment' },
  { company: "The Broadmoor",      url: 'https://www.broadmoor.com/about-the-broadmoor/careers/' },
  { company: "Panera Bread",       url: 'https://jobs.panerabread.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Five Below",         url: 'https://careers.fivebelow.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "GameStop",           url: 'https://jobs.gamestop.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Dollar Tree",        url: 'https://careers.dollartree.com/job-search-results/?location=Colorado+Springs%2C+CO' },
]

// Pre-filter — same rules as groq.ts
const TITLE_HARD_BLOCK = ['bartender','cannabis','dispensary','security guard','casino dealer','meat cutter','forklift','cdl driver','truck driver','attorney','registered nurse','software engineer','financial analyst']

// Nav/boilerplate titles that JSON-LD job boards occasionally mislabel.
// Defense in depth even though we only trust structured JobPosting data now.
const TITLE_JUNK = ['sign in','search all','see all','who we are','corporate','linkedin','instagram','privacy notice','english','home','login','apply now','external link']

function isBlocked(title) {
  const t = title.toLowerCase()
  return TITLE_HARD_BLOCK.some(w => t.includes(w)) || TITLE_JUNK.some(w => t.includes(w))
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

async function scrapeEmployer(browser, { company, url, timeout = 20000 }) {
  const page = await browser.newPage()
  const results = []

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout })
    await page.waitForTimeout(2000)

    // Only trust JSON-LD structured JobPosting data — it's the one source that
    // reliably ties a real job posting to a real description. Generic CSS
    // selectors used to pick up nav links ("Sign In", "Who We Are", PDFs,
    // social links) and show them as fake job cards. Not worth the noise.
    const jobs = await page.evaluate(() => {
      const found = []
      const seen = new Set()

      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const data = JSON.parse(script.textContent)
          const items = Array.isArray(data) ? data : [data]
          items.forEach(item => {
            if (item['@type'] === 'JobPosting' && item.title && !seen.has(item.title)) {
              seen.add(item.title)
              found.push({ title: item.title, href: item.url || '', description: item.description || '' })
            }
          })
        } catch {}
      })

      return found.slice(0, 10)
    })

    for (const job of jobs) {
      const description = stripHtml(job.description)
      if (!isBlocked(job.title) && description.length > 20) {
        results.push({
          title: job.title,
          company,
          location: 'Colorado Springs, CO',
          description,
          apply_url: job.href || url,
          source: 'scrape',
          source_id: `scrape-${company}-${job.title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100),
          min_age: 16,
          tags: [],
          job_type: 'in-person',
        })
      }
    }

    console.log(`  ${company}: ${results.length} jobs found`)
  } catch (err) {
    console.log(`  ${company}: failed (${err.message?.slice(0, 60)})`)
  } finally {
    await page.close()
  }

  return results
}

async function main() {
  console.log('Starting employer scraper with Playwright...')

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const allJobs = []
  for (const employer of EMPLOYERS) {
    const jobs = await scrapeEmployer(browser, employer)
    allJobs.push(...jobs)
  }

  await browser.close()
  console.log(`\nTotal scraped: ${allJobs.length} jobs`)

  if (allJobs.length === 0) {
    console.log('No jobs to insert')
    return
  }

  // Dedup against existing
  const sourceIds = allJobs.map(j => j.source_id)
  const { data: existing } = await supabase.from('jobs').select('source_id').in('source_id', sourceIds)
  const existingSet = new Set((existing || []).map(r => r.source_id))
  const newJobs = allJobs.filter(j => !existingSet.has(j.source_id))

  console.log(`New jobs after dedup: ${newJobs.length}`)

  if (newJobs.length > 0) {
    const { error } = await supabase.from('jobs').insert(newJobs)
    if (error) console.error('Insert error:', error.message)
    else console.log(`✓ Inserted ${newJobs.length} jobs from employer scraper`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
