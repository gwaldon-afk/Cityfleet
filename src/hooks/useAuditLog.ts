'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AuditRow {
  id: string
  entity_type: string
  entity_id: string | null
  action: string
  old_data: unknown
  new_data: unknown
  user_id: string | null
  created_at: string
}

const PAGE_SIZE = 50

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<{
    dateFrom: string
    dateTo: string
    entityType: string
    action: string
  }>({
    dateFrom: '',
    dateTo: '',
    entityType: '',
    action: '',
  })

  const fetchPage = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      let q = (supabase as any)
        .from('audit_log')
        .select('id, entity_type, entity_id, action, old_data, new_data, user_id, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (filters.dateFrom) q = q.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`)
      if (filters.dateTo) q = q.lte('created_at', `${filters.dateTo}T23:59:59.999Z`)
      if (filters.entityType) q = q.eq('entity_type', filters.entityType)
      if (filters.action) q = q.eq('action', filters.action)

      const { data, error: e, count } = await q
      if (e) throw e
      setEntries(data || [])
      setTotal(count ?? 0)
      setPage(pageNum)
    } catch (err: any) {
      setError(err.message)
      setEntries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters.dateFrom, filters.dateTo, filters.entityType, filters.action])

  const setFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return {
    entries,
    loading,
    error,
    page,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    filters,
    setFilter,
    fetchPage,
  }
}
