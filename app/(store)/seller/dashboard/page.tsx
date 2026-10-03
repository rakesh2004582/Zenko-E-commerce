'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/apiClient'
import { ArrowLeft, Store, Package, ShoppingBag, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface SellerProfile {
  id: number
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  commissionPercent: number
}

interface SellerOrderRow {
  id: number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

const STATUS_STYLE: Record<string, { icon: typeof Clock; className: string; label: string }> = {
  PENDING: { icon: Clock, className: 'bg-amber-50 text-amber-700', label: 'Pending Review' },
  APPROVED: { icon: CheckCircle2, className: 'bg-green-50 text-green-700', label: 'Approved' },
  REJECTED: { icon: XCircle, className: 'bg-red-50 text-red-700', label: 'Rejected' },
  SUSPENDED: { icon: XCircle, className: 'bg-red-50 text-red-700', label: 'Suspended' },
}

export default function SellerDashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [orders, setOrders] = useState<SellerOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notApplied, setNotApplied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const me = await api.get<SellerProfile>('/api/seller/me')
      setProfile(me)
      if (me.status === 'APPROVED') {
        const orderPage = await api.get<{ content: SellerOrderRow[] }>('/api/seller/orders?page=0&size=10')
        setOrders(orderPage.content)
      }
    } catch {
      setNotApplied(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    load()
  }, [user, router, load])

  if (!user) return null

  if (!loading && notApplied) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Store size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">You're not a seller yet</h1>
        <p className="text-sm text-gray-500 mb-6">Apply to start selling your own products on Zenko.</p>
        <Link href="/seller/apply" className="btn-primary inline-flex py-3 px-6 text-sm">Apply to become a seller</Link>
      </div>
    )
  }

  const status = profile ? STATUS_STYLE[profile.status] : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Seller Dashboard</h1>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && profile && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">BUSINESS NAME</p>
              <p className="text-lg font-bold text-gray-900">{profile.businessName}</p>
              <p className="text-xs text-gray-400 mt-1">Commission: {profile.commissionPercent}%</p>
            </div>
            {status && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.className}`}>
                <status.icon size={14} /> {status.label}
              </span>
            )}
          </div>

          {profile.status === 'REJECTED' && profile.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-sm text-red-600">
              Reason: {profile.rejectionReason}
            </div>
          )}

          {profile.status === 'PENDING' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-700">
              Your application is under review. You'll be able to add products once an admin approves it
              (you may need to log out and log back in after approval).
            </div>
          )}

          {profile.status === 'APPROVED' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Package size={16} /> Recent Orders</h2>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders containing your products yet.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                        <p className="text-xs text-gray-400">{o.itemCount} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{o.total}</p>
                        <p className="text-xs text-gray-400">{o.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5">
                <ShoppingBag size={13} /> Product management API is live at <code className="bg-gray-100 px-1.5 py-0.5 rounded">/api/seller/products</code> — a full add/edit product UI can be built the same way as the admin product form.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
