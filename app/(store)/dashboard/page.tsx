'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Package, User, LogOut, ShoppingBag, Heart, Shield } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Hi, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200'
        }`}>
          {isAdmin ? '👑 Admin' : '👤 Customer'}
        </span>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Link href="/dashboard/orders"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group">
          <Package size={22} className="mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--color-primary)' }} />
          <p className="font-bold text-gray-900 text-sm mb-0.5">My Orders</p>
          <p className="text-xs text-gray-400">Track &amp; manage</p>
        </Link>

        <Link href="/dashboard/wishlist"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group">
          <Heart size={22} className="mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--color-primary)' }} />
          <p className="font-bold text-gray-900 text-sm mb-0.5">Wishlist</p>
          <p className="text-xs text-gray-400">Saved items</p>
        </Link>

        <Link href="/"
          className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group">
          <ShoppingBag size={22} className="mb-3 transition-transform group-hover:scale-110 text-gray-700" />
          <p className="font-bold text-gray-900 text-sm mb-0.5">Shop</p>
          <p className="text-xs text-gray-400">Browse products</p>
        </Link>

        {isAdmin ? (
          <Link href="/admin"
            className="bg-white border border-purple-100 rounded-2xl p-5 hover:shadow-md transition-all group">
            <Shield size={22} className="mb-3 text-purple-600 transition-transform group-hover:scale-110" />
            <p className="font-bold text-gray-900 text-sm mb-0.5">Admin Panel</p>
            <p className="text-xs text-gray-400">Manage store</p>
          </Link>
        ) : (
          <button onClick={() => { logout(); router.push('/') }}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all text-left group">
            <LogOut size={22} className="mb-3 text-gray-600 transition-transform group-hover:scale-110" />
            <p className="font-bold text-gray-900 text-sm mb-0.5">Logout</p>
            <p className="text-xs text-gray-400">Sign out</p>
          </button>
        )}
      </div>

      {/* Account Details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-gray-400" />
          <h2 className="font-bold text-gray-900 text-sm">Account Details</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
            <p className="font-semibold text-gray-900">{user.name}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Email Address</p>
            <p className="font-semibold text-gray-900">{user.email}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Account Type</p>
            <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">User ID</p>
            <p className="font-mono text-sm text-gray-700">{user.id}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => { logout(); router.push('/') }}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors font-medium">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
