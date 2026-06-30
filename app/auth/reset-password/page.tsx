'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Aurora from '@/components/Aurora'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase's client SDK reads the recovery token from the URL hash and
    // turns it into a real session — give it a tick before checking.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setInvalid(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <Link href="/" className="mb-10" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700 }}>
          Shift<span style={{ color: 'var(--amber)' }}>ly</span>
        </Link>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 40px', width: '100%', maxWidth: 400 }}>
          {invalid ? (
            <>
              <div className="text-3xl mb-3">⚠️</div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Link expired
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>This reset link is invalid or expired. Request a new one.</p>
              <Link href="/auth/forgot-password" className="text-sm" style={{ color: 'var(--amber)' }}>← Get a new link</Link>
            </>
          ) : done ? (
            <>
              <div className="text-3xl mb-3">✓</div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Password updated
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Taking you to your dashboard...</p>
            </>
          ) : !ready ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Verifying your link...</p>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
                Set a new password
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Make it at least 8 characters.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>New password</label>
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoFocus
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>Confirm password</label>
                  <input
                    type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
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
                  {loading ? 'Updating...' : 'Update password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  )
}
