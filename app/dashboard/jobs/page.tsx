import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JobCard from '@/components/JobCard'
import { distanceMiles } from '@/lib/schools'
import { redirect } from 'next/navigation'

export default async function BrowsePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('lat,lng').eq('id', user.id).single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(50)

  const withDist = (jobs ?? []).map(j => ({
    ...j,
    distance_miles: profile?.lat && j.lat
      ? distanceMiles(profile.lat, profile.lng, j.lat, j.lng)
      : null,
  })).sort((a, b) => (a.distance_miles ?? 99) - (b.distance_miles ?? 99))

  return (
    <div className="p-7">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em' }}>
          All jobs
        </h1>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
          {withDist.length} listings
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {withDist.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {withDist.length === 0 && (
        <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-4">📋</div>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, marginBottom: 8 }}>No listings yet</div>
          <div className="text-sm">The cron fetches new jobs every night.</div>
        </div>
      )}
    </div>
  )
}
