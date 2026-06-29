import { createClient } from '@supabase/supabase-js'

// Server-side only — never import this in client components
// Only use in API routes, server components, and cron jobs
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
