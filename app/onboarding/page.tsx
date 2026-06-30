'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  { id: 'car', label: '🚗 I have a car' },
  { id: 'bus', label: '🚌 I take the bus' },
  { id: 'bike', label: '🚲 I bike' },
  { id: 'walk', label: '🚶 Walking distance only' },
]

const TOTAL_STEPS = 7 // steps 1-7, step 0 is welcome

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [hoursPerWeek, setHoursPerWeek] = useState(15)
  const [interests, setInterests] = useState<string[]>([])
  const [transport, setTransport] = useState('')

  function go(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

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

    go(8) // celebration screen
    setSaving(false)
  }

  const progress = step === 0 ? 0 : step >= 8 ? 100 : (step / TOTAL_STEPS) * 100

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
        {/* Progress bar */}
        {step > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {step >= 8 ? 'Done!' : `Step ${step} of ${TOTAL_STEPS}`}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <motion.div className="h-1.5 rounded-full" style={{ background: 'var(--amber)' }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
            </div>
          </motion.div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 40px', width: '100%', maxWidth: 460, minHeight: 360, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={dir}>

            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="welcome" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="text-5xl mb-5">👋</motion.div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 10 }}>
                  Let's find your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>first job.</em>
                </h2>
                <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--muted)', maxWidth: 320 }}>
                  7 quick questions. Takes about 2 minutes. We'll use this to match you with jobs near you that actually hire teens.
                </p>
                <button onClick={() => go(1)}
                  className="w-full py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09' }}>
                  Let's go →
                </button>
              </motion.div>
            )}

            {/* Step 1: Name */}
            {step === 1 && (
              <motion.div key="name" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  What should we call you?
                </h2>
                <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>We'll use this on your profile and emails.</p>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your first name"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && name.trim() && go(2)}
                  className="w-full rounded-lg px-4 py-3 text-base outline-none mb-6"
                  style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--amber-bdr)', color: 'var(--text)' }}
                />
                <button onClick={() => name.trim() && go(2)}
                  disabled={!name.trim()}
                  className="w-full py-3 rounded-full font-semibold text-sm transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: name.trim() ? 1 : 0.4 }}>
                  Continue →
                </button>
              </motion.div>
            )}

            {/* Step 2: School */}
            {step === 2 && (
              <motion.div key="school" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Hey {name}, which school do you go to?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>We use this to show jobs near you.</p>
                <div className="flex flex-col gap-2 mb-6 max-h-[260px] overflow-y-auto pr-1">
                  {SCHOOLS.map((s, i) => (
                    <motion.button key={s} onClick={() => setSchool(s)}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: school === s ? 'var(--amber-bg)' : 'rgba(255,248,235,0.03)',
                        border: `1px solid ${school === s ? 'var(--amber-bdr)' : 'var(--border)'}`,
                        color: school === s ? 'var(--amber)' : 'var(--text)',
                      }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(1)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => school && go(3)} disabled={!school}
                    className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                    style={{ background: 'var(--amber)', color: '#0E0C09', opacity: school ? 1 : 0.4 }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Days */}
            {step === 3 && (
              <motion.div key="days" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Which days can you work?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Pick all that work for you — you can change this later.</p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {DAYS.map((d, i) => (
                    <motion.button key={d} onClick={() => toggleDay(d)}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.92 }}
                      className="px-4 py-2 rounded-full text-sm font-mono transition-all"
                      style={{
                        background: days.includes(d) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                        border: `1px solid ${days.includes(d) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                        color: days.includes(d) ? 'var(--amber)' : 'var(--muted)',
                      }}>
                      {d}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(2)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => days.length > 0 && go(4)} disabled={days.length === 0}
                    className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                    style={{ background: 'var(--amber)', color: '#0E0C09', opacity: days.length > 0 ? 1 : 0.4 }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Hours */}
            {step === 4 && (
              <motion.div key="hours" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  How many hours a week?
                </h2>
                <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Be realistic about school + life — you can always work more later.</p>
                <div className="mb-10">
                  <motion.div key={hoursPerWeek} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                    className="text-center text-5xl font-mono mb-6" style={{ color: 'var(--amber)', fontFamily: 'var(--font-fraunces)' }}>
                    {hoursPerWeek}<span className="text-2xl" style={{ color: 'var(--muted)' }}>h/wk</span>
                  </motion.div>
                  <input type="range" min={5} max={40} step={5} value={hoursPerWeek}
                    onChange={e => setHoursPerWeek(Number(e.target.value))}
                    className="w-full" style={{ accentColor: 'var(--amber)' }} />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--dim)', fontFamily: 'var(--font-geist-mono)' }}>
                    <span>5h</span><span>20h</span><span>40h</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(3)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => go(5)}
                    className="flex-1 py-3 rounded-full font-semibold text-sm"
                    style={{ background: 'var(--amber)', color: '#0E0C09' }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Interests */}
            {step === 5 && (
              <motion.div key="interests" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  What are you into?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Pick anything that sounds good — the more, the better matches.</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {INTERESTS.map(({ id, label }, i) => (
                    <motion.button key={id} onClick={() => toggleInterest(id)}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.94 }}
                      className="px-4 py-2 rounded-full text-sm transition-all"
                      style={{
                        background: interests.includes(id) ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
                        border: `1px solid ${interests.includes(id) ? 'var(--amber-bdr)' : 'var(--border)'}`,
                        color: interests.includes(id) ? 'var(--amber)' : 'var(--text)',
                      }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(4)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => interests.length > 0 && go(6)} disabled={interests.length === 0}
                    className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                    style={{ background: 'var(--amber)', color: '#0E0C09', opacity: interests.length > 0 ? 1 : 0.4 }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 6: Transport */}
            {step === 6 && (
              <motion.div key="transport" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  How do you get around?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>We'll prioritize jobs you can actually get to.</p>
                <div className="flex flex-col gap-2 mb-6">
                  {TRANSPORT.map(({ id, label }, i) => (
                    <motion.button key={id} onClick={() => setTransport(id)}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: transport === id ? 'var(--amber-bg)' : 'rgba(255,248,235,0.03)',
                        border: `1px solid ${transport === id ? 'var(--amber-bdr)' : 'var(--border)'}`,
                        color: transport === id ? 'var(--amber)' : 'var(--text)',
                      }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(5)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => transport && go(7)} disabled={!transport}
                    className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                    style={{ background: 'var(--amber)', color: '#0E0C09', opacity: transport ? 1 : 0.4 }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 7: Review */}
            {step === 7 && (
              <motion.div key="review" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Looks good?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Here's what we'll match you on.</p>
                <div className="flex flex-col gap-2.5 mb-8 text-sm">
                  <div className="flex justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>School</span><span>{school}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Days</span><span>{days.join(', ')}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Hours/week</span><span>{hoursPerWeek}h</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Interests</span><span className="text-right">{interests.length} picked</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Transport</span><span>{TRANSPORT.find(t => t.id === transport)?.label}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(6)} className="flex-1 py-3 rounded-full text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={finish} disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold text-sm transition-opacity"
                    style={{ background: 'var(--amber)', color: '#0E0C09', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : 'Find my matches →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 8: Celebration */}
            {step >= 8 && (
              <motion.div key="done" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col items-center text-center py-6">
                <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 250, damping: 12 }}
                  className="text-6xl mb-5">🎉</motion.div>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  You're all set, {name}!
                </h2>
                <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>We're finding jobs that fit you right now.</p>
                <button onClick={() => router.push('/dashboard')}
                  className="w-full py-3 rounded-full font-semibold text-sm"
                  style={{ background: 'var(--amber)', color: '#0E0C09' }}>
                  See my matches →
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </>
  )
}
