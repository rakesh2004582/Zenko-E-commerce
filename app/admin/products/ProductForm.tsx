'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, uploadImage, absoluteUrl } from '@/lib/apiClient'
import type { BackendCategory, BackendProduct } from '@/lib/mappers'
import { Upload, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  productId?: number
  initial?: BackendProduct
}

const GENDERS = ['MEN', 'WOMEN', 'KIDS', 'UNISEX']

export default function ProductForm({ productId, initial }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    price: initial?.price?.toString() || '',
    discountPercent: initial?.discountPercent?.toString() || '0',
    categorySlug: initial?.categorySlug || '',
    gender: initial?.gender || 'WOMEN',
    color: initial?.color || '',
    material: initial?.material || '',
    brand: initial?.brand || '',
    thumbnail: initial?.thumbnail || '',
    images: (initial?.images || []).join(', '),
    features: (initial?.features || []).join(', '),
    sizes: (initial?.sizes || []).join(', '),
    tags: (initial?.tags || []).join(', '),
    isFeatured: initial?.isFeatured || false,
    isNewArrival: initial?.isNewArrival || false,
    isTrending: initial?.isTrending || false,
    sizeStock: '',
  })

  useEffect(() => {
    api.get<BackendCategory[]>('/api/admin/categories').then(setCategories).catch(() => {})
  }, [])

  const update = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage(file)
      update('thumbnail', url)
      toast.success('Thumbnail uploaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    }
    setUploading(false)
  }

  const handleGalleryUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage(file)
      const current = form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : []
      update('images', [...current, url].join(', '))
      toast.success('Image added')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    }
    setUploading(false)
  }

  const parseSizeStock = (): Record<string, number> | undefined => {
    if (!form.sizeStock.trim()) return undefined
    const result: Record<string, number> = {}
    form.sizeStock.split(',').forEach(pair => {
      const [size, qty] = pair.split(':').map(s => s.trim())
      if (size && qty && !isNaN(Number(qty))) result[size] = Number(qty)
    })
    return Object.keys(result).length ? result : undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.price || !form.categorySlug) {
      setError('Name, price and category are required')
      return
    }

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: Number(form.price),
      discountPercent: Number(form.discountPercent) || 0,
      categorySlug: form.categorySlug,
      gender: form.gender,
      color: form.color,
      material: form.material,
      brand: form.brand,
      thumbnail: form.thumbnail,
      images: form.images.split(',').map(s => s.trim()).filter(Boolean),
      features: form.features.split(',').map(s => s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      isTrending: form.isTrending,
      sizeStock: parseSizeStock(),
    }

    setSaving(true)
    try {
      if (productId) {
        await api.put(`/api/admin/products/${productId}`, payload)
        toast.success('Product updated')
      } else {
        await api.post('/api/admin/products', payload)
        toast.success('Product created')
      }
      router.push('/admin/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && <div className="px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name *</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug (auto if blank)</label>
            <input className="form-input" value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="floral-summer-dress" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
          <textarea className="form-input" rows={4} value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
            <select className="form-input" value={form.categorySlug} onChange={e => update('categorySlug', e.target.value)} required>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender *</label>
            <select className="form-input" value={form.gender} onChange={e => update('gender', e.target.value)}>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Brand</label>
            <input className="form-input" value={form.brand} onChange={e => update('brand', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price (₹) *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={e => update('price', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount %</label>
            <input type="number" min="0" max="100" className="form-input" value={form.discountPercent} onChange={e => update('discountPercent', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Variants & Attributes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label>
            <input className="form-input" value={form.color} onChange={e => update('color', e.target.value)} placeholder="Red" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Material</label>
            <input className="form-input" value={form.material} onChange={e => update('material', e.target.value)} placeholder="Cotton" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sizes (comma-separated)</label>
          <input className="form-input" value={form.sizes} onChange={e => update('sizes', e.target.value)} placeholder="S, M, L, XL" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Stock per size (format: SIZE:QTY, comma-separated)
          </label>
          <input className="form-input" value={form.sizeStock} onChange={e => update('sizeStock', e.target.value)} placeholder="S:10, M:20, L:15, XL:5" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Features (comma-separated)</label>
          <input className="form-input" value={form.features} onChange={e => update('features', e.target.value)} placeholder="Breathable fabric, Machine washable" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tags (comma-separated)</label>
          <input className="form-input" value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="summer, floral, casual" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Images</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thumbnail</label>
          <div className="flex items-center gap-3">
            {form.thumbnail && <img src={absoluteUrl(form.thumbnail)} className="w-14 h-16 object-cover rounded-lg border border-gray-100" />}
            <label className="btn-outline cursor-pointer text-xs">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gallery images (comma-separated URLs, or upload)</label>
          <textarea className="form-input" rows={2} value={form.images} onChange={e => update('images', e.target.value)} />
          <label className="btn-outline cursor-pointer text-xs mt-2 inline-flex">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Add image
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleGalleryUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Visibility</h2>
        <div className="flex flex-wrap gap-6">
          {(['isFeatured', 'isNewArrival', 'isTrending'] as const).map(key => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form[key]} onChange={e => update(key, e.target.checked)} />
              {key === 'isFeatured' ? 'Featured' : key === 'isNewArrival' ? 'New Arrival' : 'Trending'}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={15} className="animate-spin" /> : null} {productId ? 'Update Product' : 'Create Product'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')} className="btn-outline">
          <X size={15} /> Cancel
        </button>
      </div>
    </form>
  )
}
