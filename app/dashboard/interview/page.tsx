'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const SECTIONS = [
  {
    id: 'universal',
    title: 'Questions every employer asks',
    questions: [
      {
        q: 'Tell me about yourself.',
        a: 'Keep it to 30 seconds. School, grade, one thing you\'re involved in, and why you want to work here. Example: "I\'m a junior at Palmer High. I play soccer and I\'ve been babysitting my neighbors\' kids for two years. I want to work here because I like staying busy and I\'ve heard this is a great place to start."',
      },
      {
        q: 'Do you have any work experience?',
        a: 'Say yes — because you do. "I haven\'t had a formal job yet, but I\'ve been babysitting for two years, which taught me how to be responsible and handle things on my own. I also [sport/club] which taught me teamwork and how to show up even when I don\'t feel like it." Never just say "no experience."',
      },
      {
        q: 'Why do you want to work here?',
        a: 'Be specific to the employer. Don\'t say "I need money." Say something true: "I come here all the time and the service is always great — I want to be part of that." Or: "I want to learn what it\'s like to work on a team and this seems like a good place to start."',
      },
      {
        q: 'What are your availability hours?',
        a: 'Know your schedule before you walk in. Say specific days and times. "I\'m available Monday, Wednesday, Friday after 3pm, all day Saturday and Sunday, and summers I can work full time." If you\'re flexible, say that — it\'s a big advantage.',
      },
      {
        q: 'What are your strengths?',
        a: 'Pick two that are relevant. "I\'m really reliable — if I say I\'ll be somewhere, I\'m there. And I learn fast. I pick up new things quickly and I don\'t need to be told the same thing twice." Back each one up with a quick example.',
      },
      {
        q: 'Where do you see yourself in a year?',
        a: 'Be honest and simple. "Honestly, right now I\'m focused on getting great at this job and proving I\'m someone you can count on. I\'m not sure what\'s next — but I know I want to show up and do good work here first."',
      },
    ],
  },
  {
    id: 'food',
    title: 'Food service specific',
    questions: [
      {
        q: 'Can you work quickly under pressure?',
        a: '"Yes. When I babysit and one kid gets hurt while another is acting out, I have to prioritize and stay calm. I think that\'s the same thing — staying focused when things get busy." Or mention any school deadline or practice situation.',
      },
      {
        q: 'How do you handle difficult customers?',
        a: '"I stay calm and listen. I figure most people are frustrated about something specific, not actually upset at me. I\'d try to understand what they need and fix it, or get a manager if I couldn\'t." Never say you\'d argue back.',
      },
      {
        q: 'Are you comfortable standing for long periods?',
        a: 'Say yes if you are. "Absolutely — I\'m used to it from [sport / being on my feet]." If you have a genuine reason you can\'t, be upfront — but most teens can handle this fine.',
      },
    ],
  },
  {
    id: 'retail',
    title: 'Retail specific',
    questions: [
      {
        q: 'Have you handled cash or a register before?',
        a: '"Not professionally, but I\'m good with numbers and I learn systems quickly. I\'m confident I could pick up a register fast." If you\'ve handled cash in any context (selling stuff, babysitting payments), mention it.',
      },
      {
        q: 'How would you help a customer who can\'t find what they\'re looking for?',
        a: '"I\'d first try to find it myself or check the system. If I couldn\'t, I\'d find a coworker or manager who could. I wouldn\'t just say I don\'t know and walk away."',
      },
    ],
  },
  {
    id: 'general',
    title: 'What to do before, during, after',
    questions: [
      {
        q: 'Before the interview',
        a: 'Know the company\'s name, what they do, and one thing you like about them. Bring two printed copies of your resume. Arrive 10 minutes early. Look up the address the night before — don\'t figure it out when you\'re already late.',
      },
      {
        q: 'During the interview',
        a: 'Make eye contact. Sit up. Don\'t check your phone. Answer questions with full sentences, not one-word answers. If you don\'t know something, say "That\'s a good question — I\'d probably..." and give your best answer. Silence is okay — take a second to think.',
      },
      {
        q: 'After the interview',
        a: 'Say "Thank you so much for your time." Ask: "What\'s the next step in your process?" Then send a thank-you text or email within 24 hours if you have their contact. Follow up in person after 3 days if you don\'t hear anything.',
      },
      {
        q: 'What to wear',
        a: 'Clean, not fancy. For food/retail: dark jeans and a clean solid-color shirt or polo. No wrinkles, no logos, no hoodies. For more professional roles (office, hotel): khakis and a button-up. When in doubt, slightly overdressed is better than underdressed.',
      },
    ],
  },
]

interface TailoredJob {
  id: string
  title: string
  company: string
  tags: string[]
}

interface TailoredQ { q: string; a: string }

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={<div className="p-7 max-w-2xl" style={{ color: 'var(--muted)' }}>Loading...</div>}>
      <InterviewPrepContent />
    </Suspense>
  )
}

function InterviewPrepContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [job, setJob] = useState<TailoredJob | null>(null)
  const [tailored, setTailored] = useState<TailoredQ[] | null>(null)
  const [loadingTailored, setLoadingTailored] = useState(false)

  function toggle(key: string) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    if (!jobId) return
    async function load() {
      const { data } = await supabase.from('jobs').select('id,title,company,tags').eq('id', jobId).single()
      if (!data) return
      setJob(data)
      setLoadingTailored(true)
      try {
        const res = await fetch('/api/interview-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title, company: data.company, tags: data.tags }),
        })
        const json = await res.json()
        if (json.ok) setTailored(json.questions)
      } finally {
        setLoadingTailored(false)
      }
    }
    load()
  }, [jobId])

  return (
    <div className="p-7 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Interview prep
      </h1>
      <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
        The questions you'll actually get asked — and exactly what to say.
      </p>
      <Link href="/dashboard/interview/mock" className="inline-flex items-center gap-1.5 text-sm font-medium mb-8" style={{ color: 'var(--amber)' }}>
        🎙️ Try a mock interview →
      </Link>

      {jobId && (
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--amber)' }}>
            {job ? `Tailored for ${job.title} at ${job.company}` : 'Loading job...'}
          </div>
          {loadingTailored && (
            <div className="text-sm px-5 py-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              Building questions for this job...
            </div>
          )}
          {tailored && tailored.length > 0 && (
            <div className="flex flex-col gap-2">
              {tailored.map((item, i) => {
                const key = `tailored-${i}`
                const isOpen = open[key]
                return (
                  <div key={key} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'var(--amber-bdr)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                      <span className="text-sm font-medium pr-4" style={{ color: 'var(--text)' }}>{item.q}</span>
                      <span className="flex-shrink-0 text-base" style={{ color: isOpen ? 'var(--amber)' : 'var(--muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>↓</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5">
                        <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {SECTIONS.map(section => (
          <div key={section.id}>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--amber)' }}>
              {section.title}
            </div>
            <div className="flex flex-col gap-2">
              {section.questions.map((item, i) => {
                const key = `${section.id}-${i}`
                const isOpen = open[key]
                return (
                  <div key={key} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'var(--amber-bdr)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium pr-4" style={{ color: 'var(--text)' }}>{item.q}</span>
                      <span className="flex-shrink-0 text-base" style={{ color: isOpen ? 'var(--amber)' : 'var(--muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
                        ↓
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5">
                        <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
