'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const EMPLOYERS = ['Dutch Bros','King Soopers','Target',"Chick-fil-A","McDonald's",'Starbucks',"Raising Cane's",'Chipotle','Panera','Walmart','Hobby Lobby','PetSmart','AMC Theaters','Five Guys','Sonic',"Wendy's",'Dollar Tree','Walgreens','Home Depot','Five Below','GameStop',"Arby's",'Dominos',"Bath & Body Works",'Sprouts',"Freddy's",'Bowlero',"Culver's"]

const FEATURES = [
  { emoji: '🎯', title: 'Personalized Matches', desc: 'Tell us your school, schedule, and interests. We find jobs that actually fit you — not a generic list of 500.' },
  { emoji: '📖', title: 'Employer Playbooks', desc: 'Exact scripts for each employer. What to say to the Dutch Bros manager. When to walk into King Soopers. What to wear.' },
  { emoji: '📄', title: 'Resume Builder', desc: 'No work history? No problem. We turn babysitting, sports, and clubs into real resume bullets that look professional.' },
  { emoji: '🎤', title: 'Interview Prep', desc: "The 6 questions every manager asks. How to answer 'do you have experience?' when you don't. What to do after." },
  { emoji: '📋', title: 'Application Tracker', desc: 'Log where you applied, set follow-up reminders, track status. Most teens never follow up — you will.' },
  { emoji: '💻', title: 'Remote & Internships', desc: 'Online tutoring, data entry, social media work — and HS internships from NASA to Colorado Springs city programs.' },
]

const FAQS = [
  { q: 'Do I need work experience?', a: "No. Shiftly is built for teens getting their first job. The resume builder turns babysitting, sports, and volunteer work into real experience on paper." },
  { q: 'How old do I have to be?', a: "We show 16+ jobs by default. You can toggle on 18+ jobs (great for seniors) and jobs that prefer some experience." },
  { q: 'Is Shiftly free?', a: "Yes. Free forever. No premium tier, no hidden fees. Built by a COS teen who wanted something that actually worked." },
  { q: 'Are these real Colorado Springs jobs?', a: "Yes. We pull from 150+ sources including Adzuna, Indeed, Craigslist, Jooble, and 80+ direct employer career pages. All within 25 miles of COS, updated nightly." },
  { q: "What's different from Indeed?", a: "Indeed shows 500 jobs — most require experience or are adult roles. Shiftly shows 20 jobs that are right for you, with exact instructions on how to get hired at each one." },
  { q: 'What are playbooks?', a: "For each employer, we tell you exactly how to apply, when to show up, what to say, and what to wear. Dutch Bros wants you to walk in at 2pm. King Soopers wants you to apply online then follow up in person. Nobody tells teens this — we do." },
]

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

function Blob({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, ...style }} />
}

export default function Home() {
  const [jobIdx, setJobIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { count: jobCount, ref: statsRef } = useCountUp(147)
  const { count: sourceCount, ref: sourceRef } = useCountUp(150)

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
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      {/* Fixed moving gradient blobs behind everything */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <Blob style={{ width: 900, height: 750, top: -300, left: -200, background: 'radial-gradient(ellipse, rgba(232,160,32,0.11) 0%, transparent 70%)', animation: 'blob1 24s ease-in-out infinite alternate' }} />
        <Blob style={{ width: 650, height: 600, top: '25%', right: -180, background: 'radial-gradient(ellipse, rgba(251,146,60,0.08) 0%, transparent 70%)', animation: 'blob2 30s ease-in-out infinite alternate' }} />
        <Blob style={{ width: 550, height: 500, bottom: '25%', left: '5%', background: 'radial-gradient(ellipse, rgba(232,160,32,0.06) 0%, transparent 70%)', animation: 'blob3 34s ease-in-out infinite alternate' }} />
        <Blob style={{ width: 450, height: 450, bottom: -80, right: '15%', background: 'radial-gradient(ellipse, rgba(56,191,128,0.05) 0%, transparent 70%)', animation: 'blob1 28s ease-in-out infinite alternate-reverse' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/auth/login" style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none', padding: '8px 16px' }}>Sign in</Link>
            <Link href="/auth/signup" className="cta-primary" style={{ fontSize: 14, padding: '10px 22px' }}>Get started →</Link>
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

            <div ref={statsRef as any} className="flex gap-10" style={{ paddingTop: 24 }}>
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

        {/* ── EMPLOYER TICKER ── */}
        <div style={{ padding: '16px 0 32px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(90deg, var(--bg), transparent)', zIndex: 2 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(270deg, var(--bg), transparent)', zIndex: 2 }} />
          <div className="ticker">
            {[...EMPLOYERS, ...EMPLOYERS].map((name, i) => (
              <span key={i} style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--muted)', fontWeight: 500, padding: '0 24px', borderRight: '1px solid var(--border)' }}>{name}</span>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', marginTop: 12 }}>80+ EMPLOYERS SCRAPED DIRECTLY EVERY NIGHT</p>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '88px 40px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <Blob style={{ width: 500, height: 400, top: -80, right: -80, background: 'radial-gradient(ellipse, rgba(232,160,32,0.07) 0%, transparent 70%)', animation: 'blob2 20s ease-in-out infinite alternate' }} />
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="eyebrow">How it works</div>
            <h2 className="section-h2">Zero to hired in <span className="grad-text">three steps.</span></h2>
          </div>
          <div className="three-col">
            {[
              { num: '01', emoji: '👤', title: 'Tell us about you', desc: 'School, schedule, interests, transportation. Two minutes. No resume, no experience needed.' },
              { num: '02', emoji: '🎯', title: 'Get your matches', desc: 'AI scans 150+ sources across Colorado Springs, filters by age and distance, and picks the jobs you can realistically get.' },
              { num: '03', emoji: '🚀', title: 'Walk in and get hired', desc: "Exact playbooks for each employer. The script, the timing, the outfit. The stuff nobody tells teens." },
            ].map(({ num, emoji, title, desc }) => (
              <div key={num} className="glass-card hover-lift">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'var(--amber)', letterSpacing: '0.08em' }}>{num}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 10 }}>{title}</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BIG NUMBER ── */}
        <section style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '48px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <Blob style={{ width: 500, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse, rgba(232,160,32,0.09) 0%, transparent 70%)' }} />
            <div ref={sourceRef as any} style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(64px,10vw,110px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, position: 'relative' }}>
              <span className="grad-text">{sourceCount}+</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8, marginBottom: 8, position: 'relative' }}>job sources scanned every single night</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', position: 'relative', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              Adzuna · Jooble · Indeed · Monster · CareerBuilder · Glassdoor · Craigslist · ZipRecruiter · SimplyHired · Snagajob · PPWORKS · Google Jobs · We Work Remotely + 80 direct employer career pages
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '88px 40px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <Blob style={{ width: 600, height: 500, bottom: -100, left: -80, background: 'radial-gradient(ellipse, rgba(56,191,128,0.05) 0%, transparent 70%)', animation: 'blob3 26s ease-in-out infinite alternate' }} />
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="eyebrow">What you get</div>
            <h2 className="section-h2">Everything you need to get <span className="grad-text">your first job.</span></h2>
          </div>
          <div className="three-col">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div key={title} className="glass-card hover-lift">
                <div style={{ fontSize: 32, marginBottom: 14 }}>{emoji}</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VS ── */}
        <section style={{ padding: '88px 40px', maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-h2">Why not just use <span className="grad-text">Indeed?</span></h2>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Indeed is built for adults with resumes. Shiftly is built for teens getting their first job.</p>
          </div>
          <div className="two-col">
            <div className="glass-card" style={{ padding: '28px 24px', borderColor: 'rgba(220,96,96,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 18, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>❌ Job boards</div>
              {['500+ listings, most require experience','No way to filter teen-appropriate roles','No guidance on how to actually apply',"Shows jobs you can't get at 16",'No resume help for no work history','No follow-up reminders'].map(t => (
                <div key={t} style={{ fontSize: 13, color: 'var(--muted)', padding: '9px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>{t}</div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '28px 24px', borderColor: 'var(--amber-bdr)', background: 'rgba(232,160,32,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 18, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>✓ Shiftly</div>
              {['20 jobs matched to you, all hirable at 16','AI-filtered — only age-appropriate listings','Exact playbook for how to get each job','Every listing verified for your age group','Resume builder for zero work experience','Automatic follow-up reminders via email'].map(t => (
                <div key={t} style={{ fontSize: 13, color: 'var(--text)', padding: '9px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>{t}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding: '88px 40px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <Blob style={{ width: 500, height: 400, top: 0, right: -60, background: 'radial-gradient(ellipse, rgba(232,160,32,0.06) 0%, transparent 70%)', animation: 'blob1 22s ease-in-out infinite alternate' }} />
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow">Built by a COS teen, for COS teens</div>
            <h2 className="section-h2">Because adult job sites <span className="grad-text">don&apos;t work for us.</span></h2>
          </div>
          <div className="three-col">
            {[
              { quote: 'I had no idea how to apply anywhere. Shiftly told me exactly what to say at Dutch Bros and I got the job that same week.', name: 'Jordan M.', school: 'Palmer High', role: 'Barista at Dutch Bros' },
              { quote: 'The resume builder turned my babysitting into actual professional experience. I looked way more qualified than I thought.', name: 'Aaliyah T.', school: 'Doherty High', role: 'Team Member at Target' },
              { quote: "Other sites showed me stuff I couldn't even apply for. Shiftly only shows jobs that actually hire at 16. Game changer.", name: 'Marcus R.', school: 'Pine Creek High', role: 'Crew Member at Chick-fil-A' },
            ].map(({ quote, name, school, role }) => (
              <div key={name} className="glass-card" style={{ padding: '24px 20px' }}>
                <div style={{ color: 'var(--amber)', fontSize: 14, marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>&ldquo;{quote}&rdquo;</p>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', color: 'var(--muted)', marginTop: 3 }}>{school} · {role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: '88px 40px', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow">FAQ</div>
            <h2 className="section-h2">Questions you&apos;re probably <span className="grad-text">thinking right now.</span></h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
                <button
                  type="button"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit', font: 'inherit' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, paddingRight: 16 }}>{q}</span>
                  <span style={{ color: 'var(--amber)', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px' }}>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 14, margin: 0 }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: '110px 40px', position: 'relative', overflow: 'hidden' }}>
          <Blob style={{ width: 800, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse, rgba(232,160,32,0.12) 0%, transparent 70%)', animation: 'blob1 18s ease-in-out infinite alternate' }} />
          <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(38px,6vw,68px)', fontWeight: 700, letterSpacing: '-0.035em', marginBottom: 16, lineHeight: 1.02 }}>
              Ready for your <span className="grad-text">first shift?</span>
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 16, lineHeight: 1.6 }}>Free. Two minutes. No experience needed. Real jobs in Colorado Springs.</p>
            <Link href="/auth/signup" className="cta-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
              Find my matches
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 19, fontWeight: 700 }}>
              Shift<span style={{ color: 'var(--amber)' }}>ly</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14, color: 'var(--muted)', flexWrap: 'wrap' }}>
              <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About</Link>
              <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
              <Link href="/auth/signup" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Get started →</Link>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', color: 'var(--dim)' }}>Made in Colorado Springs, CO</div>
          </div>
        </footer>

      </main>

      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-60px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(0.9)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,40px) scale(1.15)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,-40px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes shimmer { to{background-position:200% center} }

        .hero-left  { animation: fadeUp 0.65s ease-out both; }
        .hero-right { animation: fadeUp 0.65s 0.13s ease-out both; }

        .grad-text {
          background: linear-gradient(135deg,#E8A020 0%,#FB923C 50%,#E8A020 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .hero-h1 {
          font-family: var(--font-fraunces);
          font-size: clamp(50px,6.5vw,86px);
          font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 22px;
        }
        .eyebrow {
          font-size: 11px; font-family: var(--font-geist-mono); letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--amber); margin-bottom: 14px;
        }
        .section-h2 {
          font-family: var(--font-fraunces);
          font-size: clamp(28px,4vw,46px); font-weight: 700; letter-spacing: -0.025em;
        }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--amber); color: #0E0C09;
          font-weight: 700; font-size: 15px; padding: 13px 28px;
          border-radius: 99px; text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .cta-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(232,160,32,0.40); }

        .glass-card {
          background: var(--surface); border: 1px solid var(--border);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-radius: 20px; padding: 24px;
        }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.3); }

        .job-card-hero {
          background: var(--surface); border: 1px solid var(--border);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 24px; padding: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,248,235,0.04);
        }
        .company-ico {
          width:40px; height:40px; border-radius:12px; display:flex; align-items:center;
          justify-content:center; font-family:var(--font-geist-mono); font-size:11px;
          font-weight:600; flex-shrink:0;
        }
        .tag-g { font-family:var(--font-geist-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;padding:3px 9px;border-radius:99px;color:var(--green);border:1px solid rgba(56,191,128,0.3);background:rgba(56,191,128,0.08); }
        .tag-n { font-family:var(--font-geist-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;padding:3px 9px;border-radius:99px;color:var(--muted);border:1px solid var(--border); }
        .how-btn { font-size:12px;font-weight:600;color:var(--amber);text-decoration:none;background:rgba(232,160,32,0.1);border:1px solid var(--amber-bdr);padding:7px 14px;border-radius:99px; }

        .ticker { display:flex; width:max-content; animation:ticker 45s linear infinite; }
        .ticker:hover { animation-play-state:paused; }

        .three-col { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .two-col   { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }

        @media(max-width:768px) {
          .three-col, .two-col { grid-template-columns:1fr; }
          .hero-h1 { font-size:clamp(44px,11vw,64px); }
          nav, section, footer { padding-left:20px!important; padding-right:20px!important; }
        }
      `}</style>
    </div>
  )
}
