'use client'

import { useEffect, Suspense } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { GA_ID, pageview } from '@/lib/gtag'

function GAPageViewTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!GA_ID) return
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
        pageview(url)
    }, [pathname, searchParams])

    return null
}

export default function GoogleAnalytics() {
    if (!GA_ID) return null

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script id="ga-init" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
            </Script>
            <Suspense fallback={null}>
                <GAPageViewTracker />
            </Suspense>
        </>
    )
}