'use client'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  pay_display: string | null
  tags: string[]
  apply_url: string
  distance_miles?: number
  explanation?: string
  is_top?: boolean
}

const COMPANY_ICONS: Record<string, { bg: string; border: string; color: string; abbr: string }> = {
  'Dutch Bros':     { bg: 'rgba(52,190,120,0.12)',  border: 'rgba(52,190,120,0.25)',  color: '#38BF80', abbr: 'DB' },
  'King Soopers':   { bg: 'rgba(80,140,240,0.12)',  border: 'rgba(80,140,240,0.25)',  color: '#7AABF0', abbr: 'KS' },
  "Chick-fil-A":    { bg: 'rgba(232,160,32,0.12)',  border: 'rgba(232,160,32,0.25)',  color: '#E8A020', abbr: 'CF' },
  'Target':         { bg: 'rgba(220,80,80,0.12)',   border: 'rgba(220,80,80,0.25)',   color: '#E07070', abbr: 'TG' },
  "McDonald's":     { bg: 'rgba(220,140,40,0.12)',  border: 'rgba(220,140,40,0.25)',  color: '#D8922A', abbr: 'MC' },
  'Starbucks':      { bg: 'rgba(52,190,120,0.12)',  border: 'rgba(52,190,120,0.25)',  color: '#38BF80', abbr: 'SB' },
  'Chipotle':       { bg: 'rgba(180,80,40,0.12)',   border: 'rgba(180,80,40,0.25)',   color: '#C86040', abbr: 'CM' },
  'Panera':         { bg: 'rgba(200,160,80,0.12)',  border: 'rgba(200,160,80,0.25)',  color: '#C8A050', abbr: 'PB' },
}

function getCompanyStyle(company: string) {
  for (const [key, val] of Object.entries(COMPANY_ICONS)) {
    if (company.toLowerCase().includes(key.toLowerCase())) return val
  }
  const abbr = company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return { bg: 'rgba(255,248,235,0.07)', border: 'rgba(255,248,235,0.12)', color: '#7A6B54', abbr }
}

export default function JobCard({ job }: { job: Job }) {
  const icon = getCompanyStyle(job.company)
  const dist = job.distance_miles != null ? `${job.distance_miles.toFixed(1)} mi` : null

  if (job.is_top) {
    return (
      <div
        className="rounded-xl p-5 cursor-pointer transition-all duration-200"
        style={{
          borderLeft: '3px solid var(--amber)',
          borderTop: '1px solid rgba(232,160,32,0.15)',
          borderRight: '1px solid rgba(232,160,32,0.08)',
          borderBottom: '1px solid rgba(232,160,32,0.08)',
          background: 'rgba(232,160,32,0.04)',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(232,160,32,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--amber)' }}>
          ⬡ Your best match today
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-medium flex-shrink-0"
            style={{ background: icon.bg, border: `1px solid ${icon.border}`, color: icon.color }}
          >
            {icon.abbr}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-fraunces)' }}>
              {job.title} — {job.company}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {job.location}{dist ? ` · ${dist}` : ''}
            </div>
          </div>
          {job.pay_display && (
            <div className="font-mono text-sm font-medium flex-shrink-0" style={{ color: 'var(--amber)' }}>
              {job.pay_display}
            </div>
          )}
        </div>
        {job.explanation && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {job.explanation}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag-green">16+</span>
          {job.tags.includes('commission-pay') && (
            <span className="tag-muted" title="Pay includes commission">💰 Commission</span>
          )}
          {job.tags.includes('vehicle-needed') && (
            <span className="tag-muted" title="Reliable transportation helpful">🚗 Car helpful</span>
          )}
          {job.tags.includes('license-needed') && (
            <span className="tag-muted" title="Driver's license may be needed">🪪 License helpful</span>
          )}
          {job.tags.includes('night-shift') && (
            <span className="tag-muted" title="Overnight or late night shifts">🌙 Night shift</span>
          )}
          {job.tags.filter(t => !['commission-pay','vehicle-needed','license-needed','night-shift','physical','remote','online','work-from-home','internship','experience','resume'].includes(t)).slice(0, 2).map(t => (
            <span key={t} className="tag-muted">{t}</span>
          ))}
          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="ml-auto text-sm font-medium transition-colors"
            style={{ color: 'var(--amber)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--amber)')}
          >
            How to apply →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="glass-card rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--amber-bdr)'
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(232,160,32,0.1), 0 4px 16px rgba(0,0,0,.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-medium flex-shrink-0"
        style={{ background: icon.bg, border: `1px solid ${icon.border}`, color: icon.color }}
      >
        {icon.abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{job.title}</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>{job.company}{job.location ? ` · ${job.location.split(',')[0]}` : ''}</div>
      </div>
      <div className="text-right flex-shrink-0">
        {job.pay_display && (
          <div className="font-mono text-sm font-medium" style={{ color: 'var(--amber)' }}>{job.pay_display}</div>
        )}
        {dist && <div className="text-xs" style={{ color: 'var(--dim)' }}>{dist} · 16+</div>}
      </div>
    </div>
  )
}
