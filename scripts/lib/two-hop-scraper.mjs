// Shared two-hop employer scraping logic — used by scrape-employers.mjs and
// scrape-careers.mjs. Search/listing pages rarely carry structured JobPosting
// data (verified directly against Walmart, Target, McDonald's — all empty),
// but individual job DETAIL pages almost universally do, since every major
// ATS marks them up for Google's Jobs rich-results feature. So: visit the
// search page, follow links that look like job-detail pages, extract
// structured data from there instead of guessing at the listing page.

const TITLE_HARD_BLOCK = ['bartender', 'cannabis', 'dispensary', 'security guard', 'casino dealer', 'casino', 'meat cutter', 'forklift', 'cdl driver', 'truck driver', 'attorney', 'registered nurse', 'software engineer', 'financial analyst']
const TITLE_JUNK = ['sign in', 'search all', 'see all', 'who we are', 'corporate', 'linkedin', 'instagram', 'privacy notice', 'english', 'home', 'login', 'apply now', 'external link', 'careers home']

export function isBlocked(title) {
  const t = title.toLowerCase()
  return TITLE_HARD_BLOCK.some(w => t.includes(w)) || TITLE_JUNK.some(w => t.includes(w))
}

export function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

const JOB_LINK_PATTERN = /\/(job|jobs|position|positions|opening|openings|req|career|careers)[s]?\/[^/?#]*[a-z0-9-]{4,}/i
const JOB_ID_PATTERN = /[?&](?:job|req|id|jobid|positionid)=[a-z0-9-]+/i

async function extractJobLinks(page, baseUrl, maxLinks) {
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')]
      .map(a => a.href)
      .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('mailto:'))
  })

  const base = new URL(baseUrl)
  const candidates = links.filter(href => {
    try {
      const u = new URL(href, base)
      const baseDomainRoot = base.hostname.replace(/^[^.]+\./, '')
      if (u.hostname !== base.hostname && !u.hostname.endsWith(baseDomainRoot)) return false
      return JOB_LINK_PATTERN.test(u.pathname) || JOB_ID_PATTERN.test(u.search)
    } catch {
      return false
    }
  })

  return [...new Set(candidates)].slice(0, maxLinks)
}

async function extractJsonLdJob(page) {
  return page.evaluate(() => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent)
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item['@type'] === 'JobPosting' && item.title) {
            return { title: item.title, description: item.description || '' }
          }
        }
      } catch {}
    }
    return null
  })
}

// Fallback when a detail page has no JSON-LD: use <h1>/<title> + a real text
// chunk from the body, but only if it clears a minimum length (avoids
// nav-link junk masquerading as a job).
async function extractFallback(page) {
  return page.evaluate(() => {
    const title = (document.querySelector('h1')?.textContent || document.title || '').trim().slice(0, 100)
    const desc = (document.querySelector('[class*="description" i], [class*="job-detail" i], main')?.textContent || '')
      .replace(/\s+/g, ' ').trim().slice(0, 500)
    return { title, description: desc }
  })
}

export async function scrapeEmployerTwoHop(browser, { company, url, timeout = 20000, maxJobLinks = 10, sourcePrefix = 'scrape' }) {
  const results = []
  const listPage = await browser.newPage()

  try {
    await listPage.goto(url, { waitUntil: 'networkidle', timeout })
    await listPage.waitForTimeout(2000)

    const jobLinks = await extractJobLinks(listPage, url, maxJobLinks)
    if (jobLinks.length === 0) {
      console.log(`  ${company}: 0 job links found on listing page`)
      return results
    }

    for (const jobUrl of jobLinks) {
      const detailPage = await browser.newPage()
      try {
        await detailPage.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
        await detailPage.waitForTimeout(800)

        let job = await extractJsonLdJob(detailPage)
        if (!job || !job.description) {
          const fb = await extractFallback(detailPage)
          if (fb.title && fb.description.length > 60) job = fb
        }

        if (job && job.title && !isBlocked(job.title)) {
          const description = stripHtml(job.description)
          if (description.length > 20) {
            results.push({
              title: job.title,
              company,
              location: 'Colorado Springs, CO',
              description,
              apply_url: jobUrl,
              source: 'scrape',
              source_id: `${sourcePrefix}-${company}-${job.title}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100),
              min_age: 16,
              tags: [],
              job_type: 'in-person',
            })
          }
        }
      } catch { /* skip this one job link */ }
      finally {
        await detailPage.close()
      }
    }

    console.log(`  ${company}: ${results.length} jobs found (from ${jobLinks.length} detail links)`)
  } catch (err) {
    console.log(`  ${company}: failed (${err.message?.slice(0, 60)})`)
  } finally {
    await listPage.close()
  }

  return results
}
