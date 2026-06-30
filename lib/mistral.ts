// Mock interview chat — uses Mistral's free "La Plateforme" tier (separate
// vendor from both Groq and Google; free tier needs only email signup, no
// card). Plain REST call via the OpenAI-compatible chat completions API.

const MISTRAL_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

export async function mistralChat(systemInstruction: string, history: ChatTurn[]): Promise<string> {
  if (!MISTRAL_KEY) throw new Error('MISTRAL_API_KEY not configured')

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(t => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
  ]

  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages,
      temperature: 0.7,
      max_tokens: 350,
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Mistral error ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('Empty response from Mistral')
  return text.trim()
}
