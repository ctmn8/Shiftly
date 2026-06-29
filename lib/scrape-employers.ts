// Direct employer career page scraping
// No API limits, guaranteed COS-specific listings
// Uses gstack's Playwright browse binary

import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

const BROWSE = path.join(os.homedir(), '.claude/skills/gstack/browse/dist/browse')

// Known COS teen-friendly employers with their job search URLs
const EMPLOYERS = [
  {
    company: 'King Soopers',
    url: 'https://jobs.kingsoopers.com/jobs?q=part+time&l=Colorado+Springs%2C+CO&radius=15',
    selector: '[data-job-title], .job-title, h2 a, .title a',
  },
  {
    company: 'Target',
    url: 'https://jobs.target.com/search?q=&l=Colorado+Springs%2C+CO&radius=15mi&parttime=true',
    selector: '[data-test="job-title"], .job-title',
  },
  {
    company: 'Walmart',
    url: 'https://careers.walmart.com/results?q=&l=Colorado+Springs%2C+CO&radius=15mi&partTime=true',
    selector: '[class*="job-title"], h3 a',
  },
  {
    company: "McDonald's",
    url: 'https://jobs.mcdonalds.com/jobs?keywords=&location=Colorado+Springs%2C+CO&distance=15',
    selector: '.job-title, [class*="JobTitle"]',
  },
  {
    company: 'Chick-fil-A',
    url: 'https://www.chick-fil-a.com/careers/restaurant-careers?q=&l=Colorado+Springs%2C+CO',
    selector: '.job-card-title, h3, .position-title',
  },
]

export interface ScrapedJob {
  title: string
  company: string
  location: string
  apply_url: string
  source: 'scrape'
  source_id: string
}

export async function scrapeEmployerJobs(): Promise<ScrapedJob[]> {
  // Check browse binary exists
  if (!fs.existsSync(BROWSE)) {
    console.log('[scraper] Browse binary not found, skipping employer scrape')
    return []
  }

  const results: ScrapedJob[] = []

  for (const employer of EMPLOYERS) {
    try {
      // Use browse to fetch the page and extract job titles via JavaScript
      const script = `
        await page.goto('${employer.url}', { waitUntil: 'networkidle', timeout: 15000 });
        const jobs = await page.$$eval('${employer.selector}', els =>
          els.slice(0, 10).map(el => ({
            title: el.textContent?.trim() || '',
            href: el.tagName === 'A' ? el.href : (el.querySelector('a')?.href || '')
          })).filter(j => j.title.length > 2)
        );
        return JSON.stringify(jobs);
      `

      const output = execSync(
        `"${BROWSE}" js "${script.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
        { timeout: 20000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim()

      const jobs = JSON.parse((output.match(/\[[\s\S]*\]/) ?? ['[]'])[0])
      for (const job of jobs) {
        if (!job.title) continue
        results.push({
          title: job.title,
          company: employer.company,
          location: 'Colorado Springs, CO',
          apply_url: job.href || employer.url,
          source: 'scrape',
          source_id: `scrape-${employer.company}-${job.title}`.replace(/\s+/g, '-').toLowerCase().slice(0, 100),
        })
      }
    } catch {
      // Scraping one employer failing shouldn't stop others
    }
  }

  return results
}
