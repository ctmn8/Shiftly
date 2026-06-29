'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Aurora from '@/components/Aurora'
import { useRouter } from 'next/navigation'
import { getSchoolCoords } from '@/lib/schools'

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

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [hoursPerWeek, setHoursPerWeek] = useState(15)
  const [interests, setInterests] = useState<string[]>([])
  const [transport, setTransport] = useState('')

  function toggleDay(d: string) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleInterest(id: string) {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const coords = getSchoolCoords(school)
    await supabase.from('profiles').upsert({
      id: user.id,
      name: name || user.user_metadata?.name || '',
      school,
      availability: { days, hours_per_week: hoursPerWeek },
      interests,
      transport,
      lat: coords.lat,
      lng: coords.lng,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })

    router.push('/dashboard')
  }

  const progress = (step / 5) * 100

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Progress bar */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>Step {step} of 5</span>
            <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full w-full" style={{ background: 'var(--surface-2)' }}>
            <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--amber)' }} />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 40px', width: '100%', maxWidth: 440 }}>

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                What should we call you?
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>We'll use this on your profile and emails.</p>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your first name"
                autoFocus
                className="w-full rounded-lg px-4 py-3 text-base outline-none mb-6"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--amber-bdr)', color: 'var(--text)' }}
              />
              <button onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3 rounded-full font-semibold text-sm transition-opacity"
                style={{ background: 'var(--amber)', color: '#0E0C09', opacity: name.trim() ? 1 : 0.4 }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: School */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Which school do you go to?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>We use this to show jobs near you.</p>
              <div className="flex flex-col gap-2 mb-6">
                {SCHOOLS.map(s => (
                  <button key={s} onClick={() => setSchool(s)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: school === s ? 'var(--amber-bg)' : 'rgba(255,248,235,0.03)',
                      border: `1px solid ${school === s ? 'var(--amber-bdr)' : 'var(--border)'}`,
                      color: school === s ? 'var(--amber)' : 'var(--text)',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                <button onClick={() => school && setStep(3)} disabled={!school}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: school ? 1 : 0.4 }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                When can you work?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Pick all the days that work for you.</p>
              <div className="flex gap-2 flex-wrap mb-6">
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className="px-4 py-2 rounded-full text-sm font-mono transition-all"
                    style={{
                      background: days.includes(d) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                      border: `1px solid ${days.includes(d) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                      color: days.includes(d) ? 'var(--amber)' : 'var(--muted)',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--muted)' }}>
                  Hours per week: <span style={{ color: 'var(--amber)' }}>{hoursPerWeek}h</span>
                </label>
                <input type="range" min={5} max={40} step={5} value={hoursPerWeek}
                  onChange={e => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-amber-400" style={{ accentColor: 'var(--amber)' }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--dim)', fontFamily: 'var(--font-geist-mono)' }}>
                  <span>5h</span><span>20h</span><span>40h</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                <button onClick={() => days.length > 0 && setStep(4)} disabled={days.length === 0}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: days.length > 0 ? 1 : 0.4 }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                What are you into?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Pick anything that sounds good.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {INTERESTS.map(({ id, label }) => (
                  <button key={id} onClick={() => toggleInterest(id)}
                    className="px-4 py-2 rounded-full text-sm transition-all"
                    style={{
                      background: interests.includes(id) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                      border: `1px solid ${interests.includes(id) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                      color: interests.includes(id) ? 'var(--amber)' : 'var(--text)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                <button onClick={() => interests.length > 0 && setStep(5)} disabled={interests.length === 0}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: interests.length > 0 ? 1 : 0.4 }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Transport */}
          {step === 5 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                How do you get around?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>We'll prioritize jobs you can actually get to.</p>
              <div className="flex flex-col gap-2 mb-6">
                {TRANSPORT.map(({ id, label }) => (
                  <button key={id} onClick={() => setTransport(id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: transport === id ? 'var(--amber-bg)' : 'rgba(255,248,235,0.03)',
                      border: `1px solid ${transport === id ? 'var(--amber-bdr)' : 'var(--border)'}`,
                      color: transport === id ? 'var(--amber)' : 'var(--text)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                <button onClick={() => transport && finish()} disabled={!transport || saving}
                  className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: transport && !saving ? 1 : 0.4 }}>
                  {saving ? 'Saving...' : 'Find my matches →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
