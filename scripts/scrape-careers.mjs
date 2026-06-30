// Career page scraper for 80+ employer sites via Playwright
// Runs in GitHub Actions — real browser, GitHub IPs trusted by most sites

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Sample of key employer career pages beyond the basic 20
// These use JavaScript rendering so need a real browser
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
  { company: "Sprouts",         url: 'https://jobs.sprouts.com/jobs?location=Colorado+Springs%2C+CO' },
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

const TITLE_HARD_BLOCK = ['bartender','cannabis','dispensary','security guard','casino','meat cutter','forklift','cdl driver','truck driver','attorney','registered nurse','software engineer','financial analyst']

// Nav/boilerplate titles that JSON-LD job boards occasionally mislabel.
const TITLE_JUNK = ['sign in','search all','see all','who we are','corporate','linkedin','instagram','privacy notice','english','home','login','apply now','external link']

function isBlocked(title) {
  const t = title.toLowerCase()
  return TITLE_HARD_BLOCK.some(w => t.includes(w)) || TITLE_JUNK.some(w => t.includes(w))
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

async function scrapePage(browser, { company, url, timeout = 25000 }) {
  const page = await browser.newPage()
  const results = []

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
    await page.waitForTimeout(3000) // let JS render

    // Only trust JSON-LD structured JobPosting data — the generic CSS-selector
    // fallback used to pick up nav links and boilerplate as fake job cards,
    // and never had a real description to show a teen evaluating the job.
    const jobs = await page.evaluate(() => {
      const found = []
      const seen = new Set()

      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const d = JSON.parse(s.textContent)
          ;(Array.isArray(d) ? d : [d]).forEach(item => {
            if (item['@type'] === 'JobPosting' && item.title && !seen.has(item.title)) {
              seen.add(item.title)
              found.push({ title: item.title, href: item.url || '', description: item.description || '' })
            }
          })
        } catch {}
      })

      return found.slice(0, 6)
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
          source_id: `gha-${company}-${job.title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100),
          min_age: 16,
          tags: [],
          job_type: 'in-person',
        })
      }
    }

    console.log(`  ${company}: ${results.length} jobs`)
  } catch (err) {
    console.log(`  ${company}: skip (${err.message?.slice(0, 50)})`)
  } finally {
    await page.close()
  }

  return results
}

async function main() {
  console.log('Starting career page scraper (GitHub Actions browser)...')

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const allJobs = []
  for (const employer of CAREER_PAGES) {
    const jobs = await scrapePage(browser, employer)
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
