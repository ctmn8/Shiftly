'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Resume {
  summary: string
  experience: { title: string; bullets: string[] }[]
  skills: string[]
  education: string
}

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Serif, traditional' },
  { id: 'modern', label: 'Modern', desc: 'Bold, sans-serif' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, lots of space' },
] as const
type TemplateId = typeof TEMPLATES[number]['id']

export default function ResumePage() {
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [activities, setActivities] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [loading, setLoading] = useState(false)
  const [resume, setResume] = useState<Resume | null>(null)
  const [error, setError] = useState('')
  const [template, setTemplate] = useState<TemplateId>('classic')

  async function generate() {
    if (!activities.trim()) return
    setLoading(true)
    setError('')

    // Pre-fill from profile if blank
    let profileName = name
    let profileSchool = school
    if (!name || !school) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('name,school').eq('id', user.id).single()
        profileName = name || p?.name || ''
        profileSchool = school || p?.school || ''
        if (!name) setName(profileName)
        if (!school) setSchool(profileSchool)
      }
    }

    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, school: profileSchool, activities, targetJob }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setResume(data.resume)
    } catch (e) {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function printResume() {
    window.print()
  }

  return (
    <div className="p-7 max-w-2xl">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
          Build your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>resume.</em>
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No work history needed — we turn what you've done into real experience.</p>
      </div>

      {!resume ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Martinez"
                className="rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>School</label>
              <input value={school} onChange={e => setSchool(e.target.value)} placeholder="Palmer High School"
                className="rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              What have you done outside school? <span style={{ color: 'var(--dim)' }}>(anything counts)</span>
            </label>
            <textarea value={activities} onChange={e => setActivities(e.target.value)}
              placeholder="I've babysat my neighbor's 2 kids every Friday for 2 years. I play varsity soccer and am team captain. I helped at my church food bank last summer for 3 months. I mow lawns in my neighborhood..."
              rows={5}
              className="rounded-lg px-4 py-3 text-sm outline-none resize-none leading-relaxed"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Target job type</label>
            <input value={targetJob} onChange={e => setTargetJob(e.target.value)} placeholder="Food service, retail, barista..."
              className="rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {error && <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'rgba(220,96,96,0.08)', border: '1px solid rgba(220,96,96,0.25)', color: 'var(--red)' }}>{error}</div>}

          <button onClick={generate} disabled={loading || !activities.trim()}
            className="w-full py-3 rounded-full font-semibold text-sm mt-1 transition-opacity"
            style={{ background: 'var(--amber)', color: '#0E0C09', opacity: loading || !activities.trim() ? 0.4 : 1 }}>
            {loading ? 'Building your resume...' : 'Generate resume →'}
          </button>
        </div>
      ) : (
        <div>
          {/* Action bar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <button onClick={printResume}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm"
              style={{ background: 'var(--amber)', color: '#0E0C09' }}>
              ↓ Download PDF
            </button>
            <button onClick={() => setResume(null)}
              className="px-5 py-2.5 rounded-full text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              Start over
            </button>
            <div className="flex items-center gap-1.5 ml-auto">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  title={t.desc}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: template === t.id ? 'var(--amber-bg)' : 'var(--surface-2)',
                    border: `1px solid ${template === t.id ? 'var(--amber-bdr)' : 'var(--border)'}`,
                    color: template === t.id ? 'var(--amber)' : 'var(--muted)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resume preview */}
          {template === 'classic' && <ClassicTemplate resume={resume} name={name} school={school} />}
          {template === 'modern' && <ModernTemplate resume={resume} name={name} school={school} />}
          {template === 'minimal' && <MinimalTemplate resume={resume} name={name} school={school} />}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-print, #resume-print * { visibility: visible; }
          #resume-print { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

interface TemplateProps {
  resume: Resume
  name: string
  school: string
}

function ClassicTemplate({ resume, name, school }: TemplateProps) {
  return (
    <div id="resume-print" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: '40px 48px', fontFamily: 'Georgia, serif' }}>
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{name}</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
          {school} · Colorado Springs, CO
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'Arial, sans-serif', marginBottom: 8 }}>Summary</div>
        <p style={{ fontSize: 13, lineHeight: 1.7, fontFamily: 'Arial, sans-serif', color: '#333' }}>{resume.summary}</p>
      </div>

      {resume.experience?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'Arial, sans-serif', marginBottom: 10 }}>Experience</div>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>{exp.title}</div>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 13, lineHeight: 1.7, fontFamily: 'Arial, sans-serif', color: '#333', marginBottom: 2 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {resume.skills?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'Arial, sans-serif', marginBottom: 8 }}>Skills</div>
          <p style={{ fontSize: 13, fontFamily: 'Arial, sans-serif', color: '#333' }}>{resume.skills.join(' · ')}</p>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontFamily: 'Arial, sans-serif', marginBottom: 8 }}>Education</div>
        <p style={{ fontSize: 13, fontFamily: 'Arial, sans-serif', color: '#333' }}>{resume.education}</p>
      </div>
    </div>
  )
}

function ModernTemplate({ resume, name, school }: TemplateProps) {
  const amber = '#C97A1F'
  return (
    <div id="resume-print" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: '40px 48px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>{name}</div>
        <div style={{ width: 40, height: 4, background: amber, borderRadius: 2, margin: '10px 0' }} />
        <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{school} · Colorado Springs, CO</div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#222', fontWeight: 500 }}>{resume.summary}</p>
      </div>

      {resume.experience?.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: amber, marginBottom: 12 }}>Experience</div>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: `3px solid ${amber}33` }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{exp.title}</div>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 13, lineHeight: 1.7, color: '#333', marginBottom: 3 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {resume.skills?.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: amber, marginBottom: 10 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {resume.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99, background: `${amber}15`, color: '#7a4d14' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: amber, marginBottom: 8 }}>Education</div>
        <p style={{ fontSize: 13, color: '#333' }}>{resume.education}</p>
      </div>
    </div>
  )
}

function MinimalTemplate({ resume, name, school }: TemplateProps) {
  return (
    <div id="resume-print" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: '52px 56px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: '0.02em' }}>{name}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 6, letterSpacing: '0.03em' }}>{school} — Colorado Springs, CO</div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: '#444' }}>{resume.summary}</p>
      </div>

      {resume.experience?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 14 }}>Experience</div>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{exp.title}</div>
              <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 12.5, lineHeight: 1.8, color: '#555', marginBottom: 4 }}>— {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {resume.skills?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Skills</div>
          <p style={{ fontSize: 12.5, color: '#555' }}>{resume.skills.join('   ·   ')}</p>
        </div>
      )}

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Education</div>
        <p style={{ fontSize: 12.5, color: '#555' }}>{resume.education}</p>
      </div>
    </div>
  )
}
