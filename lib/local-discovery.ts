// Local COS job discovery — sources no other scraper hits
// PPWORKS (government workforce center), Craigslist, Google Maps business search

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Craigslist works fine through ScraperAPI's free tier (verified — unlike
// Indeed, which requires the paid premium/ultra_premium proxy pools).
async function fetchViaScraperAPI(url: string): Promise<Response> {
  if (SCRAPERAPI_KEY) {
    const params = new URLSearchParams({ api_key: SCRAPERAPI_KEY, url })
    return fetch(`https://api.scraperapi.com/?${params}`, { signal: AbortSignal.timeout(20000) })
  }
  return fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
}

export interface DiscoveredJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  source_id: string
}

// Pikes Peak Workforce Center — local government job board for COS residents
async function fetchPPWORKS(): Promise<DiscoveredJob[]> {
  const jobs: DiscoveredJob[] = []
  try {
    // PPWORKS job search — Colorado Springs workforce center
    const res = await fetch(
      'https://www.connectingcolorado.com/vosnet/jobbanks/jobsearch.aspx?enc=W5QMFWnStpY+EhHSuMGdgA==&City=Colorado+Springs&State=CO&radius=25&partTime=true',
      { headers: HEADERS, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const html = await res.text()

    const linkPattern = /<a[^>]+href="([^"]*jobdetail[^"]*)"[^>]*>([^<]+)<\/a>/gi
    let m
    while ((m = linkPattern.exec(html)) !== null) {
      const [, href, title] = m
      if (title.trim().length < 3) continue
      jobs.push({
        title: title.trim(),
        company: 'Colorado Springs Employer',
        location: 'Colorado Springs, CO',
        description: '',
        apply_url: href.startsWith('http') ? href : `https://www.connectingcolorado.com${href}`,
        source_id: `ppworks-${title.trim()}`.toLowerCase().replace(/\s+/g, '-').slice(0, 80),
      })
    }
  } catch { /* continue */ }
  return jobs
}

// Craigslist — tons of local small businesses post here exclusively
async function fetchCraigslist(): Promise<DiscoveredJob[]> {
  const jobs: DiscoveredJob[] = []
  const seen = new Set<string>()

  const SEARCHES = [
    'https://cosprings.craigslist.org/search/jjj?query=part+time&sort=date',
    'https://cosprings.craigslist.org/search/jjj?query=cashier+entry+level&sort=date',
    'https://cosprings.craigslist.org/search/jjj?query=no+experience&sort=date',
    'https://cosprings.craigslist.org/search/jjj?query=food+service&sort=date',
    'https://cosprings.craigslist.org/search/jjj?sort=date', // all COS jobs
  ]

  for (const url of SEARCHES) {
    try {
      const res = await fetchViaScraperAPI(url)
      if (!res.ok) continue
      const html = await res.text()

      // Craigslist's current markup (verified live):
      // <li class="cl-static-search-result" title="Job Title"><a href="...">
      const pattern = /<li class="cl-static-search-result" title="([^"]+)">\s*<a href="([^"]+)"/g
      let m
      while ((m = pattern.exec(html)) !== null) {
        const [, rawTitle, href] = m
        const cleaned = rawTitle
          .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .trim()
        if (cleaned.length < 3 || seen.has(href)) continue
        seen.add(href)
        jobs.push({
          title: cleaned,
          company: 'Colorado Springs (via Craigslist)',
          location: 'Colorado Springs, CO',
          description: '',
          apply_url: href.startsWith('http') ? href : `https://cosprings.craigslist.org${href}`,
          source_id: `craigslist-${href}`.slice(0, 100),
        })
      }
    } catch { /* continue */ }
  }

  return jobs
}

// OpenStreetMap Overpass API — finds ALL local businesses, completely free, no account needed
// Same idea as Google Maps Places but zero cost, no billing required
// Finds Apogee Rocketry and every other COS business with a website

const COS_LAT = 38.8339
const COS_LNG = -104.8214
const RADIUS_METERS = 25000 // 25km ≈ 15 miles

const OSM_AMENITIES = [
  'restaurant', 'fast_food', 'cafe', 'bar',
  'cinema', 'theatre', 'bowling_alley',
  'veterinary', 'animal_shelter',
]
const OSM_SHOPS = [
  'supermarket', 'convenience', 'clothes', 'electronics',
  'pet', 'books', 'toys', 'sports', 'hardware',
  'mall', 'department_store', 'variety_store',
]

interface OSMBusiness {
  name: string
  website?: string
  vicinity: string
  id: string
}

async function findBusinessesViaOSM(): Promise<OSMBusiness[]> {
  // Overpass QL query — finds all businesses in a radius around COS
  const amenityFilter = OSM_AMENITIES.map(a => `["amenity"="${a}"]`).join('')
  const shopFilter = OSM_SHOPS.map(s => `["shop"="${s}"]`).join('')

  const query = `
[out:json][timeout:30];
(
  node(around:${RADIUS_METERS},${COS_LAT},${COS_LNG})["amenity"~"${OSM_AMENITIES.join('|')}"]["name"];
  node(around:${RADIUS_METERS},${COS_LAT},${COS_LNG})["shop"~"${OSM_SHOPS.join('|')}"]["name"];
  way(around:${RADIUS_METERS},${COS_LAT},${COS_LNG})["amenity"~"${OSM_AMENITIES.join('|')}"]["name"];
  way(around:${RADIUS_METERS},${COS_LAT},${COS_LNG})["shop"~"${OSM_SHOPS.join('|')}"]["name"];
);
out body;
`

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()

    return (data.elements ?? [])
      .filter((e: any) => e.tags?.name)
      .map((e: any) => ({
        name: e.tags.name,
        website: e.tags.website || e.tags['contact:website'],
        vicinity: e.tags['addr:city'] ? `${e.tags['addr:city']}, CO` : 'Colorado Springs, CO',
        id: String(e.id),
      }))
  } catch {
    return []
  }
}

async function checkBusinessCareerPage(biz: { website?: string; name: string; vicinity?: string; id: string }): Promise<DiscoveredJob | null> {
  if (!biz.website) return null
  try {
    // Only try the single most common pattern — checking 5 patterns
    // sequentially per business is what made this whole source slow enough
    // to blow past Vercel's serverless time budget. One guess, fast timeout.
    const careerUrl = `${biz.website}/careers`
    const res = await fetch(careerUrl, { headers: HEADERS, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const html = await res.text()
    if (!/apply|position|opening|job|hiring|career/i.test(html)) return null
    return {
      title: 'Open Position — See Website',
      company: biz.name,
      location: biz.vicinity || 'Colorado Springs, CO',
      description: `${biz.name} in Colorado Springs is currently hiring. Check their careers page for open positions.`,
      apply_url: careerUrl,
      source_id: `osm-${biz.id}`,
    }
  } catch {
    return null
  }
}

async function findBusinessesViaGoogleMaps(): Promise<DiscoveredJob[]> {
  const allBusinesses = await findBusinessesViaOSM()

  // Check the top 20 businesses with websites IN PARALLEL — was sequential
  // across up to 50 businesses x 5 URL patterns each (up to 250 chained
  // requests), which alone could exceed Vercel's 60s function budget.
  const checked = new Set<string>()
  const candidates = allBusinesses.filter(biz => {
    if (!biz.website || checked.has(biz.website)) return false
    checked.add(biz.website)
    return true
  }).slice(0, 20)

  const results = await Promise.allSettled(candidates.map(checkBusinessCareerPage))
  const jobs = results
    .filter((r): r is PromiseFulfilledResult<DiscoveredJob | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((j): j is DiscoveredJob => j !== null)

  return jobs
}

// ZipRecruiter — major board with good hourly/part-time coverage
async function fetchZipRecruiter(): Promise<DiscoveredJob[]> {
  const jobs: DiscoveredJob[] = []
  const seen = new Set<string>()

  const SEARCHES = [
    'https://api.ziprecruiter.com/jobs/v1?search=part+time+entry+level&location=Colorado+Springs%2C+CO&radius_miles=25&days_ago=14&jobs_per_page=50&page=1',
    'https://api.ziprecruiter.com/jobs/v1?search=cashier+no+experience&location=Colorado+Springs%2C+CO&radius_miles=25&days_ago=14&jobs_per_page=50&page=1',
  ]

  // ZipRecruiter also has a public search page we can scrape
  const scrapeUrls = [
    'https://www.ziprecruiter.com/jobs/part-time-entry-level-jobs-in-colorado-springs-co',
    'https://www.ziprecruiter.com/jobs/cashier-jobs-in-colorado-springs-co',
    'https://www.ziprecruiter.com/jobs/crew-member-jobs-in-colorado-springs-co',
    'https://www.ziprecruiter.com/jobs/team-member-jobs-in-colorado-springs-co',
    'https://www.ziprecruiter.com/jobs/food-service-jobs-in-colorado-springs-co',
  ]

  for (const url of scrapeUrls) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const html = await res.text()

      // ZipRecruiter embeds job data as JSON
      const jsonMatch = html.match(/"jobs"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
      if (jsonMatch) {
        try {
          const list = JSON.parse(jsonMatch[1])
          for (const job of list.slice(0, 25)) {
            const id = `zip-${job.id || job.job_id || job.title}`
            if (seen.has(id)) continue
            seen.add(id)
            jobs.push({
              title: job.title || job.name || '',
              company: job.hiring_company?.name || job.company || '',
              location: job.location || 'Colorado Springs, CO',
              description: job.snippet || job.description_teaser || '',
              apply_url: job.url || url,
              source_id: id,
            })
          }
        } catch { /* continue */ }
      }
    } catch { /* continue */ }
  }

  return jobs
}

export async function fetchLocalDiscoveryJobs(): Promise<DiscoveredJob[]> {
  const [ppworks, craigslist, gmaps, ziprecruiter] = await Promise.allSettled([
    fetchPPWORKS(),
    fetchCraigslist(),
    findBusinessesViaGoogleMaps(),
    fetchZipRecruiter(),
  ])

  return [
    ...(ppworks.status === 'fulfilled' ? ppworks.value : []),
    ...(craigslist.status === 'fulfilled' ? craigslist.value : []),
    ...(gmaps.status === 'fulfilled' ? gmaps.value : []),
    ...(ziprecruiter.status === 'fulfilled' ? ziprecruiter.value : []),
  ]
}
