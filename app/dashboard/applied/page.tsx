'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STATUSES = [
  { id: 'applied',      label: 'Applied',       color: '#7A6B54' },
  { id: 'followed_up',  label: 'Followed up',   color: '#38BF80' },
  { id: 'interview',    label: 'Interview',      color: '#E8A020' },
  { id: 'hired',        label: 'Hired! 🎉',      color: '#38BF80' },
  { id: 'rejected',     label: 'Not this time',  color: '#DC6060' },
]

interface Application {
  id: string
  job_id: string
  applied_at: string | null
  followup_date: string | null
  status: string
  notes: string | null
  jobs: { title: string; company: string } | null
}

export default function AppliedPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newFollowup, setNewFollowup] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(title, company)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setApps((data as Application[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function addManual() {
    if (!newCompany.trim() || !newTitle.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create a placeholder job entry
    const { data: job } = await supabase
      .from('jobs')
      .insert({ title: newTitle, company: newCompany, source: 'manual', source_id: `manual-${Date.now()}` })
      .select().single()

    if (!job) return

    await supabase.from('applications').insert({
      user_id: user.id,
      job_id: job.id,
      applied_at: new Date().toISOString(),
      followup_date: newFollowup || null,
      status: 'applied',
    })

    setNewCompany(''); setNewTitle(''); setNewFollowup('')
    setAdding(false)
    load()
  }

  const statusColor = (s: string) => STATUSES.find(x => x.id === s)?.color ?? '#7A6B54'
  const statusLabel = (s: string) => STATUSES.find(x => x.id === s)?.label ?? s

  const followUpSoon = apps.filter(a => {
    if (!a.followup_date || a.status !== 'applied') return false
    const diff = (new Date(a.followup_date).getTime() - Date.now()) / 86400000
    return diff <= 1
  })

  return (
    <div className="p-7 max-w-2xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
            Applications
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Track where you've applied and when to follow up.</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--amber)', color: '#0E0C09' }}>
          + Add
        </button>
      </div>

      {/* Follow-up nudge */}
      {followUpSoon.length > 0 && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
          style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bdr)', color: 'var(--amber)' }}>
          → <span><strong>{followUpSoon.length} follow-up{followUpSoon.length > 1 ? 's' : ''} due today.</strong> Walk in, ask for the hiring manager, say you applied online.</span>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-5 p-5 rounded-xl flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Company</label>
              <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Dutch Bros"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Role</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Barista"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Follow-up date</label>
            <input type="date" value={newFollowup} onChange={e => setNewFollowup(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none w-48"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)', colorScheme: 'dark' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addManual}
              className="px-5 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--amber)', color: '#0E0C09' }}>Save</button>
            <button onClick={() => setAdding(false)}
              className="px-5 py-2 rounded-full text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>Loading...</div>
      ) : apps.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-4">📋</div>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, marginBottom: 6 }}>No applications yet</div>
          <div className="text-sm">When you apply somewhere, add it here so you remember to follow up.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map(app => (
            <div key={app.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {app.jobs?.title ?? 'Position'} — {app.jobs?.company ?? 'Company'}
                  </div>
                  {app.followup_date && app.status === 'applied' && (
                    <div className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)' }}>
                      Follow up: {new Date(app.followup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <select
                  value={app.status}
                  onChange={e => updateStatus(app.id, e.target.value)}
                  className="text-xs font-mono rounded-full px-3 py-1.5 outline-none"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${statusColor(app.status)}40`,
                    color: statusColor(app.status),
                    colorScheme: 'dark',
                  }}>
                  {STATUSES.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#0E0C09', color: '#F0E6D0' }}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
