import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let realtimeClient: SupabaseClient | null | undefined

export function getSupabaseRealtimeClient() {
  if (typeof window === 'undefined') {
    return null
  }

  if (realtimeClient !== undefined) {
    return realtimeClient
  }

  const url = import.meta.env.VITE_SUPABASE_URL
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    realtimeClient = null
    return realtimeClient
  }

  realtimeClient = createClient(url, key, {
    auth: {
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 8,
      },
    },
  })

  return realtimeClient
}
