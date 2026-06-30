// Employer career page scraper — runs in GitHub Actions with real Playwright browser
// Two-hop scrape (see scripts/lib/two-hop-scraper.mjs): follows job-detail links
// instead of trusting the search/listing page to carry structured data.

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { scrapeEmployerTwoHop } from './lib/two-hop-scraper.mjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const EMPLOYERS = [
  { company: "Dutch Bros Coffee",  url: 'https://careers.dutchbros.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "King Soopers",       url: 'https://jobs.kroger.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Walmart",            url: 'https://careers.walmart.com/results?q=&l=Colorado+Springs%2C+CO&radius=25mi&partTime=true' },
  { company: "Target",             url: 'https://corporate.target.com/careers/working-at-target/stores' },
  { company: "McDonald's",         url: 'https://www.mcdonalds.com/us/en-us/careers.html' },
  { company: "Chick-fil-A",        url: 'https://www.chick-fil-a.com/careers/restaurant-careers', timeout: 35000 },
  { company: "Starbucks",          url: 'https://www.starbucks.com/careers/find-a-job/' },
  { company: "Chipotle",           url: 'https://jobs.chipotle.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Raising Cane's",     url: 'https://www.raisingcanes.com/crewmember-positions/' },
  { company: "Five Guys",          url: 'https://jobs.fiveguys.com/search/jobs?location=Colorado+Springs%2C+CO', timeout: 35000 },
  { company: "Hobby Lobby",        url: 'https://www.hobbylobby.com/careers' },
  { company: "PetSmart",           url: 'https://jobs.petsmart.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "AMC Theaters",       url: 'https://careers.amctheatres.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Cheyenne Mtn Zoo",   url: 'https://www.cmzoo.org/explore/jobs/' },
  { company: "Apogee Rocketry",    url: 'https://www.apogeerockets.com/about/employment' },
  { company: "The Broadmoor",      url: 'https://www.broadmoor.com/about-the-broadmoor/careers/' },
  { company: "Panera Bread",       url: 'https://jobs.panerabread.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Five Below",         url: 'https://careers.fivebelow.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "GameStop",           url: 'https://jobs.gamestop.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Dollar Tree",        url: 'https://careers.dollartree.com/job-search-results/?location=Colorado+Springs%2C+CO' },
  { company: "Sprouts",            url: 'https://careers.sprouts.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Great Wolf Lodge",   url: 'https://jobs.greatwolf.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Life Time",          url: 'https://jobs.lifetime.life/search-jobs?location=Colorado+Springs%2C+CO' },
]

async function main() {
  console.log('Starting two-hop employer scraper with Playwright...')

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const allJobs = []
  for (const employer of EMPLOYERS) {
    const jobs = await scrapeEmployerTwoHop(browser, { ...employer, sourcePrefix: 'scrape' })
    allJobs.push(...jobs)
  }

  await browser.close()
  console.log(`\nTotal scraped: ${allJobs.length} jobs`)

  if (allJobs.length === 0) {
    console.log('No jobs to insert')
    return
  }

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
