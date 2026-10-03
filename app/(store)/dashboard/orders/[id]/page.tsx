'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/apiClient'
import { mapOrder } from '@/lib/mappers'
import type { BackendOrder } from '@/lib/mappers'
import type { Order } from '@/types'
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle,
  MapPin, CreditCard, Copy, Phone, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending:   <Clock size={16} />,
  Confirmed: <CheckCircle size={16} />,
  Shipped:   <Truck size={16} />,
  Delivered: <Package size={16} />,
  Cancelled: <XCircle size={16} />,
}
const STATUS_COLORS: Record<string, string> = {
  Pending:   'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped:   'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (!id) return
    setLoading(true)
    api.get<BackendOrder>(`/api/orders/${id}`)
      .then(raw => setOrder(mapOrder(raw)))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id, user, router])

  const handleCancel = async () => {
    if (!order) return
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      await api.post<BackendOrder>(`/api/orders/${order.id}/cancel`)
      setOrder(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
      toast.success('Order cancelled successfully', { position: 'bottom-center' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel order', { position: 'bottom-center' })
    }
    setCancelling(false)
  }

  const copyId = () => {
    if (!order) return
    navigator.clipboard.writeText(String(order.id))
    toast.success('Order ID copied!', { duration: 1200, position: 'bottom-center' })
  }

  if (!user) return null

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Package size={48} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
      <p className="text-gray-500 text-sm mb-6">This order doesn't exist or you don't have access.</p>
      <Link href="/dashboard/orders" className="btn-primary inline-flex">Back to Orders</Link>
    </div>
  )

  const isCancelled = order.status === 'Cancelled'
  const canCancel = ['Pending', 'Confirmed'].includes(order.status)
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Order Details
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">#{order.id}</span>
            <button onClick={copyId} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Copy Order ID">
              <Copy size={13} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_ICONS[order.status]} {order.status}
          </span>
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 font-medium">
              <XCircle size={12} /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Order Progress Timeline */}
      {!isCancelled && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">Order Progress</p>
          <div className="flex items-start justify-between">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep
              const active = i === currentStep
              return (
                <div key={step} className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative flex items-center justify-center w-full">
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 h-0.5 z-0 w-full"
                        style={{ backgroundColor: i < currentStep ? 'var(--color-primary)' : '#e5e7eb' }} />
                    )}
                    <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all"
                      style={{
                        backgroundColor: done ? 'var(--color-primary)' : '#f9fafb',
                        borderColor: done ? 'var(--color-primary)' : '#e5e7eb',
                        color: done ? 'white' : '#9ca3af',
                        boxShadow: active ? '0 0 0 4px rgba(196,61,107,0.15)' : 'none',
                      }}>
                      {done ? '✓' : (i + 1)}
                    </div>
                  </div>
                  <p className={`text-[11px] font-semibold text-center ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-5 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Order Cancelled</p>
            <p className="text-xs text-red-500 mt-0.5">This order has been cancelled. Any payment will be refunded within 3–5 business days.</p>
          </div>
        </div>
      )}

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Tracking History</p>
          <div className="space-y-3">
            {[...order.statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: i === 0 ? 'var(--color-primary)' : '#d1d5db' }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{h.status}</p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        {/* Delivery Address */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} style={{ color: 'var(--color-primary)' }} />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivery Address</p>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{order.address.fullName}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Phone size={11} />{order.address.phone}
          </div>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
            {order.address.city}, {order.address.state} – {order.address.pincode}<br />
            {order.address.country}
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} style={{ color: 'var(--color-primary)' }} />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Details</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {order.paymentStatus}
              </span>
            </div>
            {order.couponApplied && (
              <div className="flex justify-between"><span className="text-gray-500">Coupon</span><span className="font-mono text-xs font-bold text-green-600">{order.couponApplied}</span></div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₹{order.discount}</span></div>}
            <div className="flex justify-between text-gray-500"><span>Delivery</span><span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span></div>
            <div className="flex justify-between font-black text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
        </p>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={item.thumbnail || '/images/products/fashion/women-01.jpg'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Size: {item.size}</span>
                  {item.color && <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Color: {item.color}</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{item.finalPrice * item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Footer */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Need help?{' '}
        <a href="mailto:help@zenko.com" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Contact Support</a>
        {' '}· Order ID: <span className="font-mono">{order.id}</span>
      </p>
    </div>
  )
}
