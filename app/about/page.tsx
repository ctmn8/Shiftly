import Aurora from '@/components/Aurora'
import Link from 'next/link'

export const metadata = { title: 'About — Shiftly' }

export default function About() {
  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen">
        <nav className="flex items-center justify-between px-8 py-5 max-w-[900px] mx-auto">
          <Link href="/" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700 }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </Link>
          <Link href="/auth/signup" className="text-sm font-semibold px-5 py-2 rounded-full"
            style={{ background: 'var(--amber)', color: '#0E0C09' }}>Get started</Link>
        </nav>

        <article style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 96px' }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-6" style={{ color: 'var(--amber)' }}>Our story</div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 32 }}>
            Built by a teen,<br /><em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>for teens.</em>
          </h1>

          <div className="flex flex-col gap-5 text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p>
              I'm a high schooler in Colorado Springs. All my friends needed jobs — for gas money, for savings, for independence. The problem wasn't that there weren't jobs. It was that nobody knew how to find them or how to actually get hired.
            </p>
            <p>
              We'd search Indeed and get overwhelmed with listings we couldn't apply for. We'd apply to places online and never hear back. We didn't know that you're supposed to follow up in person. We didn't know what to say to a manager. We didn't know that King Soopers prefers you apply online first, but Dutch Bros wants you to just walk in.
            </p>
            <p style={{ color: 'var(--text)' }}>
              That's why I built Shiftly. Every job on here is teen-appropriate, in Colorado Springs, and comes with the exact steps to get hired — not just a link to apply.
            </p>
            <p>
              The AI finds the jobs and matches them to you. The playbooks tell you what to do once you get there. The resume builder turns babysitting and sports into real experience on paper.
            </p>
            <p>
              It's free. It'll stay free. The goal is just to help Colorado Springs teens get their first paycheck.
            </p>
          </div>

          <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-full"
              style={{ background: 'var(--amber)', color: '#0E0C09' }}>
              Find your first job →
            </Link>
          </div>
        </article>
      </main>
    </>
  )
}
