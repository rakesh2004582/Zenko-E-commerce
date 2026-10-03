const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('zenko-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}



export function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  let guestId = localStorage.getItem('zenko_guest_id')
  if (!guestId || guestId.length > 36) {
    guestId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'g_' + Math.random().toString(36).substring(2) + Date.now().toString(36)).substring(0, 36)
    localStorage.setItem('zenko_guest_id', guestId)
  }
  return guestId
}

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const guestId = getGuestId()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(guestId ? { 'X-Guest-Id': guestId } : {}),
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zenko_token')
      localStorage.removeItem('zenko-auth')
    }
    throw new Error('Session expired. Please log in again.')
  }

  const json: ApiEnvelope<T> = await res.json().catch(() => ({
    success: false,
    message: res.status >= 500 ? 'Server error. Please try again later.' : 'Invalid server response',
    data: null as unknown as T
  }))

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed (${res.status})`)
  }
  return json.data
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export async function uploadImage(file: File): Promise<string> {
  const token = getToken()
  const guestId = getGuestId()
  const formData = new FormData()
  formData.append('file', file)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (guestId) headers['X-Guest-Id'] = guestId

  const res = await fetch(`${API_BASE}/api/admin/upload/image`, {
    method: 'POST',
    headers,
    body: formData,
  })
  const json: ApiEnvelope<string> = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed')
  return json.data
}

export function absoluteUrl(path?: string | null): string {
  if (!path) return ''
  // Normalize legacy localhost or hardcoded frontend image URLs
  if (path.startsWith('http://localhost') || path.startsWith('http://127.0.0.1')) {
    const relativePath = path.substring(path.indexOf('/', 8))
    if (relativePath.startsWith('/images/products/fashion/')) {
      const filename = relativePath.substring(relativePath.lastIndexOf('/') + 1)
      return `${API_BASE}/uploads/products/${filename}`
    }
    return `${API_BASE}${relativePath}`
  }
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/images/products/fashion/')) {
    const filename = path.substring(path.lastIndexOf('/') + 1)
    return `${API_BASE}/uploads/products/${filename}`
  }
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export { API_BASE }
