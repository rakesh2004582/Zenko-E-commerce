'use client'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useCartStore, useWishlistStore, useAuthStore } from '@/lib/store'
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch initial state from backend DB for guest and logged-in users
    useCartStore.getState().fetchCart()
    useWishlistStore.getState().fetchWishlist()
  }, [])
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '10px',
            padding: '10px 16px',
          },
          success: {
            iconTheme: { primary: 'var(--color-primary)', secondary: '#fff' },
          },
        }}
      />
    </>
  )
}
