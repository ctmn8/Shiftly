'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Msg { role: 'user' | 'model'; text: string }

const QUICK_JOBS = [
  { title: 'Crew Member', company: 'a fast food restaurant' },
  { title: 'Sales Associate', company: 'a retail store' },
  { title: 'Barista', company: 'a coffee shop' },
  { title: 'Lifeguard', company: 'a local pool' },
]

export default function MockInterviewPage() {
  const [started, setStarted] = useState(false)
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function start(t: string, c: string) {
    setTitle(t); setCompany(c)
    setStarted(true)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, company: c, history: [{ role: 'user', text: 'Hi, I\'m ready to start the interview.' }] }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setMessages([{ role: 'user', text: 'Hi, I\'m ready to start the interview.' }, { role: 'model', text: data.reply }])
      if (data.done) setDone(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong starting the interview.')
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    if (!input.trim() || loading || done) return
    const userMsg: Msg = { role: 'user', text: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company, history: next }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setMessages([...next, { role: 'model', text: data.reply }])
      if (data.done) setDone(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try sending that again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStarted(false); setMessages([]); setDone(false); setError(''); setTitle(''); setCompany('')
  }

  return (
    <div className="p-7 max-w-2xl">
      <Link href="/dashboard/interview" className="text-sm flex items-center gap-1 mb-5" style={{ color: 'var(--muted)' }}>← Back to interview prep</Link>
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Mock interview
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Practice with an AI interviewer. It'll ask real questions and give you feedback at the end.
      </p>

      {!started ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
          <div className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>What job do you want to practice for?</div>
          <div className="flex flex-col gap-2 mb-5">
            {QUICK_JOBS.map(j => (
              <button key={j.title} onClick={() => start(j.title, j.company)}
                className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                {j.title} <span style={{ color: 'var(--muted)' }}>at {j.company}</span>
              </button>
            ))}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Or enter your own</div>
          <div className="flex gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Job title"
              className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company"
              className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={() => title.trim() && company.trim() && start(title.trim(), company.trim())}
              disabled={!title.trim() || !company.trim()}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity"
              style={{ background: 'var(--amber)', color: '#0E0C09', opacity: title.trim() && company.trim() ? 1 : 0.4 }}>
              Start →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 0, display: 'flex', flexDirection: 'column', height: 540 }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-medium">{title} at {company}</span>
            <button onClick={reset} className="text-xs" style={{ color: 'var(--muted)' }}>Start over</button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex" style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: m.role === 'user' ? 'var(--amber)' : 'var(--surface-2)',
                      color: m.role === 'user' ? '#0E0C09' : 'var(--text)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                    }}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex" style={{ justifyContent: 'flex-start' }}>
                <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                  Thinking...
                </div>
              </div>
            )}
            {error && <div className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(220,96,96,0.08)', border: '1px solid rgba(220,96,96,0.25)', color: 'var(--red)' }}>{error}</div>}
            {done && (
              <div className="text-sm px-4 py-3 rounded-xl mt-1" style={{ background: 'rgba(56,191,128,0.08)', border: '1px solid rgba(56,191,128,0.25)', color: 'var(--green)' }}>
                Interview complete! <button onClick={reset} className="underline" style={{ color: 'var(--green)' }}>Try another role →</button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!done && (
            <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type your answer..." disabled={loading}
                className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <button onClick={send} disabled={loading || !input.trim()}
                className="px-5 py-2.5 rounded-full font-semibold text-sm transition-opacity"
                style={{ background: 'var(--amber)', color: '#0E0C09', opacity: loading || !input.trim() ? 0.4 : 1 }}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
