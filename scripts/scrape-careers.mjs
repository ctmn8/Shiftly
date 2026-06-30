// Career page scraper for additional employer sites via Playwright
// Two-hop scrape (see scripts/lib/two-hop-scraper.mjs): follows job-detail links
// instead of trusting the search/listing page to carry structured data.

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { scrapeEmployerTwoHop } from './lib/two-hop-scraper.mjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CAREER_PAGES = [
  { company: "Home Depot",       url: 'https://careers.homedepot.com/job-search-results/?q=Colorado%20Springs' },
  { company: "Lowe's",          url: 'https://jobs.lowes.com/search/?q=Colorado+Springs&location=Colorado+Springs%2C+CO' },
  { company: "CVS",             url: 'https://jobs.cvshealth.com/us/en/search-results?keywords=Colorado+Springs' },
  { company: "Walgreens",       url: 'https://jobs.walgreens.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO&radius=25' },
  { company: "Bath & Body Works", url: 'https://careers.bathandbodyworks.com/us/en/search-results?keywords=Colorado+Springs' },
  { company: "Kohl's",          url: 'https://careers.kohls.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Best Buy",        url: 'https://jobs.bestbuy.com/bby/jobs?q=&location=Colorado+Springs%2C+CO' },
  { company: "Ross",            url: 'https://jobs.rossstores.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Burlington",      url: 'https://jobs.burlingtonstores.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "AutoZone",        url: 'https://jobs.autozone.com/jobs?location=Colorado+Springs%2C+CO', timeout: 35000 },
  { company: "Sprouts",         url: 'https://careers.sprouts.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Natural Grocers", url: 'https://www.naturalgrocers.com/careers/?location=Colorado+Springs' },
  { company: "Safeway",         url: 'https://albertsons.wd5.myworkdayjobs.com/albertsons_careers?locationCountry=US&q=Colorado+Springs' },
  { company: "Dominos",         url: 'https://jobs.dominos.com/dominos/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Pizza Hut",       url: 'https://jobs.pizzahut.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Sonic",           url: 'https://jobs.sonicdrivein.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO' },
  { company: "Sky Zone",        url: 'https://skyzone.wd1.myworkdayjobs.com/SkyZone?location=Colorado+Springs' },
  { company: "Bowlero",         url: 'https://careers.bowlero.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Pikes Peak Summit", url: 'https://www.pikes-peak.com/jobs/' },
  { company: "Garden of the Gods", url: 'https://www.gardenofgods.com/employment/' },
]

async function main() {
  console.log('Starting two-hop career page scraper (GitHub Actions browser)...')

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const allJobs = []
  for (const employer of CAREER_PAGES) {
    const jobs = await scrapeEmployerTwoHop(browser, { ...employer, sourcePrefix: 'gha' })
    allJobs.push(...jobs)
  }

  await browser.close()
  console.log(`\nScraped ${allJobs.length} total jobs`)

  if (allJobs.length === 0) return

  const sourceIds = allJobs.map(j => j.source_id)
  const { data: existing } = await supabase.from('jobs').select('source_id').in('source_id', sourceIds)
  const existingSet = new Set((existing || []).map(r => r.source_id))
  const newJobs = allJobs.filter(j => !existingSet.has(j.source_id))

  console.log(`New after dedup: ${newJobs.length}`)

  if (newJobs.length > 0) {
    const { error } = await supabase.from('jobs').insert(newJobs)
    if (error) console.error('Insert error:', error.message)
    else console.log(`✓ Inserted ${newJobs.length} jobs`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
