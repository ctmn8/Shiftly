'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Aurora from '@/components/Aurora'
import OAuthButtons from '@/components/OAuthButtons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is required, tell the user
    if (!data.session) {
      setError('Check your email and click the confirmation link, then sign in.')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/onboarding')
  }

  return (
    <>
      <Aurora />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <Link href="/" className="mb-10" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Shift<span style={{ color: 'var(--amber)' }}>ly</span>
        </Link>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 40px', width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Create your account
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Find your first job in Colorado Springs.</p>

          <OAuthButtons next="/onboarding" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--dim)' }}>or with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>Your name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Jordan"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)' }}>Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
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
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--amber)' }}>Sign in</Link>
          </p>
        </div>
      </main>
    </>
  )
}
