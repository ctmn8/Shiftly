import Aurora from '@/components/Aurora'
import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Shiftly' }

export default function Terms() {
  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen">
        <nav className="flex items-center justify-between px-8 py-5 max-w-[900px] mx-auto">
          <Link href="/" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700 }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </Link>
        </nav>
        <article style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 96px' }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Terms of Service</h1>
          <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>Last updated: June 29, 2026</p>

          <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Using Shiftly</h2>
              <p>Shiftly is a free job-matching service for Colorado Springs teens aged 16 and older. By using Shiftly, you agree to use it only for lawful purposes and not to misuse the platform in any way that could harm other users or the service itself.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Job listings</h2>
              <p>Shiftly aggregates job listings from third-party sources and uses AI to filter them for teen appropriateness. We do not guarantee the accuracy, availability, or suitability of any listing. Always verify details directly with the employer before applying. Shiftly is not affiliated with any employer listed on the platform.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>No guarantees</h2>
              <p>Shiftly helps you find and apply for jobs, but we cannot guarantee employment. Hiring decisions are made entirely by employers.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Your content</h2>
              <p>The resume content and profile information you enter is yours. We store it to provide the service and do not claim ownership over it.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Changes</h2>
              <p>We may update these terms as the service evolves. Continued use of Shiftly after changes constitutes acceptance of the new terms.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Contact</h2>
              <p>Questions? Email <span style={{ color: 'var(--amber)' }}>hello@shiftly.app</span></p>
            </section>
          </div>
        </article>
      </main>
    </>
  )
}
