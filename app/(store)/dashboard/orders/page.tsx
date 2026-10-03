'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getMyOrders } from '@/lib/dataLoader'
import type { Order } from '@/types'
import { Package, ChevronLeft, ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-blue-50 text-blue-700',
  Shipped: 'bg-purple-50 text-purple-700',
  Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-700',
}

export default function MyOrdersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getMyOrders(page, 10)
      setOrders(result.orders)
      setTotalPages(result.totalPages)
    } catch {
      setOrders([])
    }
    setLoading(false)
  }, [page])

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    load()
  }, [user, router, load])

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>My Orders</h1>

      {loading && <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}

      {!loading && orders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet</p>
          <Link href="/" className="btn-primary inline-flex">Start Shopping</Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(o => (
          <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-mono text-xs text-gray-400">Order #{o.id}</p>
                <p className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>{o.status}</span>
            </div>
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {o.items.slice(0, 4).map((item, i) => (
                <img key={i} src={item.thumbnail || '/images/products/fashion/women-01.jpg'} alt={item.name} className="w-12 h-14 object-cover rounded-lg bg-gray-100 flex-shrink-0" />
              ))}
              {o.items.length > 4 && (
                <div className="w-12 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                  +{o.items.length - 4}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <p className="text-sm text-gray-600">{o.items.reduce((s, i) => s + i.quantity, 0)} item(s) · <span className="font-bold text-gray-900">₹{o.total}</span></p>
              <Link href={`/dashboard/orders/${o.id}`}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}>
                View Details <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  )
}
