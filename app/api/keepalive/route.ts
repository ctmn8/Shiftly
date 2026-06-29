import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Keeps Supabase free tier from pausing (pings every 3 days via Vercel cron)
export async function GET() {
  await supabaseAdmin.from('jobs').select('id').limit(1)
  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}
