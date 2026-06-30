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
  { company: "CVS",             url: 'https://jobs.cvs.com/retail-pharmacy/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Walgreens",       url: 'https://jobs.walgreens.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO&radius=25' },
  { company: "Bath & Body Works", url: 'https://careers.bbwi.com/en/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Kohl's",          url: 'https://careers.kohls.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Best Buy",        url: 'https://jobs.bestbuy.com/bby/jobs?q=&location=Colorado+Springs%2C+CO' },
  { company: "Ross",            url: 'https://jobs.rossstores.com/search/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Burlington",      url: 'https://jobs.burlington.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "AutoZone",        url: 'https://jobs.autozone.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Sprouts",         url: 'https://jobs.sprouts.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Natural Grocers", url: 'https://www.naturalgrocers.com/careers/?location=Colorado+Springs' },
  { company: "Safeway",         url: 'https://albertsons.wd5.myworkdayjobs.com/albertsons_careers?locationCountry=US&q=Colorado+Springs' },
  { company: "Dominos",         url: 'https://jobs.dominos.com/dominos/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Pizza Hut",       url: 'https://jobs.pizzahut.com/search-jobs?location=Colorado+Springs%2C+CO' },
  { company: "Sonic",           url: 'https://jobs.sonicdrivein.com/search-jobs?keywords=&location=Colorado+Springs%2C+CO' },
  { company: "Sky Zone",        url: 'https://skyzone.wd1.myworkdayjobs.com/SkyZone?location=Colorado+Springs' },
  { company: "Bowlero",         url: 'https://jobs.bowlero.com/jobs?location=Colorado+Springs%2C+CO' },
  { company: "Pikes Peak Summit", url: 'https://www.pikes-peak.com/jobs/' },
  { company: "Garden of the Gods", url: 'https://gardenofgodsresort.com/careers/' },
]

const TITLE_HARD_BLOCK = ['bartender','cannabis','dispensary','security guard','casino','meat cutter','forklift','cdl driver','truck driver','attorney','registered nurse','software engineer','financial analyst']

function isBlocked(title) {
  return TITLE_HARD_BLOCK.some(w => title.toLowerCase().includes(w))
}

async function scrapePage(browser, { company, url }) {
  const page = await browser.newPage()
  const results = []

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(3000) // let JS render

    const jobs = await page.evaluate(() => {
      const found = []
      const seen = new Set()

      // JSON-LD
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const d = JSON.parse(s.textContent)
          ;(Array.isArray(d) ? d : [d]).forEach(item => {
            if (item['@type'] === 'JobPosting' && item.title && !seen.has(item.title)) {
              seen.add(item.title)
              found.push({ title: item.title, href: item.url || '' })
            }
          })
        } catch {}
      })

      if (found.length === 0) {
        // Generic title scan
        const sels = [
          '[data-automation-id*="jobTitle"]', '.job-title', '.jobTitle',
          '[class*="job-title"]', '[class*="JobTitle"]', '[class*="position-title"]',
          'h2 a', 'h3 a', 'li a[href*="job"]',
        ]
        for (const sel of sels) {
          document.querySelectorAll(sel).forEach(el => {
            const text = el.textContent?.trim()
            const href = el.tagName === 'A' ? el.href : el.querySelector('a')?.href || ''
            if (text && text.length > 3 && text.length < 100 && !seen.has(text)) {
              seen.add(text)
              found.push({ title: text, href })
            }
          })
          if (found.length >= 6) break
        }
      }

      return found.slice(0, 6)
    })

    for (const job of jobs) {
      if (!isBlocked(job.title)) {
        results.push({
          title: job.title,
          company,
          location: 'Colorado Springs, CO',
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
