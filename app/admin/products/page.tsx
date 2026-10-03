'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, absoluteUrl } from '@/lib/apiClient'
import type { PagedResponse, BackendProduct } from '@/lib/mappers'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [data, setData] = useState<PagedResponse<BackendProduct> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), size: '15' })
      if (search) qs.set('search', search)
      const result = await api.get<PagedResponse<BackendProduct>>(`/api/admin/products?${qs.toString()}`)
      setData(result)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load products')
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This deactivates it (past orders stay intact).`)) return
    setDeletingId(id)
    try {
      await api.delete(`/api/admin/products/${id}`)
      toast.success('Product deleted')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
    setDeletingId(null)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{data ? `${data.totalElements} total` : '...'}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary inline-flex justify-center">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search products..."
          className="form-input pl-10"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">Category</th>
                <th className="text-left px-5 py-3 font-semibold">Price</th>
                <th className="text-left px-5 py-3 font-semibold">Stock</th>
                <th className="text-left px-5 py-3 font-semibold">Rating</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}
              {!loading && data?.content.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No products found</td></tr>
              )}
              {!loading && data?.content.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={absoluteUrl(p.thumbnail) || '/placeholder.png'} alt={p.name}
                        className="w-10 h-12 object-cover rounded-lg bg-gray-100 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.categoryName}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-900">₹{p.finalPrice}</span>
                    {p.discountPercent > 0 && <span className="text-gray-400 line-through text-xs ml-1">₹{p.price}</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.availableStock ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {p.rating || 0} <span className="text-gray-400">({p.reviewCount})</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Page {data.page + 1} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={data.page === 0} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft size={15} /></button>
              <button disabled={data.last} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
