// Local COS job discovery — sources no other scraper hits
// PPWORKS (government workforce center), Craigslist, Google Maps business search

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
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
      { headers: HEADERS }
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
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      // Craigslist HTML: <a class="cl-app-anchor" href="/..."><span class="label">Title</span>
      const pattern = /<a[^>]+class="cl-app-anchor"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<span[^>]*class="label"[^>]*>([^<]+)<\/span>/g
      let m
      while ((m = pattern.exec(html)) !== null) {
        const [, href, title] = m
        const cleaned = title.trim()
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

// Google Maps Places API — finds ALL local businesses, then checks for hiring
// This is how you find Apogee Rocketry: it's a real COS business with a website
const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY

interface PlaceResult {
  name: string
  website?: string
  vicinity: string
  place_id: string
}

const BUSINESS_TYPES = [
  'restaurant',
  'grocery_or_supermarket',
  'movie_theater',
  'pet_store',
  'amusement_park',
  'bowling_alley',
  'shopping_mall',
  'convenience_store',
  'bakery',
  'cafe',
  'clothing_store',
  'book_store',
  'hardware_store',
]

// Colorado Springs city center coordinates
const COS_LAT = 38.8339
const COS_LNG = -104.8214
const RADIUS_METERS = 25000 // 25km ≈ 15 miles

async function findBusinessesViaGoogleMaps(): Promise<DiscoveredJob[]> {
  if (!GMAPS_KEY) return []

  const allBusinesses: PlaceResult[] = []

  // Use Places API (New) — searchNearby endpoint
  for (const type of BUSINESS_TYPES) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GMAPS_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.formattedAddress,places.id',
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: COS_LAT, longitude: COS_LNG },
              radius: RADIUS_METERS,
            },
          },
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const places = (data.places ?? []).map((p: any) => ({
        name: p.displayName?.text || '',
        website: p.websiteUri,
        vicinity: p.formattedAddress || 'Colorado Springs, CO',
        place_id: p.id || '',
      }))
      allBusinesses.push(...places)
    } catch { /* continue */ }
  }

  // For businesses with websites, check if they have a jobs/careers page
  const jobs: DiscoveredJob[] = []
  const checked = new Set<string>()

  for (const biz of allBusinesses.slice(0, 50)) { // check top 50 businesses
    if (!biz.website || checked.has(biz.website)) continue
    checked.add(biz.website)

    try {
      // Check if their website has a jobs/careers page
      const careerUrls = [
        `${biz.website}/careers`,
        `${biz.website}/jobs`,
        `${biz.website}/employment`,
        `${biz.website}/work-with-us`,
        `${biz.website}/hiring`,
      ]

      for (const careerUrl of careerUrls) {
        const res = await fetch(careerUrl, {
          headers: HEADERS,
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const html = await res.text()
          // Simple check: does the page mention job openings?
          if (/apply|position|opening|job|hiring|career/i.test(html)) {
            jobs.push({
              title: `Open Position — See Website`,
              company: biz.name,
              location: biz.vicinity || 'Colorado Springs, CO',
              description: `${biz.name} in Colorado Springs is currently hiring. Check their careers page for open positions.`,
              apply_url: careerUrl,
              source_id: `gmaps-${biz.place_id}`,
            })
            break // found one, stop checking other career URL patterns
          }
        }
      }
    } catch { /* continue */ }
  }

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
      const res = await fetch(url, { headers: HEADERS })
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
