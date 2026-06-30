import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { title, company, tags } = await req.json()

  const prompt = `You are coaching a 16-18 year old in Colorado Springs for a job interview with NO prior work experience.

Job: ${title} at ${company}
Job tags: ${(tags ?? []).join(', ') || 'none'}

Generate 5 interview questions this specific employer/role is LIKELY to ask, based on the job title and tags
(e.g. food service roles ask about handling rushes, retail asks about customer service, outdoor roles ask about
weather/physical stamina, jobs with "commission-pay" tag may ask about sales comfort, etc). For each question give
a short, practical model answer a first-time job seeker with no experience could actually say, referencing
believable things like sports, babysitting, school clubs, or volunteering.

Return ONLY valid JSON in this exact shape, no other text:
{
  "questions": [
    { "q": "question text", "a": "model answer, 2-3 sentences, plainspoken" }
  ]
}`

  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 900,
    })

    const text = res.choices[0]?.message?.content ?? '{}'
    const data = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return NextResponse.json({ ok: true, questions: data.questions ?? [] })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
