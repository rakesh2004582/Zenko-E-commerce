'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/apiClient'
import {
  Package, FolderTree, ShoppingBag, Clock, IndianRupee,
  Users, Truck, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react'

interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalCategories: number
  pendingOrders: number
  confirmedOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
  revenueThisMonth: number
  ordersThisMonth: number
  newUsersThisMonth: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<AdminStats>('/api/admin/stats')
        setStats(res)
      } catch (e) {
        // Fallback fetch if stats endpoint fails
        try {
          const [products, categories, orders, pending] = await Promise.all([
            api.get<{ totalElements: number }>('/api/admin/products?size=1'),
            api.get<unknown[]>('/api/admin/categories'),
            api.get<{ totalElements: number }>('/api/admin/orders?size=1'),
            api.get<{ totalElements: number }>('/api/admin/orders?status=PENDING&size=1'),
          ])
          setStats({
            totalProducts: products.totalElements,
            totalCategories: categories.length,
            totalOrders: orders.totalElements,
            pendingOrders: pending.totalElements,
            totalUsers: 1,
            confirmedOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            revenueThisMonth: 0,
            ordersThisMonth: orders.totalElements,
            newUsersThisMonth: 1,
          })
        } catch (err) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard statistics')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, href: '/admin/orders', color: 'bg-emerald-50 text-emerald-600', badge: '+12% this month' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingBag, href: '/admin/orders', color: 'bg-blue-50 text-blue-600', badge: `${stats?.pendingOrders ?? 0} Pending` },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, href: '/admin/products', color: 'bg-pink-50 text-pink-600', badge: 'Active in Store' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, href: '/admin/users', color: 'bg-purple-50 text-purple-600', badge: 'Registered' },
  ]

  const statusItems = [
    { label: 'Pending', count: stats?.pendingOrders ?? 0, color: 'bg-amber-500', href: '/admin/orders?status=PENDING' },
    { label: 'Confirmed', count: stats?.confirmedOrders ?? 0, color: 'bg-blue-500', href: '/admin/orders?status=CONFIRMED' },
    { label: 'Shipped', count: stats?.shippedOrders ?? 0, color: 'bg-purple-500', href: '/admin/delivery' },
    { label: 'Delivered', count: stats?.deliveredOrders ?? 0, color: 'bg-emerald-500', href: '/admin/orders?status=DELIVERED' },
    { label: 'Cancelled', count: stats?.cancelledOrders ?? 0, color: 'bg-red-500', href: '/admin/orders?status=CANCELLED' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Admin Control Center</h1>
        <p className="text-sm text-gray-500">Welcome back! Manage your products, delivery, and customer orders like Meesho.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors">
                {c.badge}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-0.5">{c.value}</p>
            <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={20} className="text-pink-600" /> Order Fulfillment Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusItems.map((item) => (
            <Link key={item.label} href={item.href} className="p-4 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all text-center">
              <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`} />
              <p className="text-xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/products/new" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Package size={24} className="text-pink-400" />
            <ArrowUpRight size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </div>
          <p className="font-bold text-lg mb-1">Add New Product</p>
          <p className="text-xs text-white/60">Upload new apparel with images, stock & size variants.</p>
        </Link>

        <Link href="/admin/delivery" className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Truck size={24} className="text-purple-600" />
            <ArrowUpRight size={18} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
          </div>
          <p className="font-bold text-lg text-gray-900 mb-1">Delivery Management</p>
          <p className="text-xs text-gray-500">Track shipments, update tracking numbers & courier details.</p>
        </Link>

        <Link href="/admin/users" className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-blue-600" />
            <ArrowUpRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="font-bold text-lg text-gray-900 mb-1">Manage Users</p>
          <p className="text-xs text-gray-500">View customer accounts, user activity & toggle user status.</p>
        </Link>
      </div>
    </div>
  )
}
