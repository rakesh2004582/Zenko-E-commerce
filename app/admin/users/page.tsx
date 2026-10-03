'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/apiClient'
import { Users, Search, Shield, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminUser {
  id: number
  name: string
  email: string
  phone: string
  role: string
  active: boolean
  createdAt: string
}

interface UserPagedResponse {
  content: AdminUser[]
  page: number
  totalElements: number
  totalPages: number
  last: boolean
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UserPagedResponse | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<UserPagedResponse>(`/api/admin/users?page=${page}&size=15`)
      setData(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const toggleUserStatus = async (id: number) => {
    setUpdatingId(id)
    try {
      await api.patch(`/api/admin/users/${id}/status`)
      toast.success('User status updated')
      loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = data?.content.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-pink-600" /> User Management
          </h1>
          <p className="text-sm text-gray-500">
            {data ? `${data.totalElements} registered customer(s)` : 'Loading users...'}
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">User</th>
                <th className="text-left px-5 py-3.5 font-semibold">Phone</th>
                <th className="text-left px-5 py-3.5 font-semibold">Role</th>
                <th className="text-left px-5 py-3.5 font-semibold">Joined Date</th>
                <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Loading customer records...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No users match your criteria.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-xs">
                          {u.name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                      {u.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.role === 'ADMIN' && <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          u.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role !== 'ADMIN' && (
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => toggleUserStatus(u.id)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                            u.active
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {data.page + 1} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={data.page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
