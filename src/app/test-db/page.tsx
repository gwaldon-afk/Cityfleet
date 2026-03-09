'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDatabase() {
  const [sites, setSites] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      try {
        // Fetch sites
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('*')
          .limit(5)

        if (sitesError) throw sitesError
        setSites(sitesData || [])

        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .limit(5)

        if (customersError) throw customersError
        setCustomers(customersData || [])

        // Fetch parts
        const { data: partsData, error: partsError } = await supabase
          .from('parts')
          .select('*')
          .limit(5)

        if (partsError) throw partsError
        setParts(partsData || [])

        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test ✅</h1>

      <div className="grid gap-8">
        {/* Sites */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sites ({sites.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{site.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{site.address_city}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{site.address_state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customers ({customers.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.account_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.account_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Parts ({parts.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{part.part_number}</td>
                    <td className="px-6 py-4">{part.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{part.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <strong className="font-bold">Success! </strong>
        <span className="block sm:inline">Your app is connected to Supabase and can read data.</span>
      </div>
    </div>
  )
}