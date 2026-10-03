'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/apiClient'
import { ArrowLeft, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function SellerApplyPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    businessName: '', gstNumber: '', phone: '', address: '', city: '', state: '', pincode: '',
  })

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/seller/register', form)
      toast.success('Application submitted! Our team will review it shortly.')
      router.push('/seller/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit application')
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(196,61,107,0.08)' }}>
          <Store size={18} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Become a Seller</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        List your own products on Zenko. Fill out your business details below — an admin will review
        and approve your application, after which you can start adding products.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Name</label>
          <input required value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
            className="form-input" placeholder="e.g. Meena Fashions" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST Number (optional)</label>
          <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
            className="form-input" placeholder="22AAAAA0000A1Z5" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
          <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="form-input" placeholder="10-digit mobile number" maxLength={10} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Address</label>
          <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="form-input" placeholder="Shop / warehouse address" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="form-input" placeholder="City" />
          <input required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
            className="form-input" placeholder="State" />
          <input required value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
            className="form-input" placeholder="Pincode" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
