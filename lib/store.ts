'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'
import { toast } from 'react-hot-toast'
import { absoluteUrl } from './apiClient'

// ─── Cart Store — Database-first ──────────
// Cart lives in the database (supports Guest ID and User ID).
interface CartStore {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (item: CartItem) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotal: () => number
  getSubtotal: () => number
  getCount: () => number
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  fetchCart: async () => {
    if (typeof window === 'undefined') return
    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      const items = await api.get<any[]>('/api/cart')
      set({ items: items.map(mapApiCartItemToCartItem), isLoading: false })
    } catch (err) {
      console.error('fetchCart error:', err)
      set({ isLoading: false })
    }
  },

  addItem: async (newItem) => {
    if (typeof window === 'undefined') return

    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      const items = await api.post<any[]>('/api/cart/items', {
        productId: newItem.productId,
        quantity: newItem.quantity,
        size: newItem.size,
        color: newItem.color
      })
      set({ items: items.map(mapApiCartItemToCartItem), isOpen: true, isLoading: false })
      toast.success('Added to cart')
    } catch (err: any) {
      console.error('addItem error:', err)
      toast.error(err.message || 'Failed to add item')
      set({ isLoading: false })
    }
  },

  removeItem: async (itemId) => {
    if (typeof window === 'undefined') return
    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      const items = await api.delete<any[]>(`/api/cart/items/${itemId}`)
      set({ items: items.map(mapApiCartItemToCartItem), isLoading: false })
    } catch (err: any) {
      console.error('removeItem error:', err)
      toast.error('Failed to remove item')
      set({ isLoading: false })
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (typeof window === 'undefined') return
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      const items = await api.put<any[]>(`/api/cart/items/${itemId}?quantity=${quantity}`)
      set({ items: items.map(mapApiCartItemToCartItem), isLoading: false })
    } catch (err: any) {
      console.error('updateQuantity error:', err)
      toast.error('Failed to update quantity')
      set({ isLoading: false })
    }
  },

  clearCart: () => set({ items: [] }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0)
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    return subtotal >= 999 ? subtotal : subtotal + 49
  },

  getCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0)
  },
}))

function mapApiCartItemToCartItem(apiItem: any): CartItem {
  return {
    cartItemId: String(apiItem.id),
    productId: apiItem.productId ? String(apiItem.productId) : '',
    name: apiItem.name,
    thumbnail: absoluteUrl(apiItem.thumbnail),
    price: apiItem.price,
    finalPrice: apiItem.finalPrice,
    discountPercent: apiItem.discountPercent,
    quantity: apiItem.quantity,
    size: apiItem.size,
    color: apiItem.color
  }
}

// ─── Buy Now Store ─────────────────────────────────────────────────────────
interface BuyNowStore {
  item: CartItem | null
  setItem: (item: CartItem) => void
  clear: () => void
}

export const useBuyNowStore = create<BuyNowStore>()(
  persist(
    (set) => ({
      item: null,
      setItem: (item) => set({ item }),
      clear: () => set({ item: null }),
    }),
    { name: 'zenko-buy-now' }
  )
)

// ─── Auth Store ─────────────────────────────────────────────────────────────
interface AuthStore {
  user: { id: string; name: string; email: string; role: string } | null
  token: string | null
  login: (user: AuthStore['user'], token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        set({ user, token })

        // Process pending actions after a short delay to ensure state persists
        setTimeout(async () => {
          const pendingCart = localStorage.getItem('pending_cart_action')
          if (pendingCart) {
            try {
              const item = JSON.parse(pendingCart)
              await useCartStore.getState().addItem(item)
            } catch (e) { }
            localStorage.removeItem('pending_cart_action')
          }

          const pendingWishlist = localStorage.getItem('pending_wishlist_action')
          if (pendingWishlist) {
            try {
              await useWishlistStore.getState().toggle(pendingWishlist)
            } catch (e) { }
            localStorage.removeItem('pending_wishlist_action')
          }

          useCartStore.getState().fetchCart()
          useWishlistStore.getState().fetchWishlist()
        }, 100)
      },
      logout: () => {
        set({ user: null, token: null })
        useCartStore.getState().clearCart()
        useWishlistStore.getState().clearWishlist()
      },
    }),
    { name: 'zenko-auth' }
  )
)

// ─── Wishlist Store ─────────────────────────────────────────────────────────
// Wishlist is fully database-backed (supports Guest ID and User ID).
interface WishlistStore {
  items: string[] // Array of productIds
  isLoading: boolean
  toggle: (productId: string) => Promise<void>
  has: (productId: string) => boolean
  fetchWishlist: () => Promise<void>
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    if (typeof window === 'undefined') return
    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      const products = await api.get<any[]>('/api/wishlist')
      set({ items: products.map(p => String(p.id)), isLoading: false })
    } catch (err) {
      console.error('fetchWishlist error:', err)
      set({ isLoading: false })
    }
  },

  toggle: async (id) => {
    if (typeof window === 'undefined') return

    const wasInWishlist = get().items.includes(id)
    set({ isLoading: true })
    try {
      const { api } = await import('./apiClient')
      let itemIds: number[]
      if (wasInWishlist) {
        itemIds = await api.delete<number[]>(`/api/wishlist/${id}`)
      } else {
        itemIds = await api.post<number[]>(`/api/wishlist/${id}`)
      }
      set({ items: itemIds.map(String), isLoading: false })
      if (!wasInWishlist) toast.success('Added to wishlist')
    } catch (err: any) {
      console.error('toggle wishlist error:', err)
      toast.error('Failed to update wishlist')
      set({ isLoading: false })
    }
  },

  has: (id) => get().items.includes(id),
  clearWishlist: () => set({ items: [] })
}))
