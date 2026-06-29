import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JobCard from '@/components/JobCard'
import { distanceMiles } from '@/lib/schools'
import { redirect } from 'next/navigation'

export default async function MatchesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  // Get stored matches, or fall back to best jobs by tags
  let jobs: any[] = []
  const { data: matches } = await supabase
    .from('matches')
    .select('*, jobs(*)')
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(10)

  if (matches && matches.length > 0) {
    jobs = matches.map(m => ({
      ...m.jobs,
      score: m.score,
      explanation: m.explanation,
      distance_miles: profile.lat && m.jobs.lat
        ? distanceMiles(profile.lat, profile.lng, m.jobs.lat, m.jobs.lng)
        : null,
    }))
  } else {
    // No matches yet — show recent jobs filtered by interests
    const { data: recent } = await supabase
      .from('jobs')
      .select('*')
      .gte('min_age', 0)
      .lte('min_age', 16)
      .order('fetched_at', { ascending: false })
      .limit(10)

    jobs = (recent ?? []).map(j => ({
      ...j,
      distance_miles: profile.lat && j.lat
        ? distanceMiles(profile.lat, profile.lng, j.lat, j.lng)
        : null,
    }))
  }

  const name = profile.name || user.email?.split('@')[0] || 'there'

  // Stats
  const { data: appStats } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user.id)
  const totalApplied = appStats?.length ?? 0
  const interviews = appStats?.filter(a => a.status === 'interview').length ?? 0
  const hired = appStats?.filter(a => a.status === 'hired').length ?? 0

  return (
    <div className="p-7" style={{ position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,160,32,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div className="flex items-baseline gap-3 mb-5">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>
          Hey <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--amber)' }}>{name}</em>
        </h1>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ color: 'var(--amber)', border: '1px solid var(--amber-bdr)', background: 'var(--amber-bg)' }}>
          {jobs.length} matches
        </span>
      </div>

      {/* Stats row */}
      {totalApplied > 0 && (
        <div className="flex gap-3 mb-6">
          {[
            { label: 'Applied', val: totalApplied },
            { label: 'Interviews', val: interviews },
            { label: 'Hired', val: hired },
          ].map(({ label, val }) => (
            <div key={label} className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 90 }}>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 600 }}>{val}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-4">🔍</div>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, marginBottom: 8 }}>Fetching jobs for you</div>
          <div className="text-sm">New listings land every night. Check back tomorrow.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={{ ...job, is_top: i === 0 }} />
          ))}
        </div>
      )}
    </div>
  )
}
