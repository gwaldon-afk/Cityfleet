'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface SiteMechanic {
  id: string
  first_name: string
  last_name: string
  name: string
}

export function useSiteMechanics() {
  const { site } = useAuth()
  const [mechanics, setMechanics] = useState<SiteMechanic[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMechanics = useCallback(async () => {
    if (!site?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: roleData } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', 'mechanic')
        .eq('site_id', site.id)
      const userIds = (roleData || []).map((r: { user_id: string }) => r.user_id)
      if (userIds.length === 0) {
        setMechanics([])
        return
      }
      const { data: users } = await (supabase as any)
        .from('users')
        .select('id, first_name, last_name')
        .in('id', userIds)
        .eq('status', 'active')
      setMechanics(
        (users || []).map((u: { id: string; first_name: string; last_name: string }) => ({
          ...u,
          name: `${u.first_name} ${u.last_name}`,
        }))
      )
    } catch {
      setMechanics([])
    } finally {
      setLoading(false)
    }
  }, [site?.id])

  useEffect(() => {
    fetchMechanics()
  }, [fetchMechanics])

  return { mechanics, loading, fetchMechanics }
}
