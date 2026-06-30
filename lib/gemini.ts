// Mock interview chat — uses Gemini Flash (free tier: 15 RPM / 1M tokens-per-day,
// generous enough for many concurrent users, unlike Groq which we reserve for
// fast classification/matching elsewhere). Plain REST call, no SDK needed.

const GEMINI_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

export async function geminiChat(systemInstruction: string, history: ChatTurn[]): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured')

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: history.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? ''
  if (!text) throw new Error('Empty response from Gemini')
  return text.trim()
}
