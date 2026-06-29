// Internship sources for high school students (16+)
// Both local Colorado Springs programs and remote national ones

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export interface InternshipJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  deadline?: string
  source_id: string
  job_type: 'internship'
}

// Indeed with internship filter
async function fetchIndeedInternships(): Promise<InternshipJob[]> {
  const results: InternshipJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://www.indeed.com/jobs?q=high+school+internship&l=Colorado+Springs%2C+CO&radius=50&fromage=30',
    'https://www.indeed.com/jobs?q=high+school+internship&l=Colorado&remotejob=1&fromage=30',
    'https://www.indeed.com/jobs?q=summer+internship+high+school+student&l=Colorado+Springs%2C+CO&radius=50',
    'https://www.indeed.com/jobs?q=intern+16+17+year+old&l=Colorado+Springs%2C+CO&radius=50',
    'https://www.indeed.com/jobs?q=youth+apprenticeship+colorado+springs&radius=50',
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
        const id = `intern-indeed-${job.jobkey || job.title}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || '',
          company: job.company || '',
          location: job.formattedLocation || 'Colorado Springs, CO',
          description: job.snippet || '',
          apply_url: job.link ? `https://www.indeed.com${job.link}` : url,
          source_id: id,
          job_type: 'internship',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Internships.com — dedicated internship board
async function fetchInternshipsCom(): Promise<InternshipJob[]> {
  const results: InternshipJob[] = []
  const seen = new Set<string>()

  const urls = [
    'https://www.internships.com/search?q=high+school&l=Colorado+Springs%2C+CO&radius=50',
    'https://www.internships.com/search?q=high+school&l=Colorado&remote=true',
    'https://www.internships.com/search?q=summer&l=Colorado+Springs%2C+CO&radius=50',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const pattern = /class="[^"]*job-title[^"]*"[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?class="[^"]*company[^"]*"[^>]*>([^<]+)</gi
      let m
      while ((m = pattern.exec(html)) !== null) {
        const [, href, title, company] = m
        const id = `internships-${href}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: title.trim(),
          company: company.trim(),
          location: 'Colorado Springs, CO',
          description: '',
          apply_url: href.startsWith('http') ? href : `https://www.internships.com${href}`,
          source_id: id,
          job_type: 'internship',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// HandshakeHQ — largest student internship platform
async function fetchHandshake(): Promise<InternshipJob[]> {
  const results: InternshipJob[] = []
  const seen = new Set<string>()

  const searches = [
    'https://app.joinhandshake.com/jobs?category=22&job_type=internship&location=Colorado+Springs%2C+CO&radius=50&education_level_names[]=High+School',
    'https://app.joinhandshake.com/jobs?job_type=internship&location=Colorado&remote=true&education_level_names[]=High+School',
  ]

  for (const url of searches) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()

      const jobs = (() => {
        const m = html.match(/"results"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
        if (!m) return []
        try { return JSON.parse(m[1]) } catch { return [] }
      })()

      for (const job of jobs.slice(0, 15)) {
        const id = `handshake-${job.id}`
        if (seen.has(id)) continue
        seen.add(id)
        results.push({
          title: job.title || job.position || '',
          company: job.employer?.name || job.company || '',
          location: job.location || 'Colorado',
          description: job.description?.slice(0, 300) || '',
          apply_url: `https://app.joinhandshake.com/jobs/${job.id}`,
          source_id: id,
          job_type: 'internship',
        })
      }
    } catch { /* continue */ }
  }

  return results
}

// Known Colorado Springs / Colorado high school internship programs
// These are permanent, well-established programs worth always showing
const KNOWN_HS_INTERNSHIPS: InternshipJob[] = [
  {
    title: 'High School Internship Program — Summer',
    company: 'Colorado Springs Utilities',
    location: 'Colorado Springs, CO',
    description: 'Colorado Springs Utilities offers summer internship opportunities for high school students interested in energy, engineering, and public service. Paid internship, hands-on experience with local infrastructure.',
    apply_url: 'https://www.csu.org/pages/careers',
    source_id: 'intern-csu-hs',
    job_type: 'internship',
  },
  {
    title: 'Youth Employment Program (YEP)',
    company: 'City of Colorado Springs',
    location: 'Colorado Springs, CO',
    description: 'The City of Colorado Springs hires teens 14-21 for summer employment in parks, recreation centers, and city departments. Paid positions, great for first job experience with the city.',
    apply_url: 'https://coloradosprings.gov/human-resources/page/employment',
    source_id: 'intern-cos-city-yep',
    job_type: 'internship',
  },
  {
    title: 'High School Internship — Aerospace & Engineering',
    company: 'L3Harris Technologies',
    location: 'Colorado Springs, CO',
    description: 'L3Harris has a significant presence in Colorado Springs. Offers occasional internships and co-op opportunities for high-achieving high school students interested in aerospace and defense.',
    apply_url: 'https://careers.l3harris.com/internships',
    source_id: 'intern-l3harris',
    job_type: 'internship',
  },
  {
    title: 'UCCS Undergraduate Research — HS Track',
    company: 'University of Colorado Colorado Springs',
    location: 'Colorado Springs, CO',
    description: 'UCCS occasionally accepts motivated high school juniors and seniors into research programs. Contact departments directly. Great for college applications.',
    apply_url: 'https://www.uccs.edu/academics/undergraduate-research',
    source_id: 'intern-uccs-research',
    job_type: 'internship',
  },
  {
    title: 'Memorial Hospital Volunteer / Shadow Program',
    company: 'UCHealth Memorial Hospital',
    location: 'Colorado Springs, CO',
    description: 'UCHealth Memorial accepts high school students as volunteers and job shadows in clinical and non-clinical departments. Start at 16. Path to healthcare careers.',
    apply_url: 'https://www.uchealth.org/volunteer',
    source_id: 'intern-uchealth-vol',
    job_type: 'internship',
  },
  {
    title: 'El Paso County Youth Internship',
    company: 'El Paso County Government',
    location: 'Colorado Springs, CO',
    description: 'El Paso County offers internship opportunities for local youth in county departments including parks, administration, and public services. Check the county HR page seasonally.',
    apply_url: 'https://www.elpasoco.com/human-resources/',
    source_id: 'intern-elpaso-county',
    job_type: 'internship',
  },
  // National programs accessible to COS teens
  {
    title: 'NASA High School Internship (OSTEM)',
    company: 'NASA',
    location: 'Remote / Nationwide',
    description: 'NASA offers paid internships for high school students through the OSTEM program. Applications open in late fall for summer programs. Highly competitive but worth applying.',
    apply_url: 'https://intern.nasa.gov',
    deadline: 'Applications open November each year',
    source_id: 'intern-nasa-hs',
    job_type: 'internship',
  },
  {
    title: 'Google Computer Science Summer Institute (CSSI)',
    company: 'Google',
    location: 'Remote / Various',
    description: 'Google CSSI is a 3-week introduction to CS for rising college freshmen from underrepresented groups. For COS high school seniors. Highly competitive, excellent resume builder.',
    apply_url: 'https://buildyourfuture.withgoogle.com/programs/computer-science-summer-institute',
    source_id: 'intern-google-cssi',
    job_type: 'internship',
  },
  {
    title: 'Congressional Internship — Senator / Representative',
    company: 'US Congress',
    location: 'Washington D.C. / Remote',
    description: 'Colorado\'s senators and representatives offer summer internship programs for high school and college students. Unpaid but exceptional experience. Contact your local representatives office.',
    apply_url: 'https://www.bennet.senate.gov/public/index.cfm/internships',
    source_id: 'intern-congress',
    job_type: 'internship',
  },
  {
    title: 'Boys & Girls Club of America — Teen Leadership',
    company: 'Boys & Girls Club of the Pikes Peak Region',
    location: 'Colorado Springs, CO',
    description: 'Paid teen leadership positions at local Boys & Girls Clubs. Work with younger kids after school and summers. Great experience for teens interested in education or social work.',
    apply_url: 'https://bgcppr.org/careers/',
    source_id: 'intern-bgc-pp',
    job_type: 'internship',
  },
  {
    title: 'Junior Achievement — Student Volunteer / Intern',
    company: 'Junior Achievement of Southern Colorado',
    location: 'Colorado Springs, CO',
    description: 'JA Southern Colorado offers volunteer and intern opportunities teaching financial literacy programs. College application gold. Flexible schedule.',
    apply_url: 'https://www.jasoco.org/',
    source_id: 'intern-ja-soco',
    job_type: 'internship',
  },
  {
    title: 'Colorado Avalanche / Rockies / Broncos — Game Day Staff',
    company: 'Denver Sports Teams',
    location: 'Denver, CO (60 min from COS)',
    description: 'Colorado pro sports teams hire game-day staff including ushers, concessions, and operations. Must be 16+. Great experience even though it requires a drive to Denver.',
    apply_url: 'https://www.altitudesportsentertainment.com/jobs',
    source_id: 'intern-altitude-sports',
    job_type: 'internship',
  },
]

export async function fetchInternships(): Promise<InternshipJob[]> {
  const [indeed, internshipsCom, handshake] = await Promise.allSettled([
    fetchIndeedInternships(),
    fetchInternshipsCom(),
    fetchHandshake(),
  ])

  return [
    // Always show curated programs first
    ...KNOWN_HS_INTERNSHIPS,
    // Then live scraped results
    ...(indeed.status === 'fulfilled' ? indeed.value : []),
    ...(internshipsCom.status === 'fulfilled' ? internshipsCom.value : []),
    ...(handshake.status === 'fulfilled' ? handshake.value : []),
  ]
}
