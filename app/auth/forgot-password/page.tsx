'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Aurora from '@/components/Aurora'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <Link href="/" className="mb-10" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700 }}>
          Shift<span style={{ color: 'var(--amber)' }}>ly</span>
        </Link>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 40px', width: '100%', maxWidth: 400 }}>
          {sent ? (
            <>
              <div className="text-3xl mb-3">📬</div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Check your email
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                We sent a password reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>. Click it to set a new password.
              </p>
              <Link href="/auth/login" className="text-sm" style={{ color: 'var(--amber)' }}>← Back to sign in</Link>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
                Reset your password
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>Email</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" autoFocus
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                {error && (
                  <div className="text-sm px-4 py-3 rounded-lg" style={{ background: 'rgba(220,96,96,0.08)', border: '1px solid rgba(220,96,96,0.25)', color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-full font-semibold text-sm mt-2 transition-opacity"
                  style={{ background: 'var(--amber)', color: '#0E0C09', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>

              <p className="text-sm text-center mt-6" style={{ color: 'var(--muted)' }}>
                <Link href="/auth/login" style={{ color: 'var(--amber)' }}>← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
