// ================================================================
// ZENKO — DATA LOADER
// Backed by the real Spring Boot + MySQL API instead of mock JSON.
// Function signatures match the old mock version so existing
// pages/components keep working without changes.
// ================================================================

import { api } from './apiClient'
import { mapProduct, mapCategory, mapReview, mapOrder } from './mappers'
import type { BackendProduct, BackendCategory, BackendReview, BackendOrder, PagedResponse } from './mappers'

// site/home config is still static presentational content, not domain data
import siteData from '@/data/zenko/site.json'
import homeData from '@/data/zenko/home.json'

import type {
  SiteConfig, HomeConfig, Product, Category,
  Order, InventoryItem, Review, Coupon
} from '@/types'

// ─── SITE / HOME CONFIG (static) ───────────────────────────────────────────

export async function getSiteConfig(_client = 'zenko'): Promise<SiteConfig> {
  return siteData as unknown as SiteConfig
}

export async function getHomeConfig(_client = 'zenko'): Promise<HomeConfig> {
  return homeData as unknown as HomeConfig
}

// ─── PRODUCTS ──────────────────────────────────────────────────────────────

const ALL_SIZE = 500 // effectively "get everything" in a single page fetch

export async function getAllProducts(_client = 'zenko'): Promise<Product[]> {
  try {
    const page = await api.get<PagedResponse<BackendProduct>>(`/api/products?size=${ALL_SIZE}`)
    return page?.content ? page.content.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getProductById(id: string, _client = 'zenko'): Promise<Product | null> {
  try {
    const p = await api.get<BackendProduct>(`/api/products/id/${id}`)
    return mapProduct(p)
  } catch {
    return null
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const p = await api.get<BackendProduct>(`/api/products/${slug}`)
    return mapProduct(p)
  } catch {
    return null
  }
}

export async function getProductsByGender(gender: string, _client = 'zenko'): Promise<Product[]> {
  try {
    const page = await api.get<PagedResponse<BackendProduct>>(`/api/products?gender=${gender}&size=${ALL_SIZE}`)
    return page?.content ? page.content.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getProductsByCategory(slug: string, _client = 'zenko'): Promise<Product[]> {
  try {
    const page = await api.get<PagedResponse<BackendProduct>>(`/api/products?category=${slug}&size=${ALL_SIZE}`)
    return page?.content ? page.content.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getFeaturedProducts(_client = 'zenko'): Promise<Product[]> {
  try {
    const list = await api.get<BackendProduct[]>('/api/products/featured')
    return Array.isArray(list) ? list.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getNewArrivals(_client = 'zenko'): Promise<Product[]> {
  try {
    const list = await api.get<BackendProduct[]>('/api/products/new-arrivals')
    return Array.isArray(list) ? list.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getTrendingProducts(_client = 'zenko'): Promise<Product[]> {
  try {
    const list = await api.get<BackendProduct[]>('/api/products/trending')
    return Array.isArray(list) ? list.map(mapProduct) : []
  } catch {
    return []
  }
}

export async function getProductsByIds(ids: string[], _client = 'zenko'): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter(p => ids.includes(p.id))
}

/** Logged-in users: fetch the server-synced wishlist directly (already merged on login).
 *  Guests: fall back to resolving locally-stored ids against the product catalog. */
export async function getMyWishlistProducts(localIds: string[]): Promise<Product[]> {
  try {
    const list = await api.get<BackendProduct[]>('/api/wishlist')
    if (Array.isArray(list)) return list.map(mapProduct)
  } catch {
    /* not logged in / request failed - fall back to local ids below */
  }
  if (!localIds.length) return []
  return getProductsByIds(localIds)
}

export async function searchProducts(query: string, _client = 'zenko'): Promise<Product[]> {
  try {
    const page = await api.get<PagedResponse<BackendProduct>>(`/api/products?search=${encodeURIComponent(query)}&size=${ALL_SIZE}`)
    return page?.content ? page.content.map(mapProduct) : []
  } catch {
    return []
  }
}

/** Full-featured storefront browse — pagination + sort + filter + search, all server-side */
export async function browseProducts(params: {
  search?: string; category?: string; gender?: string
  minPrice?: number; maxPrice?: number; rating?: number
  sizes?: string[]; colors?: string[]; brand?: string
  sortBy?: string; page?: number; size?: number
}): Promise<{ products: Product[]; totalElements: number; totalPages: number; page: number }> {
  try {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    if (params.gender) qs.set('gender', params.gender)
    if (params.minPrice != null) qs.set('minPrice', String(params.minPrice))
    if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice))
    if (params.rating != null) qs.set('rating', String(params.rating))
    if (params.sizes?.length) params.sizes.forEach(s => qs.append('sizes', s))
    if (params.colors?.length) params.colors.forEach(c => qs.append('colors', c))
    if (params.brand) qs.set('brand', params.brand)
    if (params.sortBy) qs.set('sortBy', params.sortBy)
    qs.set('page', String(params.page ?? 0))
    qs.set('size', String(params.size ?? 12))

    const result = await api.get<PagedResponse<BackendProduct>>(`/api/products?${qs.toString()}`)
    return {
      products: result?.content ? result.content.map(mapProduct) : [],
      totalElements: result?.totalElements ?? 0,
      totalPages: result?.totalPages ?? 0,
      page: result?.page ?? 0,
    }
  } catch {
    return { products: [], totalElements: 0, totalPages: 0, page: 0 }
  }
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────

export async function getAllCategories(_client = 'zenko'): Promise<Category[]> {
  try {
    const list = await api.get<BackendCategory[]>('/api/categories')
    return Array.isArray(list) ? list.map(mapCategory) : []
  } catch {
    return []
  }
}

export async function getCategoryBySlug(slug: string, _client = 'zenko'): Promise<Category | null> {
  try {
    const c = await api.get<BackendCategory>(`/api/categories/${slug}`)
    return mapCategory(c)
  } catch {
    return null
  }
}

// ─── ORDERS ────────────────────────────────────────────────────────────────
// Note: the backend scopes orders to the authenticated JWT user (or admin).
// There's no arbitrary "fetch any user's orders" endpoint for security reasons.

export async function getAllOrders(_client = 'zenko'): Promise<Order[]> {
  const result = await api.get<PagedResponse<BackendOrder>>('/api/admin/orders?size=200')
  return result.content.map(mapOrder)
}

export async function getOrderById(id: string, _client = 'zenko'): Promise<Order | null> {
  try {
    const o = await api.get<BackendOrder>(`/api/orders/${id}`)
    return mapOrder(o)
  } catch {
    return null
  }
}

/** Returns the *currently logged-in* user's orders (userId kept for signature compatibility) */
export async function getOrdersByUser(_userId: string, _client = 'zenko'): Promise<Order[]> {
  const result = await api.get<PagedResponse<BackendOrder>>('/api/orders?size=100')
  return result.content.map(mapOrder)
}

export async function getMyOrders(page = 0, size = 10): Promise<{ orders: Order[]; totalPages: number }> {
  const result = await api.get<PagedResponse<BackendOrder>>(`/api/orders?page=${page}&size=${size}`)
  return { orders: result.content.map(mapOrder), totalPages: result.totalPages }
}

// ─── INVENTORY ─────────────────────────────────────────────────────────────
// Per-size stock now travels inline on the product response (stockBySize),
// so these helpers just derive from a product fetch.

export async function getAllInventory(_client = 'zenko'): Promise<InventoryItem[]> {
  return []
}

export async function getInventoryByProduct(productId: string, _client = 'zenko'): Promise<InventoryItem | null> {
  try {
    const p = await api.get<BackendProduct & { stockBySize?: Record<string, number> }>(`/api/products/id/${productId}`)
    const sizes = p.stockBySize || {}
    const totalStock = Object.values(sizes).reduce((a, b) => a + b, 0)
    return {
      productId: String(p.id),
      sizes,
      totalStock,
      reserved: 0,
      available: p.availableStock ?? totalStock,
      lastUpdated: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function isInStock(productId: string, size: string, _client = 'zenko'): Promise<boolean> {
  const inv = await getInventoryByProduct(productId)
  if (!inv) return true // untracked products are treated as always available
  return (inv.sizes[size] ?? 0) > 0
}

// ─── REVIEWS ───────────────────────────────────────────────────────────────

export async function getReviewsByProduct(productId: string, page = 0, size = 20): Promise<Review[]> {
  const result = await api.get<PagedResponse<BackendReview>>(`/api/reviews/product/${productId}?page=${page}&size=${size}`)
  return result.content.map(mapReview)
}

export async function getAverageRating(productId: string, _client = 'zenko'): Promise<number> {
  const p = await getProductById(productId)
  return p?.rating ?? 0
}

export async function submitReview(payload: {
  productId: string; rating: number; title?: string; body?: string; images?: string[]
}): Promise<Review> {
  const r = await api.post<BackendReview>('/api/reviews', {
    productId: Number(payload.productId),
    rating: payload.rating,
    title: payload.title,
    body: payload.body,
    images: payload.images,
  })
  return mapReview(r)
}

// ─── COUPONS ───────────────────────────────────────────────────────────────

export async function validateCoupon(
  code: string,
  orderTotal: number,
  _client = 'zenko'
): Promise<{ valid: boolean; coupon?: Coupon; discount?: number; message?: string }> {
  try {
    const result = await api.get<{ valid: boolean; code?: string; discount?: number; message?: string }>(
      `/api/coupons/validate?code=${encodeURIComponent(code)}&total=${orderTotal}`
    )
    return { valid: result.valid, discount: result.discount, message: result.message }
  } catch (e) {
    return { valid: false, message: e instanceof Error ? e.message : 'Error applying coupon' }
  }
}
