'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AdminCustomerRow {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  status: string
  labour_rate_cents: number | null
  parts_margin_percent: number | null
}

export function useAdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: e } = await (supabase as any)
        .from('customers')
        .select('id, name, contact_name, contact_email, status, labour_rate_cents, parts_margin_percent')
        .order('name')
      if (e) throw e
      setCustomers(data || [])
    } catch (err: any) {
      setError(err.message)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function updatePricing(
    customerId: string,
    labourRateCents: number | null,
    partsMarginPercent: number | null
  ) {
    const supabase = createClient()
    const { error: e } = await (supabase as any)
      .from('customers')
      .update({
        labour_rate_cents: labourRateCents,
        parts_margin_percent: partsMarginPercent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
    if (e) throw e
    await fetchAll()
  }

  return { customers, loading, error, fetchAll, updatePricing }
}
