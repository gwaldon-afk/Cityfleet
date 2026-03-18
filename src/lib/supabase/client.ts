import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient<any> | null = null

const SUPABASE_REF = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]) ?? 'default'
const AUTH_STORAGE_KEY = `sb-${SUPABASE_REF}-auth-token`

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)?.access_token ?? null
  } catch {
    return null
  }
}

function authFetch(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const token = getStoredAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...options, headers }).then((res) => {
    if (token && res.status === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } catch {}
      window.location.href = '/login?expired=1'
    }
    return res
  })
}

export function createClient(): SupabaseClient<any> {
  if (client) return client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const ref = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] ?? 'none'
    console.log('[Supabase] Using project:', ref, ref !== 'pepbvodjevgtlucvwhqm' ? '— fix .env.local if this should be whqm' : '')
  }
  client = createSupabaseClient<any>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
    global: {
      fetch: authFetch,
    },
  })
  return client
}