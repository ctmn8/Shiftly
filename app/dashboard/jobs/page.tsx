'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import JobCard from '@/components/JobCard'
import { distanceMiles } from '@/lib/schools'

const TAGS = ['food-service', 'retail', 'outdoor', 'customer-service', 'physical', 'flexible', 'weekend', 'part-time']

interface Job {
  id: string
  title: string
  company: string
  location: string
  pay_display: string | null
  tags: string[]
  apply_url: string
  min_age: number
  lat: number | null
  lng: number | null
}

export default function BrowsePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filtered, setFiltered] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [profileCoords, setProfileCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('lat,lng').eq('id', user.id).single()
        if (p?.lat) setProfileCoords({ lat: p.lat, lng: p.lng })
      }
      const { data } = await supabase.from('jobs').select('*').order('fetched_at', { ascending: false }).limit(60)
      const withDist = (data ?? []).map((j: Job) => ({
        ...j,
        distance_miles: profileCoords && j.lat ? distanceMiles(profileCoords.lat, profileCoords.lng, j.lat, j.lng) : null,
      }))
      setJobs(withDist as any)
      setFiltered(withDist as any)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = jobs
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
      )
    }
    if (activeTag) {
      result = result.filter(j => j.tags?.includes(activeTag))
    }
    setFiltered(result)
  }, [search, activeTag, jobs])

  return (
    <div className="p-7">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>
          All jobs
        </h1>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
          {filtered.length} listings
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by job title or company..."
          className="w-full max-w-md rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--amber-bdr)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAGS.map(tag => (
          <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full transition-all"
            style={{
              background: activeTag === tag ? 'var(--amber-bg)' : 'rgba(255,248,235,0.04)',
              border: `1px solid ${activeTag === tag ? 'var(--amber-bdr)' : 'var(--border)'}`,
              color: activeTag === tag ? 'var(--amber)' : 'var(--muted)',
            }}>
            {tag.replace('-', ' ')}
          </button>
        ))}
        {activeTag && (
          <button onClick={() => setActiveTag(null)}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ color: 'var(--red)', border: '1px solid rgba(220,96,96,0.25)', background: 'rgba(220,96,96,0.06)' }}>
            ✕ clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl" style={{ background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 80}ms` }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-4">🔍</div>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, marginBottom: 6 }}>No results</div>
          <div className="text-sm">Try a different search or clear the filter.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(job => <JobCard key={job.id} job={job as any} />)}
        </div>
      )}
    </div>
  )
}
