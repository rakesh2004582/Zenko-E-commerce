'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, absoluteUrl, uploadImage } from '@/lib/apiClient'
import type { BackendCategory } from '@/lib/mappers'
import { Plus, Pencil, Trash2, X, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

const GENDERS = ['MEN', 'WOMEN', 'KIDS', 'UNISEX']

const emptyForm = { id: 0, name: '', slug: '', gender: 'WOMEN', parentSlug: '', image: '' }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api.get<BackendCategory[]>('/api/admin/categories')
      setCategories(list)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load categories')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(emptyForm); setShowForm(true) }
  const openEdit = (c: BackendCategory) => {
    setForm({ id: c.id, name: c.name, slug: c.slug, gender: c.gender, parentSlug: c.parentSlug || '', image: c.image || '' })
    setShowForm(true)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, image: url }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name, slug: form.slug || undefined, gender: form.gender, parentSlug: form.parentSlug || undefined, image: form.image }
    try {
      if (form.id) {
        await api.put(`/api/admin/categories/${form.id}`, payload)
        toast.success('Category updated')
      } else {
        await api.post('/api/admin/categories', payload)
        toast.success('Category created')
      }
      setShowForm(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (c: BackendCategory) => {
    if (!confirm(`Deactivate "${c.name}"? Products in it stay untouched.`)) return
    try {
      await api.delete(`/api/admin/categories/${c.id}`)
      toast.success('Category deactivated')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{form.id ? 'Edit Category' : 'New Category'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug (auto if blank)</label>
              <input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Parent category slug (optional)</label>
              <input className="form-input" value={form.parentSlug} onChange={e => setForm(f => ({ ...f, parentSlug: e.target.value }))} placeholder="e.g. women" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image</label>
              <div className="flex items-center gap-3">
                {form.image && <img src={absoluteUrl(form.image)} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />}
                <label className="btn-outline cursor-pointer text-xs">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} {form.id ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Category</th>
              <th className="text-left px-5 py-3 font-semibold">Slug</th>
              <th className="text-left px-5 py-3 font-semibold">Gender</th>
              <th className="text-left px-5 py-3 font-semibold">Products</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-right px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {!loading && categories.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No categories yet</td></tr>}
            {!loading && categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {c.image && <img src={absoluteUrl(c.image)} className="w-9 h-9 object-cover rounded-lg bg-gray-100" />}
                    <span className="font-semibold text-gray-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-gray-600">{c.gender}</td>
                <td className="px-5 py-3 text-gray-600">{c.productCount}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
