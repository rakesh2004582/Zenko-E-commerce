'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/apiClient'
import type { BackendProduct } from '@/lib/mappers'
import ProductForm from '../../ProductForm'

export default function EditProductPage() {
  const params = useParams()
  const id = Number(params.id)
  const [product, setProduct] = useState<BackendProduct | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<BackendProduct>(`/api/admin/products/${id}`)
      .then(setProduct)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load product'))
  }, [id])

  if (error) return <div className="px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm max-w-lg">{error}</div>
  if (!product) return <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Edit Product</h1>
      <p className="text-sm text-gray-500 mb-6">{product.name}</p>
      <ProductForm productId={id} initial={product} />
    </div>
  )
}
