'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/hooks/useCookieConsent'

/**
 * Umami Analytics — privacy-friendly. Ne charge le script QUE :
 *  - en production,
 *  - si configuré (URL + website id),
 *  - ET après consentement explicite (CNIL : pas de traçage avant le « Accepter »).
 * `trackEvent` (lib/analytics) ne fait rien tant que `window.umami` n'existe pas,
 * donc gater le script ici suffit à respecter le refus.
 */
export function Analytics() {
  const { status } = useCookieConsent()
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isProduction || !umamiUrl || !websiteId || status !== 'accepted') {
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
