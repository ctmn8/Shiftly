// Mock interview chat — tries multiple free providers in order so an outage
// or rate limit on one doesn't kill the feature.
//
// Order: Mistral (primary) -> OpenRouter (aggregates many free models) ->
// Groq (last resort — already used elsewhere for classification/matching,
// kept out of the primary slot to leave its quota free for that).

import Groq from 'groq-sdk'

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

interface Provider {
  name: string
  envKey: string
  call: (systemInstruction: string, history: ChatTurn[], apiKey: string) => Promise<string>
}

async function callMistral(systemInstruction: string, history: ChatTurn[], apiKey: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(t => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
  ]
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages, temperature: 0.7, max_tokens: 350 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('Mistral returned empty response')
  return text.trim()
}

async function callOpenRouter(systemInstruction: string, history: ChatTurn[], apiKey: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(t => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
  ]
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'meta-llama/llama-3.1-8b-instruct:free', messages, temperature: 0.7, max_tokens: 350 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('OpenRouter returned empty response')
  return text.trim()
}

async function callGroq(systemInstruction: string, history: ChatTurn[], apiKey: string): Promise<string> {
  const messages = [
    { role: 'system' as const, content: systemInstruction },
    ...history.map(t => ({ role: (t.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user', content: t.text })),
  ]
  const client = new Groq({ apiKey })
  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 350,
  })
  const text = res.choices[0]?.message?.content ?? ''
  if (!text) throw new Error('Groq returned empty response')
  return text.trim()
}

const PROVIDERS: Provider[] = [
  { name: 'mistral', envKey: 'MISTRAL_API_KEY', call: callMistral },
  { name: 'openrouter', envKey: 'OPENROUTER_API_KEY', call: callOpenRouter },
  { name: 'groq', envKey: 'GROQ_API_KEY', call: callGroq },
]

export async function interviewChat(systemInstruction: string, history: ChatTurn[]): Promise<{ text: string; provider: string }> {
  const errors: string[] = []

  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.envKey]
    if (!apiKey) continue

    try {
      const text = await provider.call(systemInstruction, history, apiKey)
      return { text, provider: provider.name }
    } catch (err) {
      errors.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (errors.length === 0) {
    throw new Error('No mock interview provider configured — set MISTRAL_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY')
  }
  throw new Error(`All mock interview providers failed: ${errors.join(' | ')}`)
}
