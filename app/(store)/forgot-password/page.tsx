'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/apiClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block mb-8">
          <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
            Zenko
          </span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Check your email
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we&apos;ve sent a
              password reset link to it. The link is valid for 30 minutes.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center py-3 text-sm inline-flex">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Forgot Password?
              </h1>
              <p className="text-sm text-gray-400">
                No worries — enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending link...</span>
                : <><span>Send Reset Link</span><ArrowRight size={14} /></>}
            </button>

            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 font-medium hover:text-gray-700">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
