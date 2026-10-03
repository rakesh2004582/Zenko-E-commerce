'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/apiClient'
import type { PagedResponse, BackendOrder } from '@/lib/mappers'
import { Truck, Package, MapPin, CheckCircle, Clock, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDeliveryPage() {
  const [data, setData] = useState<PagedResponse<BackendOrder> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('CONFIRMED,SHIPPED')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<PagedResponse<BackendOrder>>(`/api/admin/orders?page=${page}&size=15`)
      setData(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

  const updateStatus = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: nextStatus })
      toast.success(`Order #${orderId} status set to ${nextStatus}`)
      loadShipments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="text-pink-600" /> Delivery & Dispatch Management
          </h1>
          <p className="text-sm text-gray-500">
            Track COD & prepaid deliveries across India. Update courier status in real-time.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === '' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            All Shipments
          </button>
          <button
            onClick={() => setStatusFilter('SHIPPED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === 'SHIPPED' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            In Transit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">Order / AWB</th>
                <th className="text-left px-5 py-3.5 font-semibold">Shipping Address</th>
                <th className="text-left px-5 py-3.5 font-semibold">Items</th>
                <th className="text-left px-5 py-3.5 font-semibold">Payment</th>
                <th className="text-left px-5 py-3.5 font-semibold">Current Status</th>
                <th className="text-left px-5 py-3.5 font-semibold">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Loading delivery queues...
                  </td>
                </tr>
              )}
              {!loading && data?.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No active shipments found.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.content.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 align-top">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-gray-900 text-xs">{o.orderNumber}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded bg-gray-100 text-gray-600">
                        Courier: Delhivery / Express
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-bold text-gray-900 text-xs">{o.shippingAddress?.fullName}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {o.shippingAddress?.line1}, {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pincode}
                      </p>
                      <p className="text-[11px] text-pink-600 font-semibold mt-0.5">
                        📞 {o.shippingAddress?.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package size={14} className="text-gray-400" />
                        <span className="font-semibold">{o.items.reduce((s, i) => s + i.quantity, 0)} Pcs</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]">
                        {o.items.map(i => i.productName).join(', ')}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 text-xs">₹{o.total}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                          o.paymentMethod === 'COD' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          o.status === 'DELIVERED'
                            ? 'bg-green-50 text-green-700'
                            : o.status === 'SHIPPED'
                            ? 'bg-purple-50 text-purple-700'
                            : o.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {o.status === 'DELIVERED' && <CheckCircle size={12} />}
                        {o.status === 'SHIPPED' && <Truck size={12} />}
                        {o.status === 'CONFIRMED' && <Clock size={12} />}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        {o.status === 'PENDING' && (
                          <button
                            disabled={updatingId === o.id}
                            onClick={() => updateStatus(o.id, 'CONFIRMED')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Approve & Confirm
                          </button>
                        )}
                        {o.status === 'CONFIRMED' && (
                          <button
                            disabled={updatingId === o.id}
                            onClick={() => updateStatus(o.id, 'SHIPPED')}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Dispatch / Mark Shipped
                          </button>
                        )}
                        {o.status === 'SHIPPED' && (
                          <button
                            disabled={updatingId === o.id}
                            onClick={() => updateStatus(o.id, 'DELIVERED')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Mark Delivered (Complete)
                          </button>
                        )}
                        {o.status === 'DELIVERED' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={14} /> Order Fulfilled
                          </span>
                        )}
                      </div>
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
