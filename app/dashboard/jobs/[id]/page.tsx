'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getPlaybook, GENERIC_PLAYBOOK } from '@/lib/playbooks'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string
  pay_display: string | null
  apply_url: string
  tags: string[]
  min_age: number
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [applied, setApplied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single()
      setJob(data)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: app } = await supabase
          .from('applications').select('id').eq('user_id', user.id).eq('job_id', id).single()
        setApplied(!!app)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function markApplied() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const followup = new Date()
    followup.setDate(followup.getDate() + 3)

    await supabase.from('applications').upsert({
      user_id: user.id,
      job_id: id,
      applied_at: new Date().toISOString(),
      followup_date: followup.toISOString().split('T')[0],
      status: 'applied',
    }, { onConflict: 'user_id,job_id' })

    setApplied(true)
    setSaving(false)
  }

  if (loading) return (
    <div className="p-7 max-w-2xl">
      <div className="h-8 rounded-lg mb-4 w-48" style={{ background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="h-4 rounded mb-2 w-full" style={{ background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="h-4 rounded w-3/4" style={{ background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </div>
  )

  if (!job) return (
    <div className="p-7 text-center" style={{ color: 'var(--muted)' }}>
      <div className="text-4xl mb-4">🔍</div>
      <div>Job not found. <Link href="/dashboard/jobs" style={{ color: 'var(--amber)' }}>Browse all jobs →</Link></div>
    </div>
  )

  const playbook = getPlaybook(job.company) ?? GENERIC_PLAYBOOK

  return (
    <div className="p-7 max-w-2xl">
      {/* Back */}
      <Link href="/dashboard" className="text-sm flex items-center gap-1 mb-6 transition-colors"
        style={{ color: 'var(--muted)' }}>
        ← Back to matches
      </Link>

      {/* Job header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {job.title}
        </h1>
        <div className="text-base mb-3" style={{ color: 'var(--muted)' }}>{job.company} · {job.location}</div>
        <div className="flex items-center gap-3 flex-wrap">
          {job.pay_display && (
            <span className="font-mono text-base font-medium" style={{ color: 'var(--amber)' }}>{job.pay_display}</span>
          )}
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99, color: 'var(--green)', border: '1px solid rgba(56,191,128,0.3)', background: 'rgba(56,191,128,0.08)' }}>
            {job.min_age}+
          </span>
          {job.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99, color: 'var(--muted)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mb-8">
        <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all"
          style={{ background: 'var(--amber)', color: '#0E0C09' }}>
          Apply now ↗
        </a>
        <button onClick={markApplied} disabled={applied || saving}
          className="px-6 py-3 rounded-full text-sm font-medium transition-all"
          style={{
            background: applied ? 'rgba(56,191,128,0.1)' : 'var(--surface-2)',
            border: `1px solid ${applied ? 'rgba(56,191,128,0.3)' : 'var(--border)'}`,
            color: applied ? 'var(--green)' : 'var(--text)',
            opacity: saving ? 0.6 : 1,
          }}>
          {applied ? '✓ Applied' : saving ? 'Saving...' : 'Mark as applied'}
        </button>
        <Link href={`/dashboard/interview?jobId=${id}`}
          className="px-6 py-3 rounded-full text-sm font-medium transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          🎤 Prep for this interview
        </Link>
      </div>

      {applied && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(56,191,128,0.08)', border: '1px solid rgba(56,191,128,0.25)', color: 'var(--green)' }}>
          Logged! We'll remind you to follow up in 3 days. Check <Link href="/dashboard/applied" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Applications</Link>.
        </div>
      )}

      {/* Playbook */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
        <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--amber)' }}>
          How to get hired at {playbook.employer}
        </div>

        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Steps</div>
          <ol className="flex flex-col gap-3">
            {playbook.how.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                <span className="font-mono text-xs mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(232,160,32,0.05)', border: '1px solid var(--amber-bdr)' }}>
          <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--amber)' }}>What to say</div>
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text)' }}>{playbook.what_to_say}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Timing</div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{playbook.timing}</p>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>What to wear</div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{playbook.dress}</p>
          </div>
        </div>

        {playbook.avoid.length > 0 && (
          <div>
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Common mistakes to avoid</div>
            <ul className="flex flex-col gap-1.5">
              {playbook.avoid.map((a, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--red)' }}>✕</span> {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
