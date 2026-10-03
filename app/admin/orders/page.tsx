'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/apiClient'
import type { PagedResponse, BackendOrder } from '@/lib/mappers'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PagedResponse<BackendOrder> | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), size: '15' })
      if (status) qs.set('status', status)
      const result = await api.get<PagedResponse<BackendOrder>>(`/api/admin/orders?${qs.toString()}`)
      setData(result)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load orders')
    }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order marked ${newStatus}`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
    setUpdatingId(null)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{data ? `${data.totalElements} total` : '...'}</p>
        </div>
        <select className="form-input max-w-[200px]" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Order</th>
                <th className="text-left px-5 py-3 font-semibold">Items</th>
                <th className="text-left px-5 py-3 font-semibold">Total</th>
                <th className="text-left px-5 py-3 font-semibold">Payment</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!loading && data?.content.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders found</td></tr>
              )}
              {!loading && data?.content.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/50 align-top">
                  <td className="px-5 py-3">
                    <p className="font-mono font-semibold text-gray-900 text-xs">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{o.shippingAddress?.fullName} · {o.shippingAddress?.city}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Package size={13} className="text-gray-400" />
                      {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">₹{o.total}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-600">{o.paymentMethod}</span><br />
                    <span className={`text-xs font-semibold ${o.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>{o.paymentStatus}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="form-input text-xs py-1.5"
                      value={o.status}
                      disabled={updatingId === o.id || o.status === 'DELIVERED' || o.status === 'CANCELLED'}
                      onChange={e => updateStatus(o.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Page {data.page + 1} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={data.page === 0} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft size={15} /></button>
              <button disabled={data.last} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}>
      <OrdersContent />
    </Suspense>
  )
}
