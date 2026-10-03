'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/apiClient'
import { Plus, X, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BackendCoupon {
  id: number
  code: string
  description: string
  type: string
  value: number
  minOrderValue: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
}

const emptyForm = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderValue: '', maxDiscount: '', usageLimit: '', expiresAt: '' }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<BackendCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCoupons(await api.get<BackendCoupon[]>('/api/admin/coupons'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load coupons')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/coupons', {
        code: form.code.toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      })
      toast.success('Coupon created')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create coupon')
    }
    setSaving(false)
  }

  const handleDelete = async (c: BackendCoupon) => {
    if (!confirm(`Deactivate coupon "${c.code}"?`)) return
    try {
      await api.delete(`/api/admin/coupons/${c.id}`)
      toast.success('Coupon deactivated')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">{coupons.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add Coupon</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">New Coupon</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code *</label>
              <input className="form-input uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Value *</label>
                <input type="number" className="form-input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Order Value</label>
                <input type="number" className="form-input" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Discount</label>
                <input type="number" className="form-input" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Usage Limit</label>
                <input type="number" className="form-input" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expires At</label>
                <input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} Create Coupon
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Code</th>
              <th className="text-left px-5 py-3 font-semibold">Type</th>
              <th className="text-left px-5 py-3 font-semibold">Value</th>
              <th className="text-left px-5 py-3 font-semibold">Used</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-right px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {!loading && coupons.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No coupons yet</td></tr>}
            {!loading && coupons.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                <td className="px-5 py-3 text-gray-600">{c.type}</td>
                <td className="px-5 py-3 text-gray-600">{c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-5 py-3 text-gray-600">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
