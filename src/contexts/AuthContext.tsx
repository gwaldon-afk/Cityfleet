'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Auth Context (backwards-compatible with old auth-context)
// Location: src/contexts/AuthContext.tsx
// ═══════════════════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

// Export UserRole so other files can import it
export type UserRole = 'mechanic' | 'workshop_manager' | 'ops_manager' | 'administrator'

export interface User {
  id: string
  first_name: string
  last_name: string
  name: string          // computed: "first_name last_name" for backwards compat
  email: string
  role: UserRole | null // attached to user object for backwards compat
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
  // New names
  user: User | null
  role: UserRole | null
  site: Site | null
  isLoading: boolean
  error: string | null
  activeShift: Shift | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshShift: () => Promise<void>

  // Backwards-compatible aliases (old auth-context names)
  profile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setRole(null)
          setSite(null)
          setActiveShift(null)
          setIsLoading(false)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(authId: string) {
    try {
      setIsLoading(true)
      setError(null)

      // 1. Get user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authId)
        .single()

      if (userError) throw userError

      // 2. Get primary role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authId)
        .limit(1)
        .single()

      if (roleError) throw roleError

      const userRole = roleData.role as UserRole
      setRole(userRole)

      // Build user with backwards-compatible fields
      const fullUser: User = {
        ...userData,
        name: `${userData.first_name} ${userData.last_name}`,
        role: userRole,
      }
      setUser(fullUser)

      // 3. Get site
      if (roleData.site_id) {
        const { data: siteData } = await supabase
          .from('sites')
          .select('*')
          .eq('id', roleData.site_id)
          .single()

        if (siteData) setSite(siteData)
      }

      // 4. Check for active shift (mechanic only)
      if (userRole === 'mechanic') {
        await loadActiveShift(authId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile')
      console.error('Auth profile load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadActiveShift(userId: string) {
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('clock_on', { ascending: false })
      .limit(1)
      .maybeSingle()

    setActiveShift(shiftData)
  }

async function login(email: string, password: string) {
    try {
      setError(null)
      const supabaseUrl = 'https://pepbvodjevgtlucvwhqm.supabase.co'
      const supabaseKey = 'sb_publishable_rcIvumSIrwrClej5t5p8xQ_5PCtQFpb'
      
      // Direct fetch bypasses library DNS issues
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.msg || 'Login failed')
        return { success: false, error: data.msg || 'Login failed' }
      }
      
      // Set the session in the Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  async function logout() {
    await supabase.auth.signOut()
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
        // New names
        user, role, site, isLoading, error, activeShift,
        login, logout, refreshShift,
        // Backwards-compatible aliases
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
