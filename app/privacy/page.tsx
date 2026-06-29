import Aurora from '@/components/Aurora'
import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Shiftly' }

export default function Privacy() {
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
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Privacy Policy</h1>
          <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>Last updated: June 29, 2026</p>

          <div className="flex flex-col gap-8 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>What we collect</h2>
              <p>When you create an account, we collect your name, email address, school, availability, interests, and transport method. We use this information solely to match you with relevant jobs and improve your experience on Shiftly.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>How we use it</h2>
              <p>Your profile information is used to generate job matches, send follow-up reminders for applications you've logged, and generate your resume. We do not sell your data to third parties. We do not share your information with employers.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Minors</h2>
              <p>Shiftly is designed for users 16 and older. We do not knowingly collect data from users under 16. If you are under 16, please do not create an account without parental consent. If you believe a minor under 16 has created an account, contact us and we will delete it.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Data storage</h2>
              <p>Your data is stored securely in Supabase (PostgreSQL), hosted in the United States. We use row-level security so your profile and applications are only visible to you.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Deleting your account</h2>
              <p>You can delete your account and all associated data at any time by emailing us. We will delete your data within 7 days.</p>
            </section>
            <section>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Contact</h2>
              <p>Questions about this policy? Email <span style={{ color: 'var(--amber)' }}>privacy@shiftly.app</span></p>
            </section>
          </div>
        </article>
      </main>
    </>
  )
}
