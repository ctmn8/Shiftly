import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: 'Shiftly — Find your first job in Colorado Springs',
  description: 'AI-powered job matching for Colorado Springs teens 16+. No experience needed. Find jobs at Dutch Bros, King Soopers, Target and more.',
  keywords: ['colorado springs jobs', 'teen jobs', 'first job', 'jobs for 16 year olds', 'high school jobs colorado springs'],
  openGraph: {
    title: 'Shiftly — Find your first job in Colorado Springs',
    description: 'AI job matching for Colorado Springs teens 16+. No experience needed.',
    url: 'https://shiftly-sand-nu.vercel.app',
    siteName: 'Shiftly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shiftly — Find your first job in Colorado Springs',
    description: 'AI job matching for Colorado Springs teens 16+. No experience needed.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Shiftly' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body className="min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
