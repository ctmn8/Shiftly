import Link from 'next/link'
import Aurora from '@/components/Aurora'

export default function NotFound() {
  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 96, fontWeight: 700, lineHeight: 1, color: 'var(--amber)', marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Page not found
        </h1>
        <p className="text-base mb-8 max-w-sm" style={{ color: 'var(--muted)' }}>
          This page doesn't exist. Let's get you back to finding jobs.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard" className="px-6 py-3 rounded-full font-semibold text-sm"
            style={{ background: 'var(--amber)', color: '#0E0C09' }}>
            Go to matches →
          </Link>
          <Link href="/" className="px-6 py-3 rounded-full text-sm"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Home
          </Link>
        </div>
      </main>
    </>
  )
}
