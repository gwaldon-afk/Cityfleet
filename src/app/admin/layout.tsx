'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/protected-route'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/customers', label: 'Customer pricing' },
  { href: '/admin/audit', label: 'Audit log' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const pathname = usePathname()

  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-cityfleet-navy text-white py-4 px-6 shadow">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Administrator</h1>
              <p className="text-sm text-white/80">{user?.name} ({role})</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === href
                      ? 'bg-cityfleet-gold text-cityfleet-navy'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
