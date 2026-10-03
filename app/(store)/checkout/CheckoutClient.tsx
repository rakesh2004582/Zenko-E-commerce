'use client'
import { useState, useMemo } from 'react'
import { useCartStore, useAuthStore, useBuyNowStore } from '@/lib/store'
import { api, absoluteUrl } from '@/lib/apiClient'
import { validateCoupon } from '@/lib/dataLoader'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Tag, AlertCircle, Lock, ArrowLeft, Truck, ChevronDown, ChevronUp, Zap, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface PlacedOrder { id: number; orderNumber: string }
interface AuthResponse { token: string; userId: number; name: string; email: string; role: string }

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry']

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const isBuyNow = searchParams.get('buyNow') === '1'

  const cartStore = useCartStore()
  const { item: buyNowItem, clear: clearBuyNow } = useBuyNowStore()
  const { user, login: authLogin, logout: authLogout } = useAuthStore()
  const router = useRouter()

  // Meesho-style Buy Now checks out a single item independently of the cart.
  const items = useMemo(
    () => (isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cartStore.items),
    [isBuyNow, buyNowItem, cartStore.items]
  )
  const getSubtotal = () =>
    items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0)

  const [form, setForm] = useState({
    fullName: user?.name || '', phone: '', email: user?.email || '',
    line1: '', line2: '', city: '', state: '', pincode: '',
    paymentMethod: 'COD',
  })
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount: number; message: string } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false)

  const subtotal = getSubtotal()
  const delivery = subtotal >= 999 ? 0 : 49
  const discount = couponResult?.valid ? couponResult.discount : 0
  const total = subtotal + delivery - discount
  const savings = items.reduce((s, i) => s + (i.price - i.finalPrice) * i.quantity, 0) + discount

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const data = await validateCoupon(couponCode.trim(), subtotal)
      setCouponResult({ valid: data.valid, discount: data.discount ?? 0, message: data.message || (data.valid ? 'Coupon applied!' : 'Invalid coupon') })
    } catch {
      setCouponResult({ valid: false, discount: 0, message: 'Error applying coupon' })
    }
    setCouponLoading(false)
  }

  const handleInlineAuth = async (): Promise<boolean> => {
    if (user) return true
    setAuthLoading(true)
    try {
      if (authTab === 'register') {
        if (!form.fullName.trim()) throw new Error('Please enter your Full Name')
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) throw new Error('Please enter a valid 10-digit Phone number')
        const emailToUse = form.email.trim() || `${form.phone}@zenko.com`
        if (!password || password.length < 6) throw new Error('Please set a Password (at least 6 characters)')

        const res = await api.post<AuthResponse>('/api/auth/register', {
          name: form.fullName.trim(),
          email: emailToUse,
          phone: form.phone.trim(),
          password: password,
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('zenko_token', res.token)
        }
        authLogin({ id: String(res.userId), name: res.name, email: res.email, role: res.role }, res.token)
        setForm(f => ({ ...f, fullName: res.name, email: res.email }))
        await cartStore.fetchCart()
        toast.success(`Account created! Welcome, ${res.name}`, { position: 'top-center' })
        setAuthLoading(false)
        return true
      } else {
        if (!form.email.trim()) throw new Error('Please enter your registered Email')
        if (!password) throw new Error('Please enter your Password')

        const res = await api.post<AuthResponse>('/api/auth/login', {
          email: form.email.trim(),
          password: password,
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('zenko_token', res.token)
        }
        authLogin({ id: String(res.userId), name: res.name, email: res.email, role: res.role }, res.token)
        setForm(f => ({ ...f, fullName: res.name, email: res.email }))
        await cartStore.fetchCart()
        toast.success(`Welcome back, ${res.name}`, { position: 'top-center' })
        setAuthLoading(false)
        return true
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      toast.error(msg, { position: 'top-center' })
      setAuthLoading(false)
      return false
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Valid 10-digit number required'
    if (!form.line1.trim()) e.line1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state) e.state = 'Please select state'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required'
    setErrors(e)

    const fieldOrder = ['fullName', 'phone', 'line1', 'city', 'pincode', 'state']
    const firstErrorField = fieldOrder.find(f => e[f])
    if (firstErrorField) {
      toast.error('Please fill in all required fields (' + e[firstErrorField] + ')', { position: 'top-center' })
      document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      document.getElementById(`field-${firstErrorField}`)?.focus()
    }
    return Object.keys(e).length === 0
  }

  const placeOrder = async () => {
    if (!validate() || items.length === 0) return
    setLoading(true)
    try {
      if (!user) {
        const authOk = await handleInlineAuth()
        if (!authOk) {
          setLoading(false)
          return
        }
      }

      const order = await api.post<PlacedOrder>('/api/orders', {
        items: items.map(i => ({
          productId: Number(i.productId),
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email.trim() || `${form.phone}@zenko.com`,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: 'India',
        },
        couponCode: couponResult?.valid ? couponCode.trim() : undefined,
      })
      if (isBuyNow) clearBuyNow()
      else cartStore.clearCart()
      router.push(`/order-confirmation?id=${order.orderNumber}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order'
      setErrors({ submit: msg })
      toast.error(msg, { position: 'top-center' })
    }
    setLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          {isBuyNow ? 'No item selected' : 'Your cart is empty'}
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          {isBuyNow ? 'Go back to the product page and tap "Buy Now" again' : 'Add some items before checking out'}
        </p>
        <Link href="/" className="btn-primary">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors">
              <ArrowLeft size={14} /> Back to Shopping
            </Link>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Checkout
              {isBuyNow && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <Zap size={10} fill="white" /> Buy Now
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <Lock size={12} className="text-green-500" />
            <span className="text-green-700 font-medium">Secure Checkout</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Forms */}
          <div className="lg:col-span-3 space-y-5">

            {/* Step 1: Contact / Account */}
            {user ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center bg-green-500">
                      <UserCheck size={14} />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Account Details</h2>
                      <p className="text-xs text-gray-500">Logged in as <strong className="text-gray-900">{user.name}</strong> ({user.email})</p>
                    </div>
                  </div>
                  <button onClick={authLogout} className="text-xs font-semibold text-rose-600 hover:underline">
                    Log Out / Switch
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                    <input className={`form-input ${errors.fullName ? 'border-red-400' : ''}`}
                      id="field-fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Your full name" />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone *</label>
                    <input className={`form-input ${errors.phone ? 'border-red-400' : ''}`}
                      id="field-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="10-digit mobile" maxLength={10} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)' }}>1</div>
                  <div>
                    <h2 className="font-bold text-gray-900">Account &amp; Contact Details</h2>
                    <p className="text-xs text-gray-500">Create an account or log in to place your order</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    Create New Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    Log In Existing Account
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {authTab === 'register' && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                      <input className={`form-input ${errors.fullName ? 'border-red-400' : ''}`}
                        id="field-fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                        placeholder="Your full name" />
                      {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                    </div>
                  )}

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number *</label>
                    <input className={`form-input ${errors.phone ? 'border-red-400' : ''}`}
                      id="field-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="10-digit mobile" maxLength={10} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address *</label>
                    <input type="email" className="form-input" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com" />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      {authTab === 'register' ? 'Set Password *' : 'Password *'}
                    </label>
                    <input type="password" className="form-input" value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleInlineAuth}
                    disabled={authLoading}
                    className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow transition-all hover:opacity-90 flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {authLoading ? 'Processing...' : (authTab === 'register' ? 'Create Account & Continue' : 'Log In & Continue')}
                  </button>
                  <span className="text-[11px] text-gray-400">
                    {authTab === 'register' ? 'Existing user? Tap "Log In Existing Account"' : 'New user? Tap "Create New Account"'}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)' }}>2</div>
                <h2 className="font-bold text-gray-900">Delivery Address</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Address Line 1 *</label>
                  <input className={`form-input ${errors.line1 ? 'border-red-400' : ''}`}
                    id="field-line1" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))}
                    placeholder="House/Flat No., Building, Street" />
                  {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Address Line 2 (Optional)</label>
                  <input className="form-input" value={form.line2}
                    onChange={e => setForm(f => ({ ...f, line2: e.target.value }))}
                    placeholder="Area, Colony, Landmark" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">City *</label>
                  <input className={`form-input ${errors.city ? 'border-red-400' : ''}`}
                    id="field-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City" />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pincode *</label>
                  <input className={`form-input ${errors.pincode ? 'border-red-400' : ''}`}
                    id="field-pincode" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                    placeholder="6-digit pincode" maxLength={6} />
                  {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">State *</label>
                  <select className={`form-input ${errors.state ? 'border-red-400' : ''}`}
                    id="field-state" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <Truck size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-blue-700">
                  Estimated delivery: <strong>3–7 business days</strong>.{' '}
                  {subtotal >= 999 ? '🎉 You qualify for free shipping!' : `Add ₹${999 - subtotal} more for free shipping.`}
                </span>
              </div>
            </div>

            {/* Step 3: Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)' }}>3</div>
                <h2 className="font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === 'COD' ? 'border-pink-500 bg-pink-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="COD" checked={form.paymentMethod === 'COD'}
                      onChange={() => setForm(f => ({ ...f, paymentMethod: 'COD' }))}
                      className="text-pink-600 focus:ring-pink-500" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-400">Pay when your order arrives at your doorstep</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Available</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                {/* Mobile accordion toggle */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 lg:hidden cursor-pointer"
                  onClick={() => setOrderSummaryOpen(o => !o)}>
                  <h3 className="font-bold text-gray-900 text-sm">Order Summary</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>₹{total}</span>
                    {orderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Header (Desktop) */}
                <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Order Summary</h3>
                  <span className="text-xs text-gray-400">{items.length} item{items.length > 1 ? 's' : ''}</span>
                </div>

                <div className={`${orderSummaryOpen ? 'block' : 'hidden'} lg:block`}>
                  {/* Items List */}
                  <div className="px-5 py-3 max-h-56 overflow-y-auto border-b border-gray-50 space-y-3">
                    {items.map(item => (
                      <div key={`${item.productId}-${item.size}`} className="flex gap-3 items-center">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                          <img src={absoluteUrl(item.thumbnail)} alt={item.name} className="w-full h-full object-cover" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-primary)' }}>{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Size: {item.size}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-800 flex-shrink-0">₹{item.finalPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                          placeholder="COUPON CODE"
                          className="form-input pl-8 text-xs uppercase font-mono tracking-widest" />
                      </div>
                      <button onClick={applyCoupon} disabled={couponLoading}
                        className="px-3 py-2 text-xs font-bold rounded-lg border-2 flex-shrink-0 transition-all"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponResult && (
                      <div className={`flex items-center gap-1.5 mt-2 text-xs px-3 py-2 rounded-lg ${couponResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {couponResult.valid ? <Check size={11} /> : <AlertCircle size={11} />}
                        {couponResult.valid ? `You save ₹${couponResult.discount}!` : couponResult.message}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">Try: WELCOME10 · FLAT200 · SUMMER25 · FREESHIP</p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="px-5 py-4 space-y-2 border-b border-gray-50">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">MRP Total</span><span>₹{items.reduce((s,i) => s + i.price * i.quantity, 0)}</span></div>
                    <div className="flex justify-between text-sm text-green-600"><span>Product Discount</span><span>−₹{items.reduce((s,i) => s + (i.price - i.finalPrice) * i.quantity, 0)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Coupon Discount</span><span>−₹{discount}</span></div>}
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span>
                      <span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>{delivery === 0 ? 'FREE 🎉' : `₹${delivery}`}</span>
                    </div>
                    <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)' }}>₹{total}</span>
                    </div>
                    {savings > 0 && (
                      <p className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg text-center">
                        🎉 You are saving ₹{savings} on this order!
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="px-5 py-5">
                    {errors.submit && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">
                        <AlertCircle size={11} /> {errors.submit}
                      </div>
                    )}
                    <button onClick={placeOrder} disabled={loading}
                      className="btn-primary w-full justify-center py-4 text-base font-black rounded-xl shadow-lg">
                      {loading
                        ? <span className="flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Placing Order...
                          </span>
                        : <><Lock size={16} /> Place Order · ₹{total}</>
                      }
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                      <Lock size={9} /> 256-bit SSL encrypted &amp; secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
