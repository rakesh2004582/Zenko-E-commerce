'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore, useWishlistStore, useCartStore } from '@/lib/store'
import { getMyWishlistProducts } from '@/lib/dataLoader'
import type { Product } from '@/types'
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { items: wishlistIds, toggle } = useWishlistStore()
  const { addItem, openCart } = useCartStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getMyWishlistProducts(wishlistIds)
      setProducts(list)
    } catch {
      setProducts([])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds.join(',')])

  useEffect(() => {
    if (!mounted) return
    load()
  }, [mounted, load])

  const handleRemove = (id: string) => {
    toggle(id)
    setProducts(p => p.filter(x => x.id !== id))
    toast('Removed from wishlist', { icon: '💔', duration: 1200, position: 'bottom-center' })
  }

  const handleMoveToCart = (p: Product) => {
    addItem({
      productId: p.id, name: p.name, thumbnail: p.thumbnail,
      price: p.price, finalPrice: p.finalPrice, discountPercent: p.discountPercent,
      size: p.sizes?.[0] || 'One Size', color: p.color, quantity: 1,
    })
    toggle(p.id)
    setProducts(list => list.filter(x => x.id !== p.id))
    toast.success('Moved to cart!', { duration: 1500, position: 'bottom-center' })
    openCart()
  }

  if (!mounted) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
          My Wishlist
        </h1>
        {!loading && <span className="text-xs text-gray-400">{products.length} item{products.length !== 1 ? 's' : ''}</span>}
      </div>

      {!user && (
        <div className="mb-6 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span>You&apos;re browsing as a guest — your wishlist is saved dynamically on our backend server for this device. Log in to sync it seamlessly across all your devices.</span>
          <button onClick={() => router.push('/login?redirect=/dashboard/wishlist')} className="font-semibold underline whitespace-nowrap">
            Log in
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Heart size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link href="/" className="btn-primary inline-flex">Start Shopping</Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group">
              <Link href={`/product/${p.gender}/${p.id}`} className="block relative aspect-[3/4] bg-gray-50">
                <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                {p.discountPercent > 0 && (
                  <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {p.discountPercent}% OFF
                  </span>
                )}
              </Link>
              <div className="p-3">
                <Link href={`/product/${p.gender}/${p.id}`}>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-2 hover:text-gray-600">{p.name}</p>
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{p.finalPrice}</span>
                  {p.discountPercent > 0 && <span className="text-[10px] text-gray-400 line-through">₹{p.price}</span>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleMoveToCart(p)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                  <button onClick={() => handleRemove(p.id)}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-500 hover:border-red-200">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
