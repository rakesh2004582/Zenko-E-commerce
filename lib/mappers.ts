import type { Product, Category, Review, Order } from '@/types'
import { absoluteUrl } from './apiClient'

// ─── Backend DTO shapes (subset of fields we consume) ──────────────────────
export interface BackendProduct {
  id: number
  name: string
  slug: string
  description: string
  price: number
  discountPercent: number
  finalPrice: number
  categoryName: string
  categorySlug: string
  gender: string
  color: string
  material: string
  brand: string
  thumbnail: string
  features: string[]
  sizes: string[]
  images: string[]
  tags: string[]
  rating: number
  reviewCount: number
  isFeatured: boolean
  isNewArrival: boolean
  isTrending: boolean
  active: boolean
  availableStock: number | null
  createdAt: string
}

export interface BackendCategory {
  id: number
  slug: string
  name: string
  gender: string
  parentSlug: string | null
  image: string
  productCount: number
  active: boolean
}

export interface BackendReview {
  id: number
  productId: number
  userId: number
  userName: string
  rating: number
  title: string
  body: string
  images: string[]
  helpful: number
  verified: boolean
  createdAt: string
}

export interface BackendOrderItem {
  productId: number
  productName: string
  thumbnail: string
  finalPrice: number
  quantity: number
  size: string
  color: string
}

export interface BackendShippingAddress {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface BackendOrder {
  id: number
  orderNumber: string
  items: BackendOrderItem[]
  shippingAddress: BackendShippingAddress
  couponApplied: string | null
  paymentMethod: string
  paymentStatus: string
  status: string
  subtotal: number
  discount: number
  deliveryCharge: number
  total: number
  statusHistory: { status: string; timestamp: string; note: string }[]
  createdAt: string
  updatedAt: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ─── Mappers ─────────────────────────────────────────────────────────────

export function mapProduct(p: BackendProduct): Product {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    price: p.price,
    discountPercent: p.discountPercent || 0,
    finalPrice: p.finalPrice ?? p.price,
    category: p.categorySlug,
    gender: (p.gender || 'unisex').toLowerCase() as Product['gender'],
    color: p.color || '',
    material: p.material || '',
    features: p.features || [],
    sizes: p.sizes || [],
    images: (p.images && p.images.length ? p.images : [p.thumbnail]).map(absoluteUrl),
    thumbnail: absoluteUrl(p.thumbnail),
    tags: p.tags || [],
    brand: p.brand || '',
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isTrending: p.isTrending,
    createdAt: p.createdAt,
  }
}

export function mapCategory(c: BackendCategory): Category {
  return {
    id: String(c.id),
    slug: c.slug,
    name: c.name,
    gender: (c.gender || '').toLowerCase(),
    parentSlug: c.parentSlug || '',
    image: absoluteUrl(c.image),
    productCount: c.productCount,
  }
}

export function mapReview(r: BackendReview): Review {
  return {
    id: String(r.id),
    productId: String(r.productId),
    userId: String(r.userId),
    userName: r.userName,
    rating: r.rating,
    title: r.title || '',
    body: r.body || '',
    images: (r.images || []).map(absoluteUrl),
    helpful: r.helpful,
    verified: r.verified,
    createdAt: r.createdAt,
  }
}

function toTitleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

/** Jackson may send LocalDateTime as ISO string or as [year,month,day,h,m,s,nano] array */
function safeDate(raw: string | number[]): string {
  if (!raw) return new Date().toISOString()
  if (Array.isArray(raw)) {
    // [2026, 8, 12, 9, 30, 0, 0] -> Date
    const [y, mo, d, h = 0, mi = 0, s = 0] = raw as number[]
    return new Date(y, mo - 1, d, h, mi, s).toISOString()
  }
  return String(raw)
}

export function mapOrder(o: BackendOrder): Order {
  return {
    id: String(o.id),
    userId: '',
    items: o.items.map(i => ({
      productId: String(i.productId),
      name: i.productName,
      thumbnail: absoluteUrl(i.thumbnail),
      price: i.finalPrice,
      discountPercent: 0,
      finalPrice: i.finalPrice,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
    address: {
      fullName: o.shippingAddress?.fullName || '',
      phone: o.shippingAddress?.phone || '',
      line1: o.shippingAddress?.line1 || '',
      line2: o.shippingAddress?.line2 || '',
      city: o.shippingAddress?.city || '',
      state: o.shippingAddress?.state || '',
      pincode: o.shippingAddress?.pincode || '',
      country: o.shippingAddress?.country || 'India',
    },
    couponApplied: o.couponApplied,
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryCharge: o.deliveryCharge,
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: toTitleCase(o.paymentStatus) as Order['paymentStatus'],
    status: toTitleCase(o.status) as Order['status'],
    statusHistory: (o.statusHistory || []).map(h => ({
      status: toTitleCase(h.status),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timestamp: safeDate(h.timestamp as any),
      note: h.note || '',
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: safeDate(o.createdAt as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: safeDate(o.updatedAt as any),
  }
}

