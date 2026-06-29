'use client'
import Aurora from '@/components/Aurora'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Matches', icon: <path d="M7.5 1.5l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3L3.7 5l3.3-.5z"/> },
  { href: '/dashboard/jobs', label: 'Browse', icon: <><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="9" y="1" width="5" height="5" rx="1"/><rect x="1" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></> },
  { href: '/dashboard/resume', label: 'Resume', icon: <path d="M2 4h11M2 7.5h11M2 11h6.5"/> },
  { href: '/dashboard/interview', label: 'Interview', icon: <><circle cx="7.5" cy="6" r="4"/><path d="M7.5 10v3M5 13h5"/></> },
  { href: '/dashboard/applied', label: 'Applied', icon: <><rect x="1.5" y="3" width="12" height="10" rx="1"/><path d="M5 3V1.5M10 3V1.5M1.5 7h12"/></> },
  { href: '/dashboard/profile', label: 'Profile', icon: <><circle cx="7.5" cy="5.5" r="3"/><path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></> },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const isActive = (href: string) =>
    href === '/dashboard' ? path === '/dashboard' : path.startsWith(href)

  return (
    <>
      <Aurora />
      <div className="relative z-10 flex min-h-screen">

        {/* Sidebar — desktop only */}
        <nav className="hidden md:flex flex-col w-[220px] flex-shrink-0"
          style={{ background: 'rgba(14,12,9,0.85)', borderRight: '1px solid var(--border)' }}>
          <Link href="/" className="px-[18px] py-5 text-[18px] font-bold"
            style={{ fontFamily: 'var(--font-fraunces)', borderBottom: '1px solid var(--border)', letterSpacing: '-0.01em' }}>
            Shift<span style={{ color: 'var(--amber)' }}>ly</span>
          </Link>
          <div className="flex flex-col py-2 flex-1">
            {NAV.map(({ href, label, icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-2.5 px-[18px] py-[9px] text-[13px] transition-all"
                  style={{
                    color: active ? 'var(--amber)' : 'var(--muted)',
                    background: active ? 'rgba(232,160,32,0.07)' : 'transparent',
                    borderRight: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
                  }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 15 15">{icon}</svg>
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
          style={{ background: 'rgba(14,12,9,0.95)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-mono uppercase tracking-wider transition-all"
                style={{ color: active ? 'var(--amber)' : 'var(--muted)' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 15 15">{icon}</svg>
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </>
  )
}
