import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface JobClassification {
  teen_appropriate: boolean
  min_age: number
  tags: string[]
  reason?: string
}

// ── PRE-FILTER ──────────────────────────────────────────────────────────────
// Fast string-match blocklist — catches obvious disqualifiers before Groq
// Rule: when in doubt, add it here. False negatives (missing a good job) are
// always better than false positives (showing a teen a job they can't get).

const TITLE_BLOCKLIST = [
  // Leadership / supervisory titles
  'lead', 'leader', 'senior', 'manager', 'supervisor', 'director', 'coordinator',
  'assistant manager', 'shift lead', 'floor lead', 'floor captain', 'store captain',
  'department head', 'department manager', 'general manager', 'gm ',
  'keyholder', 'key holder', 'key carrier',
  'captain', 'chief', 'head of', 'vp ', 'vice president', 'president',
  'officer', 'principal', 'director',
  // Professional/skilled roles teens can't fill
  'specialist', 'analyst', 'engineer', 'developer', 'architect', 'designer',
  'consultant', 'strategist', 'paralegal', 'attorney', 'lawyer', 'accountant',
  'technician', 'mechanic', 'electrician', 'plumber', 'welder',
  'nurse', 'rn ', 'lpn', 'cna', 'emt', 'paramedic', 'physician', 'doctor',
  'pharmacist', 'dentist', 'therapist', 'counselor (mental',
  'cpa', 'phd', 'mba', 'licensed',
  // Driving roles (require license, usually 18+)
  'driver', 'cdl', 'chauffeur', 'delivery driver', 'courier driver',
  // Equipment operation — CO law prohibits under-18 from operating these
  'meat cutter', 'meat slicer', 'deli slicer', 'band saw', 'power saw',
  'forklift', 'heavy equipment', 'power tools operator',
  // Roles requiring 18+ in Colorado
  'bartender', 'barback', 'cocktail', 'liquor', 'cannabis', 'dispensary',
  'security guard', 'armed guard', 'bouncer', 'loss prevention',
  'casino', 'poker dealer', 'pit boss', 'slot attendant', 'gaming',
  // Sales roles that are typically commission/MLM
  'insurance agent', 'insurance sales', 'real estate agent', 'mortgage',
  'financial advisor', 'financial representative', 'wealth advisor',
]

const DESC_BLOCKLIST = [
  // Experience requirements
  'years of experience', 'year of experience', 'prior experience required',
  'previous experience', 'must have experience', 'experience required',
  'work experience required', 'professional experience',
  'minimum 1 year', 'minimum 2 year', 'minimum 3 year',
  '1+ year', '2+ year', '3+ year', '1-2 year', '2-3 year',
  // Education requirements teens don't have
  'high school diploma required', 'hs diploma required', 'ged required',
  "bachelor's degree", "bachelor's required", 'college degree', 'university degree',
  "associate's degree", 'degree required',
  // Age restrictions
  'must be 18', 'must be 21', 'age 18', 'age 21', '18 years of age',
  '21 years of age', 'minimum age 18', 'minimum age 21',
  '18 or older', '21 or older', 'at least 18', 'at least 21',
  // License/certification requirements
  'valid driver\'s license required', 'must have driver\'s license',
  'cdl required', 'license required', 'certification required',
  'professional license',
  // MLM / scam signals
  'unlimited earning potential', 'be your own boss', 'own your own business',
  'network marketing', 'multi-level marketing', 'mlm', 'downline', 'upline',
  'recruitment bonus', 'recruit others', 'build your team',
  'commission only', '100% commission', 'straight commission',
  'must have your own vehicle', 'must provide your own',
  // Adult content / inappropriate
  'adult entertainment', 'adult content', 'nightclub', 'strip club',
]

// Companies known to be MLM, require 18+, or otherwise inappropriate
const COMPANY_BLOCKLIST = [
  // MLMs
  'vector marketing', 'cutco', 'primerica', 'amway', 'herbalife',
  'young living', 'doterra', 'avon', 'mary kay', 'rodan + fields',
  'lularoe', 'monat', 'forever living', 'market america', 'nu skin',
  'life vantage', 'advocare', 'isagenix', 'usana',
  // Phone carriers (require 18+ for contracts)
  'verizon', 'at&t', 'tmobile', 't-mobile', 'sprint', 'boost mobile',
  // Adult establishments
  'casino', 'gambling', 'liquor store', 'tobacco',
]

// Scam/quality signals — jobs with these phrases get auto-rejected regardless of Groq
const SCAM_SIGNALS = [
  'make $500 a week', 'earn $1000 a week', 'make money fast',
  'work from home and earn', 'passive income', 'financial freedom',
  'no experience no problem just call', 'text to apply',
  'we hire everyone', 'guaranteed income',
]

function preFilter(title: string, description: string, company?: string): boolean {
  const t = title.toLowerCase()
  const d = (description ?? '').toLowerCase()
  const c = (company ?? '').toLowerCase()
  if (TITLE_BLOCKLIST.some(w => t.includes(w))) return false
  if (DESC_BLOCKLIST.some(w => d.includes(w))) return false
  if (COMPANY_BLOCKLIST.some(w => c.includes(w))) return false
  if (SCAM_SIGNALS.some(w => d.includes(w) || t.includes(w))) return false
  return true
}


export async function classifyJobs(
  jobs: { title: string; company: string; description: string }[]
): Promise<JobClassification[]> {
  if (jobs.length === 0) return []

  // Pre-filter obvious disqualifiers before sending to Groq
  const preFiltered = jobs.map(j => ({
    job: j,
    pass: preFilter(j.title, j.description, j.company),
  }))

  // Only send pre-approved jobs to Groq
  const toClassify = preFiltered.filter(x => x.pass).map(x => x.job)
  const groqResults: JobClassification[] = []
  const BATCH = 20

  for (let i = 0; i < toClassify.length; i += BATCH) {
    const batch = toClassify.slice(i, i + BATCH)

    const prompt = `You are a strict classifier for a Colorado Springs teen job platform (ages 16-18, currently in high school, NO prior work experience).

For each job return a JSON array — one object per job:
{"teen_appropriate": true/false, "min_age": 16/17/18/21, "tags": [...]}

AUTOMATICALLY FALSE — mark false if ANY single one of these is true:

TITLE RED FLAGS (any of these = false, no exceptions):
- Contains: Lead, Leader, Senior, Manager, Supervisor, Director, Captain, Chief, Head, VP, Officer, Coordinator, Specialist, Analyst, Engineer, Developer, Architect, Consultant, Strategist
- Contains: Keyholder, Key Holder, Key Carrier, Closer, Opener/Closer combo
- Contains: Bartender, Barback, Cocktail Server, Cannabis, Dispensary
- Contains: Security Guard, Armed Guard, Bouncer, Loss Prevention
- Contains: Driver, Chauffeur (delivery, commercial, or CDL)
- Contains: Nurse, RN, LPN, CNA, EMT, Paramedic, Pharmacist, Therapist
- Contains: Insurance Agent, Real Estate, Mortgage, Financial Advisor, Financial Representative

DESCRIPTION RED FLAGS (any of these = false):
- Requires: experience, prior experience, X years, work history, background
- Requires: high school diploma, GED, degree, college, certification, license
- Age restriction: 18+, must be 18, minimum age 18, 21+
- Involves: serving/selling alcohol, cannabis products
- Requires: valid driver's license, CDL, own vehicle for work
- Commission only: 100% commission, straight commission, no base pay
- MLM signals: unlimited earning, be your own boss, recruit others, network marketing, downline
- Scam signals: guaranteed income, make $X/week easy, work from home earn fast

AUTOMATICALLY TRUE — only mark true if ALL of these hold:
- Title is clearly entry-level: crew member, cashier, team member, bagger, stocker, host, barista, server (food only, not alcohol), associate, clerk, attendant, helper
- No experience required OR role explicitly says "will train" / "no experience needed"
- Does not restrict to 18+ or require any diploma/license/certification
- No supervisory or leadership responsibility over other employees
- Not a skilled trade, licensed profession, or adult-only establishment

WHEN IN DOUBT: false. It is better to miss a borderline job than show a 16-year-old something they cannot get.

WHEN IN DOUBT: mark false. It is better to miss a borderline job than show a teen a job they cannot get.

tags (pick all that apply): food-service, retail, outdoor, customer-service, physical, flexible, weekend, part-time

Jobs:
${batch.map((j, idx) => `${idx + 1}. Title: "${j.title}" | Company: "${j.company}" | Description: "${j.description?.slice(0, 300)}"`).join('\n')}

Return ONLY valid JSON array, no other text.`

    try {
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 1000,
      })

      const text = res.choices[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
      groqResults.push(...parsed)
    } catch {
      // On error, exclude the batch — safer than letting bad jobs through
      groqResults.push(...batch.map(() => ({ teen_appropriate: false, min_age: 18, tags: [] })))
    }
  }

  // Re-merge: pre-filtered jobs get their Groq classification; blocked jobs get false
  let groqIdx = 0
  return preFiltered.map(({ pass }) => {
    if (!pass) return { teen_appropriate: false, min_age: 18, tags: [] }
    return groqResults[groqIdx++] ?? { teen_appropriate: false, min_age: 18, tags: [] }
  })
}

export async function generateMatches(
  profile: {
    school: string
    availability: Record<string, unknown>
    interests: string[]
    transport: string
  },
  jobs: {
    id: string
    title: string
    company: string
    location: string
    pay_display: string
    tags: string[]
    distance_miles?: number
  }[]
): Promise<{ job_id: string; score: number; explanation: string }[]> {
  if (jobs.length === 0) return []

  const prompt = `You are matching a Colorado Springs teen to job listings. Return a JSON array scoring each job 0-100 for fit.

Teen profile:
- School: ${profile.school}
- Availability: ${JSON.stringify(profile.availability)}
- Interests: ${profile.interests.join(', ')}
- Transport: ${profile.transport}

Jobs (return score 0-100 and a 1-sentence plain English explanation max 15 words):
${jobs.map((j, i) => `${i + 1}. ID:${j.id} | ${j.title} at ${j.company} | ${j.pay_display} | ${j.distance_miles?.toFixed(1) ?? '?'} mi | tags: ${j.tags.join(',')}`).join('\n')}

Return ONLY valid JSON array: [{"job_id":"...","score":85,"explanation":"Available weekends and likes food — Dutch Bros hires on personality."}]`

  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    })

    const text = res.choices[0]?.message?.content ?? '[]'
    return JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
  } catch {
    return []
  }
}
