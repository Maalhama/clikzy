'use client'

import Script from 'next/script'

/**
 * Umami Analytics - Privacy-friendly, GDPR compliant
 * Only loads in production when configured
 *
 * Setup:
 * 1. Deploy Umami on Vercel/Railway or use Umami Cloud
 * 2. Create a website in Umami dashboard
 * 3. Add NEXT_PUBLIC_UMAMI_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID to .env
 */
export function Analytics() {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const isProduction = process.env.NODE_ENV === 'production'

  // Only load in production with valid config
  if (!isProduction || !umamiUrl || !websiteId) {
    return null
  }

  return (
    <Script
      src={`${umamiUrl}/script.js`}
      data-website-id={websiteId}
      strategy="lazyOnload"
    />
  )
}
