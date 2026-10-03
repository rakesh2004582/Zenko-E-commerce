'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/apiClient'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password. The link may have expired.')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Invalid Link
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-primary w-full justify-center py-3 text-sm inline-flex">
          Request New Link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Password Reset!
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Redirecting you to sign in...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Reset Password
        </h1>
        <p className="text-sm text-gray-400">Enter your new password below.</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <span className="text-base">⚠️</span> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPw ? 'text' : 'password'} required value={password}
            onChange={e => setPassword(e.target.value)}
            className="form-input pl-10 pr-10" placeholder="Min 6 characters" />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPw ? 'text' : 'password'} required value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="form-input pl-10" placeholder="Repeat password" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
        {loading
          ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</span>
          : <><span>Reset Password</span><ArrowRight size={14} /></>}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-8">
          <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
            Zenko
          </span>
        </Link>
        <Suspense fallback={<div className="text-sm text-gray-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
