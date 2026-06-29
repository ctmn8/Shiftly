'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Aurora from '@/components/Aurora'

const SAMPLE_JOBS = [
  { company: 'Dutch Bros Coffee', abbr: 'DB', color: '#38BF80', border: 'rgba(52,191,128,0.3)', role: 'Barista', pay: '$15–18/hr', tags: ['16+', 'Walk-in OK', 'Weekend'], dist: '0.8 mi', why: 'They hire on personality. Weekends + friendly = strong fit.' },
  { company: 'King Soopers', abbr: 'KS', color: '#7AABF0', border: 'rgba(80,140,240,0.3)', role: 'Courtesy Clerk', pay: '$14.50/hr', tags: ['16+', 'Flexible', 'Part-time'], dist: '1.2 mi', why: 'Always hiring teens. Apply online then follow up in person 3 days later.' },
  { company: "Raising Cane's", abbr: 'RC', color: '#FB923C', border: 'rgba(251,146,60,0.3)', role: 'Crew Member', pay: '$15–17/hr', tags: ['16+', 'Weekends', 'Food'], dist: '2.1 mi', why: 'Great first job. Weekend availability is all they need.' },
  { company: 'Chick-fil-A', abbr: 'CF', color: '#E8A020', border: 'rgba(232,160,32,0.3)', role: 'Team Member', pay: '$15/hr', tags: ['16+', 'Closed Sundays', 'Food'], dist: '1.8 mi', why: 'Hire fast and train well. Closed Sundays so you always have one day off.' },
  { company: 'Target', abbr: 'TG', color: '#E07070', border: 'rgba(220,80,80,0.3)', role: 'Team Member', pay: '$15/hr', tags: ['16+', 'Retail', 'Flexible'], dist: '3.2 mi', why: 'Apply online, respond same day if called. They move fast.' },
]

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = (target / duration) * 16
      const timer = setInterval(() => {
        start = Math.min(start + step, target)
        setCount(Math.round(start))
        if (start >= target) clearInterval(timer)
      }, 16)
    }, { threshold: 0.4 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return { count, ref }
}

export default function Home() {
  const [jobIdx, setJobIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const { count: jobCount, ref: statsRef } = useCountUp(147)

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setJobIdx(i => (i + 1) % SAMPLE_JOBS.length)
        setFading(false)
      }, 280)
    }, 3800)
    return () => clearInterval(t)
  }, [])

  const job = SAMPLE_JOBS[jobIdx]

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col">

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 md:px-16 py-5 max-w-[1200px] mx-auto w-full">
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm px-4 py-2 rounded-full" style={{ color: 'var(--muted)' }}>Sign in</Link>
            <Link href="/auth/signup" className="text-sm font-bold px-5 py-2.5 rounded-full"
              style={{ background: 'var(--amber)', color: '#0E0C09' }}>
              Get started →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-16 max-w-[1200px] mx-auto w-full gap-10 md:gap-16 py-12 md:py-0">
          <div className="flex-1 max-w-[540px] w-full hero-left">
            <h1 className="hero-h1">
              Your{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>first shift</em>
              <br />starts here.
            </h1>

            <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.75, marginBottom: 36, maxWidth: 400 }}>
              Real jobs in Colorado Springs that hire teens. Personalized matches, exact instructions on how to get hired.
            </p>

            <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 52 }}>
              <Link href="/auth/signup" className="cta-primary">
                Find my matches
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link href="/dashboard/jobs" style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
                Browse jobs ↗
              </Link>
            </div>

            <div ref={statsRef as any} className="flex gap-10" style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              {[
                { val: `${jobCount}+`, label: 'Jobs in COS' },
                { val: 'Free', label: 'Always' },
                { val: '2 min', label: 'To your matches' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rotating job card */}
          <div className="w-full md:flex-shrink-0 md:w-[340px] hero-right">
            <div className="job-card-hero" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' }}>
              {/* Dot indicators */}
              <div className="flex gap-1.5" style={{ marginBottom: 20 }}>
                {SAMPLE_JOBS.map((_, i) => (
                  <button key={i} onClick={() => { setFading(true); setTimeout(() => { setJobIdx(i); setFading(false) }, 280) }}
                    style={{
                      width: i === jobIdx ? 22 : 6, height: 6, borderRadius: 99,
                      background: i === jobIdx ? 'var(--amber)' : 'var(--surface-2)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                    }} />
                ))}
              </div>

              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <div className="company-ico" style={{ background: `${job.color}20`, border: `1px solid ${job.border}`, color: job.color }}>
                  {job.abbr}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Colorado Springs · {job.dist}</div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1 }}>
                {job.role}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--muted)', marginBottom: 16 }}>{job.why}</p>

              <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 18 }}>
                {job.tags.map(t => (
                  <span key={t} className={t === '16+' ? 'tag-g' : 'tag-n'}>{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between" style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 15, fontWeight: 600, color: 'var(--amber)' }}>{job.pay}</span>
                <Link href="/auth/signup" className="how-btn">How to get hired →</Link>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, marginTop: 10, color: 'var(--dim)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.05em' }}>
              UPDATED NIGHTLY · AI-FILTERED
            </p>
          </div>
        </div>

        {/* How it works */}
        <section style={{ borderTop: '1px solid var(--border)', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 14 }}>How it works</div>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.025em' }}>
                Zero to hired in{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>three steps.</em>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { num: '01', emoji: '👤', title: 'Tell us about you', desc: 'School, availability, interests, how you get around. Two minutes, no resume needed.' },
                { num: '02', emoji: '🎯', title: 'Get your matches', desc: 'AI scans 150+ sources across Colorado Springs and picks jobs you can actually get — filtered by age, distance, and fit.' },
                { num: '03', emoji: '🚀', title: 'Walk in and get hired', desc: 'Exact playbooks per employer. What to say, when to show up, what to wear. The stuff nobody tells you.' },
              ].map(({ num, emoji, title, desc }) => (
                <div key={num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '26px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 26 }}>{emoji}</span>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'var(--amber)', letterSpacing: '0.08em' }}>{num}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 9 }}>{title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section style={{ borderTop: '1px solid var(--border)', padding: '80px 24px', background: 'rgba(232,160,32,0.025)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Built by a COS teen,{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>for COS teens.</em>
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>Because job sites built for adults don&apos;t work for us.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { quote: 'I had no idea how to apply anywhere. Shiftly told me exactly what to say at Dutch Bros and I got the job that week.', name: 'Jordan M.', school: 'Palmer High', role: 'Barista at Dutch Bros' },
                { quote: 'The resume builder turned my babysitting into real experience. I looked way more qualified than I thought I was.', name: 'Aaliyah T.', school: 'Doherty High', role: 'Team Member at Target' },
                { quote: "Other sites showed me stuff I couldn't even apply for. Shiftly only shows jobs that actually hire at 16.", name: 'Marcus R.', school: 'Pine Creek High', role: 'Crew Member at Chick-fil-A' },
              ].map(({ quote, name, school, role }) => (
                <div key={name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '22px 20px' }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', marginBottom: 18 }}>&ldquo;{quote}&rdquo;</p>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', color: 'var(--muted)', marginTop: 3 }}>{school} · {role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ borderTop: '1px solid var(--border)', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 350, background: 'radial-gradient(ellipse, rgba(232,160,32,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(34px,5vw,58px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.05 }}>
              Ready for your{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>first shift?</em>
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 36, fontSize: 15 }}>Free. 2 minutes. No experience needed.</p>
            <Link href="/auth/signup" className="cta-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              Find my matches
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 19, fontWeight: 700 }}>
              Shift<span style={{ color: 'var(--amber)' }}>ly</span>
            </span>
            <div className="flex items-center gap-6" style={{ fontSize: 14, color: 'var(--muted)' }}>
              <Link href="/about" style={{ color: 'inherit' }}>About</Link>
              <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
              <Link href="/auth/signup" style={{ color: 'var(--amber)' }}>Get started →</Link>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', color: 'var(--dim)' }}>Made in Colorado Springs, CO</div>
          </div>
        </footer>

      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-left  { animation: fadeUp 0.65s ease-out both; }
        .hero-right { animation: fadeUp 0.65s 0.12s ease-out both; }
        .hero-h1 {
          font-family: var(--font-fraunces);
          font-size: clamp(50px, 6vw, 84px);
          font-weight: 700;
          line-height: 1.02;
          letter-spacing: -0.03em;
          margin-bottom: 22px;
          color: var(--text);
        }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--amber); color: #0E0C09;
          font-weight: 700; font-size: 15px; padding: 13px 28px;
          border-radius: 99px; text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cta-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,160,32,0.35);
        }
        .job-card-hero {
          background: var(--surface);
          border: 1px solid var(--border);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,248,235,0.04);
        }
        .company-ico {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-geist-mono); font-size: 11px; font-weight: 600;
          flex-shrink: 0;
        }
        .tag-g {
          font-family: var(--font-geist-mono); font-size: 10px;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 99px;
          color: var(--green); border: 1px solid rgba(56,191,128,0.3);
          background: rgba(56,191,128,0.08);
        }
        .tag-n {
          font-family: var(--font-geist-mono); font-size: 10px;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 99px;
          color: var(--muted); border: 1px solid var(--border);
        }
        .how-btn {
          font-size: 12px; font-weight: 600; color: var(--amber);
          text-decoration: none; transition: color 0.15s;
        }
        .how-btn:hover { color: var(--amber-2); }
      `}</style>
    </>
  )
}
