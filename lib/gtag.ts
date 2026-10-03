export const GA_ID = process.env.NEXT_PUBLIC_GA_ID

declare global {
    interface Window {
        gtag: (...args: any[]) => void
        dataLayer: any[]
    }
}

export const pageview = (url: string) => {
    if (!GA_ID || typeof window.gtag !== 'function') return
    window.gtag('config', GA_ID, { page_path: url })
}

type GAEvent = {
    action: string
    category?: string
    label?: string
    value?: number
    [key: string]: any
}

export const event = ({ action, ...params }: GAEvent) => {
    if (!GA_ID || typeof window.gtag !== 'function') return
    window.gtag('event', action, params)
}