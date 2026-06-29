'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SCHOOLS = [
  'Palmer High School', 'Doherty High School', 'Mitchell High School',
  'Coronado High School', 'Pine Creek High School', 'Vista Ridge High School',
  'Liberty High School', 'Rampart High School', 'Cheyenne Mountain High',
  'Air Academy High School', 'Other',
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const INTERESTS = [
  { id: 'food', label: '🍔 Food & drink' },
  { id: 'retail', label: '🛍️ Retail' },
  { id: 'outdoors', label: '🌲 Outdoors' },
  { id: 'animals', label: '🐾 Animals' },
  { id: 'people', label: '🤝 Helping people' },
  { id: 'tech', label: '💻 Tech' },
  { id: 'sports', label: '⚽ Sports & fitness' },
  { id: 'art', label: '🎨 Art & design' },
  { id: 'kids', label: '👶 Working with kids' },
]
const TRANSPORT = [
  { id: 'car', label: 'I have a car' },
  { id: 'bus', label: 'I take the bus' },
  { id: 'bike', label: 'I bike' },
  { id: 'walk', label: 'Walking distance only' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [hoursPerWeek, setHoursPerWeek] = useState(15)
  const [interests, setInterests] = useState<string[]>([])
  const [transport, setTransport] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setEmail(user.email ?? '')
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setName(p.name ?? '')
        setSchool(p.school ?? '')
        setDays(p.availability?.days ?? [])
        setHoursPerWeek(p.availability?.hours_per_week ?? 15)
        setInterests(p.interests ?? [])
        setTransport(p.transport ?? '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { getSchoolCoords } = await import('@/lib/schools')
    const coords = getSchoolCoords(school)
    await supabase.from('profiles').upsert({
      id: user.id, name, school,
      availability: { days, hours_per_week: hoursPerWeek },
      interests, transport,
      lat: coords.lat, lng: coords.lng,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleDay(d: string) { setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]) }
  function toggleInterest(id: string) { setInterests(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  const input = "w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
  const inputStyle = { background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }
  const label = "text-xs font-mono uppercase tracking-wider mb-1.5 block"

  if (loading) return (
    <div className="p-7 max-w-xl">
      <div className="h-7 rounded w-32 mb-6" style={{ background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded mb-4" style={{ background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  )

  return (
    <div className="p-7 max-w-xl">
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Your profile
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Keep this up to date so your matches stay accurate.
      </p>

      <div className="flex flex-col gap-5">
        {/* Name + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} style={{ color: 'var(--muted)' }}>Name</label>
            <input className={input} style={inputStyle} value={name} onChange={e => setName(e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--amber-bdr)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
          </div>
          <div>
            <label className={label} style={{ color: 'var(--muted)' }}>Email</label>
            <input className={input} style={{ ...inputStyle, opacity: 0.5 }} value={email} disabled />
          </div>
        </div>

        {/* School */}
        <div>
          <label className={label} style={{ color: 'var(--muted)' }}>School</label>
          <select className={input} style={{ ...inputStyle, colorScheme: 'dark' }} value={school} onChange={e => setSchool(e.target.value)}>
            <option value="">Select your school</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Availability */}
        <div>
          <label className={label} style={{ color: 'var(--muted)' }}>Days available</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                style={{
                  background: days.includes(d) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                  border: `1px solid ${days.includes(d) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                  color: days.includes(d) ? 'var(--amber)' : 'var(--muted)',
                }}>
                {d}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className={label} style={{ color: 'var(--muted)' }}>
              Hours per week: <span style={{ color: 'var(--amber)' }}>{hoursPerWeek}h</span>
            </label>
            <input type="range" min={5} max={40} step={5} value={hoursPerWeek}
              onChange={e => setHoursPerWeek(Number(e.target.value))}
              className="w-full" style={{ accentColor: 'var(--amber)' }} />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className={label} style={{ color: 'var(--muted)' }}>Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(({ id, label: lbl }) => (
              <button key={id} onClick={() => toggleInterest(id)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  background: interests.includes(id) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                  border: `1px solid ${interests.includes(id) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                  color: interests.includes(id) ? 'var(--amber)' : 'var(--text)',
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Transport */}
        <div>
          <label className={label} style={{ color: 'var(--muted)' }}>How do you get around?</label>
          <div className="flex flex-col gap-2">
            {TRANSPORT.map(({ id, label: lbl }) => (
              <button key={id} onClick={() => setTransport(id)}
                className="text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: transport === id ? 'var(--amber-bg)' : 'rgba(255,248,235,0.03)',
                  border: `1px solid ${transport === id ? 'var(--amber-bdr)' : 'var(--border)'}`,
                  color: transport === id ? 'var(--amber)' : 'var(--text)',
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-full font-semibold text-sm transition-all"
          style={{ background: saved ? 'var(--green)' : 'var(--amber)', color: '#0E0C09', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
