import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface JobClassification {
  teen_appropriate: boolean
  min_age: number
  tags: string[]
  reason?: string
}

// ── PRE-FILTER ──────────────────────────────────────────────────────────────
// Philosophy: block what LEGALLY can't be done by a 16-18 year old in Colorado,
// or what REQUIRES credentials they genuinely don't have (degree, professional license).
// Everything else passes through — let Groq and the teen decide.
//
// DO NOT block based on: job title prestige, commission pay, needing a vehicle,
// or "some experience preferred." Teens may have relevant experience.

// ── HARD BLOCK: Title indicates legally prohibited or truly impossible role ──
// Focused on CO labor law (C.R.S. 8-12-115) and genuine credential requirements
const TITLE_HARD_BLOCK = [
  // Colorado law: must be 18+ to serve/sell alcohol
  'bartender', 'barback', 'cocktail server', 'cocktail waitress',

  // Colorado law: cannabis workers must be 21+
  'cannabis', 'dispensary', 'budtender', 'marijuana',

  // Colorado law: casino/gambling workers must be 18+
  'casino dealer', 'poker dealer', 'pit boss', 'slot attendant',

  // Colorado law: security guard license requires 18+
  'security guard', 'security officer', 'armed guard', 'bouncer',

  // Federal/CO hazardous orders: under-18 prohibited on power-driven equipment
  'meat cutter', 'meat slicer', 'deli slicer',
  'forklift operator', 'heavy equipment operator',
  'logging', 'roofing', 'demolition',

  // Requires professional license (attorney, CPA, medical, etc.)
  'attorney', 'lawyer', 'paralegal',
  'certified public accountant', 'cpa',
  'registered nurse', ' rn ', ' lpn ', ' cna ',
  'physician', 'doctor ', 'pharmacist', 'dentist',
  'licensed therapist', 'licensed counselor', 'licensed social worker',
  'licensed electrician', 'licensed plumber',

  // Requires college degree — not a title issue, but degree-only roles
  'software engineer', 'data engineer', 'machine learning',
  'financial analyst', 'investment analyst', 'underwriter',

  // Commercial driving (CDL requires 18+ in CO)
  'cdl driver', 'commercial driver', 'truck driver', 'semi driver',
  'tractor trailer',
]

// ── HARD BLOCK: Description contains explicit disqualifiers ──
const DESC_HARD_BLOCK = [
  // 21+ ONLY — cannabis and alcohol service; no HS student qualifies
  'must be 21', 'age 21', '21 years of age', 'minimum age 21',
  'at least 21 years', '21 or older', '21+ required',

  // Education: diploma/degree REQUIRED (not "pursuing" — teens don't have it yet)
  'high school diploma required', 'hs diploma required',
  'high school diploma or ged required',
  'ged required', 'ged or equivalent required',
  "bachelor's degree required",
  'college degree required', 'university degree required',
  "associate's degree required",

  // Hard experience requirements (X years REQUIRED, not preferred)
  'minimum 1 year of experience', 'minimum 2 years of experience',
  'minimum 3 years', '1+ years of experience required',
  '2+ years of experience required', '3+ years required', '5+ years required',
  'at least 2 years of experience', 'at least 3 years of experience',

  // MLM / pyramid scheme signals
  'network marketing', 'multi-level marketing', ' mlm ',
  'build your downline', 'recruit and earn', 'recruit others to join',
  'unlimited earning potential with no cap',
  'be your own boss and set your own hours and earn unlimited',

  // Adult content
  'adult entertainment', 'adult content creator',
  'exotic dancer', 'strip club',
]

// ── COMPANIES: Known MLMs or legally 18+/21+ only ──
const COMPANY_HARD_BLOCK = [
  // Confirmed MLMs (not legitimate employers)
  'vector marketing', 'cutco',
  'primerica', 'amway', 'herbalife',
  'young living', 'doterra',
  'avon ', 'mary kay',
  'lularoe', 'monat',
  'advocare', 'isagenix', 'usana', 'nu skin',

  // Phone carriers — retail stores require 18+ (contract signing)
  'verizon wireless', 'at&t store', 't-mobile store',
]

// ── FLAGS: Tag jobs with these rather than block them ──
// These get added to the job's tags array so the UI can surface them
export interface JobFlags {
  commission_pay: boolean
  vehicle_needed: boolean
  license_needed: boolean
  physical_labor: boolean
  night_shift: boolean
  requires_18: boolean      // valid for HS seniors — show with badge, don't hide
  exp_preferred: boolean    // experience helpful but not required
}

export function detectFlags(title: string, description: string): JobFlags {
  const t = (title + ' ' + description).toLowerCase()
  return {
    commission_pay: /\bcommission\b|commission-based|commission pay|earn commission/.test(t),
    vehicle_needed: /reliable transportation|own vehicle|own car|must have a car|personal vehicle/.test(t),
    license_needed: /driver.s license|valid license|driver license/.test(t) && !/cdl|commercial driver/.test(t),
    physical_labor: /heavy lifting|standing for|on your feet|physically demanding|lift \d+ lb/.test(t),
    night_shift: /overnight|night shift|3rd shift|midnight|late night/.test(t),
    // 18+ — valid for seniors, just badge it clearly
    requires_18: /must be 18|age 18|18 years of age|minimum age 18|18 or older|at least 18|18\+/.test(t),
    // Experience preferred but not hard-required
    exp_preferred: /experience preferred|experience a plus|experience helpful|prior experience preferred|experience an asset|preferred experience|some experience/.test(t) &&
                   !/experience required|must have experience|experience necessary/.test(t),
  }
}

function preFilter(title: string, description: string, company?: string): boolean {
  const t = title.toLowerCase()
  const d = (description ?? '').toLowerCase()
  const c = (company ?? '').toLowerCase()

  if (TITLE_HARD_BLOCK.some(w => t.includes(w))) return false
  if (DESC_HARD_BLOCK.some(w => d.includes(w))) return false
  if (COMPANY_HARD_BLOCK.some(w => c.includes(w))) return false

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
  const BATCH = 20
  const allBatches: { title: string; company: string; description: string }[][] = []
  for (let i = 0; i < toClassify.length; i += BATCH) {
    allBatches.push(toClassify.slice(i, i + BATCH))
  }

  // Groq's free tier caps at 12,000 tokens/minute. A batch of 20 jobs with
  // full descriptions runs ~3,000-3,500 tokens — verified directly that the
  // limit allows roughly 3 such batches per minute, no amount of pacing
  // changes that ceiling. With a few hundred new jobs in one run (now that
  // every fetch source returns its full result set), there can be 15+
  // batches — far more than fits in one Vercel invocation under this limit.
  //
  // Rather than force all of them through (which either rate-limit-storms
  // and silently rejects everything, or blows the 60s function budget
  // waiting out retries), cap how many batches run per call. Jobs in batches
  // beyond the cap are simply never inserted this run — since dedup is by
  // source_id against what's already in the jobs table, they're untouched
  // and will show up as "new" again on the next cron run, where they get
  // another chance. No data is lost, it just spreads across runs.
  const MAX_BATCHES_PER_RUN = 3
  const batches = allBatches.slice(0, MAX_BATCHES_PER_RUN)

  // Sequential, not parallel — even 3 concurrent batches still exceeded the
  // limit in testing. One retry on 429 as a backstop (token bucket refills
  // continuously, so a short wait usually clears it).
  const batchResults: JobClassification[][] = []
  for (const batch of batches) {
    batchResults.push(await classifyBatch(batch))
  }
  // Jobs beyond the cap get no classification — preFiltered.map below falls
  // through to the `?? default false` case for them via groqIdx running out
  // of groqResults, so they're naturally excluded from toInsert (and
  // naturally retried next run) without extra bookkeeping here.
  const groqResults: JobClassification[] = batchResults.flat()

  // Re-merge: pre-filtered jobs get their Groq classification; blocked jobs get false
  let groqIdx = 0
  return preFiltered.map(({ pass }) => {
    if (!pass) return { teen_appropriate: false, min_age: 18, tags: [] }
    return groqResults[groqIdx++] ?? { teen_appropriate: false, min_age: 18, tags: [] }
  })
}

async function classifyBatch(batch: { title: string; company: string; description: string }[]): Promise<JobClassification[]> {
    const prompt = `You are a strict classifier for a Colorado Springs teen job platform (ages 16-18, currently in high school, NO prior work experience).

For each job return a JSON array — one object per job:
{"teen_appropriate": true/false, "min_age": 16/17/18/21, "tags": [...]}

FOCUS ON ACTUAL REQUIREMENTS, not job titles. "Lead Cashier" may be fine. "Bartender" is not.

MARK FALSE if any of these are true:
1. LEGAL BAR (Colorado law): role requires serving/selling alcohol (bartender, cocktail server), cannabis (dispensary, budtender), security license (guard, bouncer), or casino floor work — these require 18+ or 21+ in CO
2. EXPLICIT 21+ AGE: description says "must be 21", "21+", "minimum age 21" — no high schooler qualifies
   NOTE: "must be 18" or "18+" is NOT an auto-fail — some high school seniors ARE 18. Mark these true but they get flagged separately.
3. DIPLOMA/DEGREE REQUIRED: says "high school diploma required", "GED required", "bachelor's degree required", "college degree required" — teens are still in high school and don't have these yet
4. HARD EXPERIENCE: says "minimum X years of experience required", "X+ years required" — not "preferred", specifically REQUIRED
5. PROFESSIONAL LICENSE: role legally requires a license teens can't get (RN, CDL for commercial trucks, CPA, attorney, licensed electrician)
6. PYRAMID SCHEME: mentions network marketing, recruit others, build a downline, unlimited earning with recruiting

MARK TRUE if:
- The teen could realistically apply and get it with no prior formal work experience
- No illegal age, diploma, or license barrier
- Commission-based pay is OK — just note it; teens can earn commission
- "Some experience preferred" or "experience a plus" is OK — not a hard requirement
- Having a driver's license is OK — flag it but don't reject
- Needing reliable transportation is OK — flag it but don't reject
- "Lead Cashier", "Key Holder", "Crew Lead" at fast food — use judgment; if it's really just a cashier with a fancy title, mark true

WHEN IN DOUBT: false. But don't be so strict that good jobs get blocked.

WHEN IN DOUBT: mark false. It is better to miss a borderline job than show a teen a job they cannot get.

tags (pick all that apply): food-service, retail, outdoor, customer-service, physical, flexible, weekend, part-time

Jobs:
${batch.map((j, idx) => `${idx + 1}. Title: "${j.title}" | Company: "${j.company}" | Description: "${j.description?.slice(0, 300)}"`).join('\n')}

Return ONLY valid JSON array, no other text.`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 1000,
      })

      const text = res.choices[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
      return parsed
    } catch (err: any) {
      // Groq's token-bucket rate limit refills continuously (not a hard
      // per-minute wall) — a short wait usually clears a 429. Retry once.
      const is429 = err?.status === 429 || err?.code === 429 || /429/.test(String(err?.message ?? ''))
      if (is429 && attempt === 0) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      // On any other failure (or a second 429), exclude the batch — safer
      // than letting unclassified jobs through.
      return batch.map(() => ({ teen_appropriate: false, min_age: 18, tags: [] }))
    }
  }
  return batch.map(() => ({ teen_appropriate: false, min_age: 18, tags: [] }))
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
