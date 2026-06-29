import Aurora from '@/components/Aurora'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-16 py-6 max-w-[1200px] mx-auto w-full">
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700 }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm" style={{ color: 'var(--muted)' }}>Sign in</Link>
            <Link href="/auth/signup" className="text-sm font-semibold px-5 py-2 rounded-full" style={{ background: 'var(--amber)', color: '#0E0C09' }}>
              Get started
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-16 max-w-[1200px] mx-auto w-full gap-10 md:gap-20 py-10 md:py-0">
          <div className="flex-1 max-w-[520px] w-full">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-7"
              style={{ color: 'var(--amber)', border: '1px solid var(--amber-bdr)', background: 'var(--amber-bg)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--amber)' }} />
              Colorado Springs · 16+
            </div>

            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(46px, 5.5vw, 74px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.025em', marginBottom: 22 }}>
              Your{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>first shift</em>
              <br />starts here.
            </h1>

            <p className="text-base leading-relaxed mb-9" style={{ color: 'var(--muted)', maxWidth: 420 }}>
              We find jobs in Colorado Springs that hire at 16 with no experience — then show you exactly how to get hired.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-full" style={{ background: 'var(--amber)', color: '#0E0C09' }}>
                Find my matches →
              </Link>
              <Link href="/dashboard/jobs" className="text-sm" style={{ color: 'var(--muted)' }}>Browse jobs ↗</Link>
            </div>

            <div className="flex gap-10 mt-14 pt-7" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 600 }}>47</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Open jobs near you</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 600 }}>3 days</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Avg. to first interview</div>
              </div>
            </div>
          </div>

          <div className="w-full md:flex-shrink-0 md:w-[360px]">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 24 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-medium"
                  style={{ background: 'rgba(52,190,120,0.12)', border: '1px solid rgba(52,190,120,0.25)', color: '#38BF80' }}>DB</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Dutch Bros Coffee</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Briargate Pkwy</div>
                </div>
                <div className="ml-auto font-mono text-xs" style={{ color: 'var(--dim)' }}>0.8 mi</div>
              </div>
              <div className="mb-2" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>Barista</div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
                They hire almost entirely on personality. Available weekends + friendly = strong fit.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99, color: 'var(--green)', border: '1px solid rgba(56,191,128,0.3)', background: 'rgba(56,191,128,0.08)' }}>16+</span>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99, color: 'var(--muted)', border: '1px solid var(--border)' }}>Part-time</span>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 99, color: 'var(--muted)', border: '1px solid var(--border)' }}>Walk-in OK</span>
              </div>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="font-mono text-sm font-medium" style={{ color: 'var(--amber)' }}>$15 – $18 / hr</span>
                <button className="text-sm font-medium px-4 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}>
                  How to apply →
                </button>
              </div>
            </div>
          </div>
        </div>
      {/* How it works */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>How it works</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
              From zero to hired in <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>three steps.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Tell us about you', desc: 'School, availability, what you\'re into, how you get around. Takes 2 minutes.' },
              { num: '02', title: 'We find your matches', desc: 'AI scans every job in Colorado Springs and picks the ones you can actually get — no experience needed.' },
              { num: '03', title: 'We show you how to get hired', desc: 'Exact playbooks for each employer. What to say, when to show up, what not to do.' },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px' }}>
                <div className="font-mono text-xs mb-4" style={{ color: 'var(--amber)' }}>{num}</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 10 }}>{title}</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '80px 24px', background: 'rgba(232,160,32,0.03)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="text-center mb-10">
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>Built for Colorado Springs teens</div>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
              47 jobs. 36 matches today.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { quote: 'I had no idea how to apply anywhere. Shiftly told me exactly what to say to Dutch Bros and I got the job in a week.', name: 'Jordan M.', school: 'Palmer High', job: 'Barista at Dutch Bros' },
              { quote: 'The resume builder turned my babysitting into actual experience. I looked way more qualified than I thought I was.', name: 'Aaliyah T.', school: 'Doherty High', job: 'Team Member at Target' },
              { quote: 'Other job sites showed me stuff I couldn\'t even apply for. Shiftly only showed me jobs that actually hire at 16.', name: 'Marcus R.', school: 'Pine Creek High', job: 'Crew Member at Chick-fil-A' },
            ].map(({ quote, name, school, job }) => (
              <div key={name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px 22px' }}>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text)' }}>"{quote}"</p>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted)' }}>{school} · {job}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '80px 24px' }}>
        <div className="text-center" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Ready for your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>first shift?</em>
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--muted)' }}>Free. Takes 2 minutes. No experience needed.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-full"
            style={{ background: 'var(--amber)', color: '#0E0C09' }}>
            Find my matches →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700 }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </span>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/about" className="hover:text-[var(--text)] transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
            <Link href="/auth/signup" style={{ color: 'var(--amber)' }}>Get started →</Link>
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--dim)' }}>
            Made in Colorado Springs, CO
          </div>
        </div>
      </footer>

      </main>
    </>
  )
}
