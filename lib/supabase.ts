import { createBrowserClient } from '@supabase/ssr'

// Client-side — uses cookies so middleware can read the session server-side
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
