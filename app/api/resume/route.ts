import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { name, school, activities, targetJob } = await req.json()

  const prompt = `You are a resume writer helping a 16-18 year old get their first job with NO work experience.

Transform their raw activities into professional resume bullets. Be specific, use action verbs, quantify where possible.

Student info:
- Name: ${name}
- School: ${school}
- What they've done: ${activities}
- Target job type: ${targetJob}

Return a JSON object with this exact shape:
{
  "summary": "2-sentence professional summary for a first-time job seeker",
  "experience": [
    { "title": "Professional title for the activity", "bullets": ["action verb + what + result", "..."] }
  ],
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "education": "Education line for ${school}"
}

Rules:
- Turn babysitting → "Childcare Provider" with real bullets
- Turn lawn mowing → "Grounds Maintenance" or "Self-Employed"
- Turn sports → leadership, teamwork, punctuality bullets
- Turn clubs → relevant skills bullets
- Maximum 2 experience sections, 3 bullets each
- Skills: focus on customer service, reliability, teamwork, communication
- Keep everything honest — no fabrication
- Tone: professional but not stiff

Return ONLY valid JSON, no other text.`

  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    })

    const text = res.choices[0]?.message?.content ?? '{}'
    const data = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return NextResponse.json({ ok: true, resume: data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
