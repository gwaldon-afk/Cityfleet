'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserRoleRow {
  id: string
  user_id: string
  role: string
  site_id: string | null
  site: { name: string } | null
}

export interface AdminUserRow {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  user_roles: UserRoleRow[]
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const [usersRes, sitesRes] = await Promise.all([
        (supabase as any)
          .from('users')
          .select(`
            id, first_name, last_name, email, status,
            user_roles(id, user_id, role, site_id, site:sites(name))
          `)
          .order('email'),
        (supabase as any)
          .from('sites')
          .select('id, name')
          .order('name'),
      ])

      if (usersRes.error) throw usersRes.error
      if (sitesRes.error) throw sitesRes.error

      setUsers(usersRes.data || [])
      setSites(sitesRes.data || [])
    } catch (err: any) {
      setError(err.message)
      setUsers([])
      setSites([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function updateUserStatus(userId: string, status: 'active' | 'inactive') {
    const supabase = createClient()
    const { error: e } = await (supabase as any)
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (e) throw e
    await fetchAll()
  }

  async function addRole(userId: string, role: string, siteId: string | null) {
    const supabase = createClient()
    const { error: e } = await (supabase as any)
      .from('user_roles')
      .insert({ user_id: userId, role, site_id: siteId })
    if (e) throw e
    await fetchAll()
  }

  async function removeRole(userRoleId: string) {
    const supabase = createClient()
    const { error: e } = await (supabase as any).from('user_roles').delete().eq('id', userRoleId)
    if (e) throw e
    await fetchAll()
  }

  function rolesDisplay(user: AdminUserRow): string {
    const list = (user.user_roles || []).map(
      (ur) => `${ur.role.replace(/_/g, ' ')}${ur.site?.name ? ` @ ${ur.site.name}` : ''}`
    )
    return list.length ? list.join(', ') : '—'
  }

  return { users, sites, loading, error, fetchAll, updateUserStatus, addRole, removeRole, rolesDisplay }
}
