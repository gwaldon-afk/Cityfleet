'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Auth Context
// Location: src/contexts/AuthContext.tsx
// Direct fetch with retry logic for flaky DNS
// ═══════════════════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'mechanic' | 'workshop_manager' | 'ops_manager' | 'administrator'

export interface User {
  id: string
  first_name: string
  last_name: string
  name: string
  email: string
  role: UserRole | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface Site {
  id: string
  name: string
  timezone: string
  status: 'active' | 'inactive'
}

export interface Shift {
  id: string
  user_id: string
  site_id: string
  clock_on: string
  clock_off: string | null
  status: 'active' | 'completed'
}

interface AuthState {
  user: User | null
  role: UserRole | null
  site: Site | null
  isLoading: boolean
  error: string | null
  activeShift: Shift | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshShift: () => Promise<void>
  profile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_REF = SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] || 'default'
const STORAGE_KEY = `sb-${SUPABASE_REF}-auth-token`
const MAX_RETRIES = 5
const RETRY_DELAY = 800

// Retry wrapper — keeps trying until DNS resolves
async function fetchWithRetry(url: string, options?: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      return res
    } catch (err: any) {
      if (i === retries) throw err
      console.log(`Fetch attempt ${i + 1} failed, retrying in ${RETRY_DELAY}ms...`)
      await new Promise(r => setTimeout(r, RETRY_DELAY))
    }
  }
  throw new Error('All fetch retries exhausted')
}

async function supabaseRestFetch(path: string, token: string) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetchWithRetry(url, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = err.message || err.msg || err.error_description || `Request failed: ${res.status}`
    console.error('[Auth] REST failed:', { path, status: res.status, body: err })
    throw new Error(msg)
  }
  return res.json()
}

function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)?.access_token || null
  } catch {
    return null
  }
}

function getStoredUserId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)?.user?.id || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = getStoredUserId()
    const token = getStoredToken()
    if (userId && token) {
      loadUserProfile(userId, token)
    } else {
      setIsLoading(false)
    }
  }, [])

  async function loadUserProfile(authId: string, token?: string) {
    const accessToken = token || getStoredToken()
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let users: any[]
      try {
        users = await supabaseRestFetch(
          `users?id=eq.${authId}&select=*&limit=1`,
          accessToken
        )
      } catch (e: any) {
        console.error('[Auth] Failed to load users:', e?.message, e)
        setError(e?.message?.includes('querying schema') ? 'Profile load failed (users). Check Supabase logs and RLS.' : (e?.message || 'Failed to load user profile'))
        return
      }
      if (!users || users.length === 0) {
        setError('User not found in app (run seed: public.users must match auth user id).')
        return
      }
      const userData = users[0]

      let roles: any[]
      try {
        roles = await supabaseRestFetch(
          `user_roles?user_id=eq.${authId}&select=*&limit=1`,
          accessToken
        )
      } catch (e: any) {
        console.error('[Auth] Failed to load user_roles:', e?.message, e)
        setError(e?.message?.includes('querying schema') ? 'Profile load failed (user_roles). Check Supabase logs and RLS.' : (e?.message || 'Failed to load role'))
        return
      }
      if (!roles || roles.length === 0) {
        setError('Role not found (run seed: user_roles row for this user).')
        return
      }
      const roleData = roles[0]

      const userRole = roleData.role as UserRole
      setRole(userRole)

      const fullUser: User = {
        ...userData,
        name: `${userData.first_name} ${userData.last_name}`,
        role: userRole,
      }
      setUser(fullUser)

      if (roleData.site_id) {
        try {
          const sites = await supabaseRestFetch(
            `sites?id=eq.${roleData.site_id}&select=*&limit=1`,
            accessToken
          )
          if (sites && sites.length > 0) setSite(sites[0])
        } catch {
          setSite(null)
        }
      }

      if (userRole === 'mechanic') {
        await loadActiveShift(authId, accessToken)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile')
      console.error('Auth profile load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

async function loadActiveShift(userId: string, token?: string) {
    const accessToken = token || getStoredToken()
    if (!accessToken) return

    try {
      const shifts = await supabaseRestFetch(
        `shifts?mechanic_id=eq.${userId}&clock_off_at=is.null&order=clock_on_at.desc&limit=1`,
        accessToken
      )
      setActiveShift(shifts && shifts.length > 0 ? shifts[0] : null)
    } catch {
      setActiveShift(null)
    }
  }
  async function login(email: string, password: string) {
    try {
      setError(null)

      const res = await fetchWithRetry(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const authMsg = data.msg || data.message || data.error_description || 'Login failed'
        console.error('[Auth] Token request failed (Supabase Auth 500). Full response:', res.status, JSON.stringify(data, null, 2))
        setError(authMsg)
        return { success: false, error: authMsg }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user,
      }))

      await loadUserProfile(data.user.id, data.access_token)

      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  async function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setRole(null)
    setSite(null)
    setActiveShift(null)
  }

  async function refreshShift() {
    if (user) await loadActiveShift(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        user, role, site, isLoading, error, activeShift,
        login, logout, refreshShift,
        profile: user,
        loading: isLoading,
        signIn: login,
        signOut: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
