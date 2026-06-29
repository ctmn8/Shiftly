import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface JobClassification {
  teen_appropriate: boolean
  min_age: number
  tags: string[]
  reason?: string
}

// Fast title-level pre-filter — catch obvious disqualifiers before spending Groq tokens
const TITLE_BLOCKLIST = [
  'lead', 'senior', 'manager', 'supervisor', 'director', 'coordinator',
  'specialist', 'analyst', 'engineer', 'developer', 'keyholder', 'key holder',
  'assistant manager', 'shift lead', 'floor lead', 'department head',
  'driver', 'cdl', 'licensed', 'rn ', 'lpn', 'cna', 'cpa', 'phd',
]
const DESC_BLOCKLIST = [
  'years of experience', 'prior experience required', 'previous experience',
  'must have experience', 'experience required', 'high school diploma required',
  'hs diploma required', 'must be 18', 'must be 21', 'age 18', '18 years of age',
  'college degree', "bachelor's", 'minimum 1 year', 'minimum 2 year',
]

function preFilter(title: string, description: string): boolean {
  const t = title.toLowerCase()
  const d = (description ?? '').toLowerCase()
  if (TITLE_BLOCKLIST.some(w => t.includes(w))) return false
  if (DESC_BLOCKLIST.some(w => d.includes(w))) return false
  return true
}

export async function classifyJobs(
  jobs: { title: string; company: string; description: string }[]
): Promise<JobClassification[]> {
  if (jobs.length === 0) return []

  // Pre-filter obvious disqualifiers before sending to Groq
  const preFiltered = jobs.map(j => ({
    job: j,
    pass: preFilter(j.title, j.description),
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

AUTOMATICALLY FALSE — mark false if ANY of these are true:
- Title contains: Lead, Senior, Manager, Supervisor, Director, Coordinator, Specialist, Analyst, Engineer, Developer, Head, Chief, VP, Officer, Associate (when paired with professional role)
- Title implies leadership: "Sales Lead", "Team Lead", "Shift Lead", "Floor Lead", "Key Holder", "Keyholder"
- Description requires: prior experience, previous experience, X years of experience, work history, professional background
- Description requires: high school diploma OR GED OR degree (in-progress teens don't have these yet)
- Description requires: must be 18, must be 21, 18+, 21+, minimum age 18
- Role involves: alcohol sales, cannabis, driving (CDL, delivery driving), firearms, security clearance, adult content, hazardous materials
- Role is: salaried professional, requires certifications, trade license, or specialized training

AUTOMATICALLY TRUE — mark true only if ALL of these:
- Entry-level: no experience required, first job OK, training provided OR role is clearly beginner (crew member, cashier, team member, barista, bagger, stocker, host, associate at retail)
- Age: does not restrict to 18+ or require HS diploma
- No leadership/supervisory responsibility
- Not a skilled trade or professional role

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
