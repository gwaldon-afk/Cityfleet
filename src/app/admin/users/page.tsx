'use client'

import { useState } from 'react'
import { useAdminUsers, type AdminUserRow } from '@/hooks/useAdminUsers'

export default function AdminUsersPage() {
  const {
    users,
    sites,
    loading,
    error,
    fetchAll,
    updateUserStatus,
    addRole,
    removeRole,
  } = useAdminUsers()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [addRoleForUser, setAddRoleForUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('mechanic')
  const [newSiteId, setNewSiteId] = useState('')
  const [adding, setAdding] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const ROLES = [
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'workshop_manager', label: 'Workshop Manager' },
    { value: 'ops_manager', label: 'Ops Manager' },
    { value: 'administrator', label: 'Administrator' },
  ]

  async function onStatusChange(user: AdminUserRow, status: 'active' | 'inactive') {
    if (user.status === status) return
    setUpdatingId(user.id)
    setErrMsg(null)
    try {
      await updateUserStatus(user.id, status)
    } catch (e: any) {
      setErrMsg(e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function onAddRole(userId: string) {
    const siteId = newRole === 'administrator' ? null : newSiteId || null
    if (newRole !== 'administrator' && !siteId) {
      setErrMsg('Select a site for this role.')
      return
    }
    setAdding(true)
    setErrMsg(null)
    try {
      await addRole(userId, newRole, siteId)
      setAddRoleForUser(null)
      setNewRole('mechanic')
      setNewSiteId('')
    } catch (e: any) {
      setErrMsg(e.message)
    } finally {
      setAdding(false)
    }
  }

  async function onRemoveRole(userRoleId: string) {
    setUpdatingId(userRoleId)
    setErrMsg(null)
    try {
      await removeRole(userRoleId)
    } catch (e: any) {
      setErrMsg(e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">User management</h2>
        <button
          type="button"
          onClick={() => fetchAll()}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {errMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errMsg}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cityfleet-gold" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.status}
                        onChange={(e) => onStatusChange(user, e.target.value as 'active' | 'inactive')}
                        disabled={updatingId === user.id}
                        className="border border-gray-300 rounded px-2 py-1 text-sm capitalize"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-1">
                        {(user.user_roles || []).map((ur) => (
                          <span
                            key={ur.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs"
                          >
                            {ur.role.replace(/_/g, ' ')}
                            {ur.site?.name ? ` @ ${ur.site.name}` : ''}
                            <button
                              type="button"
                              onClick={() => onRemoveRole(ur.id)}
                              disabled={updatingId === ur.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              aria-label="Remove role"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {addRoleForUser === user.id ? (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                              {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            {newRole !== 'administrator' && (
                              <select
                                value={newSiteId}
                                onChange={(e) => setNewSiteId(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                <option value="">Select site</option>
                                {sites.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => onAddRole(user.id)}
                              disabled={adding}
                              className="text-xs px-2 py-1 rounded bg-cityfleet-navy text-white hover:opacity-90 disabled:opacity-50"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddRoleForUser(null)}
                              className="text-xs text-gray-600 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddRoleForUser(user.id)}
                            className="text-xs text-cityfleet-gold hover:underline"
                          >
                            + Add role
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}
