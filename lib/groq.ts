import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface JobClassification {
  teen_appropriate: boolean
  min_age: number
  tags: string[]
  reason?: string
}

export async function classifyJobs(
  jobs: { title: string; company: string; description: string }[]
): Promise<JobClassification[]> {
  if (jobs.length === 0) return []

  // Batch in groups of 20 to stay under token limits
  const results: JobClassification[] = []
  const BATCH = 20

  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH)

    const prompt = `You are classifying job listings for a Colorado Springs teen job platform (ages 16-18).

For each job, return a JSON array with one object per job in this exact format:
{"teen_appropriate": true/false, "min_age": 16/17/18/21, "tags": ["food-service"|"retail"|"outdoor"|"customer-service"|"physical"|"flexible"|"weekend"|"part-time"]}

Rules:
- teen_appropriate = true if: entry-level, no degree required, part-time OK, no alcohol service required, no heavy machinery
- teen_appropriate = false if: requires experience, CDL, 18+/21+ only, security clearance, adult content
- min_age: use 16 unless job explicitly says 18+ or 21+
- tags: pick all that apply from the list above

Jobs to classify:
${batch.map((j, idx) => `${idx + 1}. Title: "${j.title}" | Company: "${j.company}" | Description: "${j.description?.slice(0, 200)}"`).join('\n')}

Return ONLY a valid JSON array, no other text.`

    try {
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 1000,
      })

      const text = res.choices[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
      results.push(...parsed)
    } catch {
      // On error, mark batch as teen_appropriate to avoid losing jobs
      results.push(...batch.map(() => ({ teen_appropriate: true, min_age: 16, tags: ['part-time'] })))
    }
  }

  return results
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
