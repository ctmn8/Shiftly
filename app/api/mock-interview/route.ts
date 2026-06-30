import { NextRequest, NextResponse } from 'next/server'
import { interviewChat, type ChatTurn } from '@/lib/interview-ai'

const MAX_QUESTIONS = 6

function systemPrompt(title: string, company: string) {
  return `You are role-playing as a friendly but professional hiring manager interviewing a 16-18 year old
for a "${title}" position at "${company}" in Colorado Springs. This is their first-ever job interview and
they likely have no formal work experience — be encouraging, not intimidating.

Rules:
- Ask exactly ONE question per turn. Keep questions realistic for this specific role.
- Vary across: background/motivation, availability, handling pressure/customers, teamwork, and a role-specific
  question based on the job title (e.g. food service → handling a rush; retail → a difficult customer; outdoor →
  weather/physical demands).
- Keep your turns SHORT: 1-2 sentences max, just the question (plus a brief reaction to their last answer if any).
- Never break character, never mention you are an AI.
- After ${MAX_QUESTIONS} questions have been asked (count your own turns), instead of asking another question,
  give a short (3-4 sentence) friendly debrief: what they did well, one thing to improve, and end with
  "[INTERVIEW_COMPLETE]" on its own line as the literal last line.`
}

export async function POST(req: NextRequest) {
  const { title, company, history } = (await req.json()) as {
    title: string
    company: string
    history: ChatTurn[]
  }

  const hasAnyProvider = process.env.MISTRAL_API_KEY || process.env.OPENROUTER_API_KEY
  if (!hasAnyProvider) {
    return NextResponse.json({ ok: false, error: 'Mock interview is not configured yet (set MISTRAL_API_KEY or OPENROUTER_API_KEY).' }, { status: 503 })
  }

  try {
    const { text, provider } = await interviewChat(systemPrompt(title, company), history)
    const done = text.includes('[INTERVIEW_COMPLETE]')
    const clean = text.replace('[INTERVIEW_COMPLETE]', '').trim()
    return NextResponse.json({ ok: true, reply: clean, done, provider })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
