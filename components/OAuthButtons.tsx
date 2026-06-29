'use client'
import { supabase } from '@/lib/supabase'

export default function OAuthButtons({ next = '/onboarding' }: { next?: string }) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?next=${next}`
    : `/auth/callback?next=${next}`

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Google */}
      <button
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-full text-sm font-medium transition-all"
        style={{ background: 'rgba(255,248,235,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Apple */}
      <button
        onClick={signInWithApple}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-full text-sm font-medium transition-all"
        style={{ background: 'rgba(255,248,235,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.8 0 246.3 0 121.8c0-75.1 26-142.4 72.8-198.2C119.6-28.6 186-62.9 260-62.9c69.2 0 130.3 50.1 170.4 50.1 39 0 107.7-52.9 182.4-52.9 28.2 0 130.3 4.5 196.7 89.4z"/>
          <path d="M554.1 159.4c7.7-45.6 27.9-91.8 62.4-125.6 34.5-34.4 80-55.7 124.9-55.7 3.5 0 7 .3 10.5.9-5.2 48.2-26 94.4-58.5 127.8-33 33.5-77.2 55.3-121.9 56.4-5.8.1-11.6-.4-17.4-3.8z"/>
        </svg>
        Continue with Apple
      </button>
    </div>
  )
}
