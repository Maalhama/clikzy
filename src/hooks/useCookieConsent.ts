'use client'

import { useState, useEffect, useCallback } from 'react'

const CONSENT_KEY = 'cookie-consent'

type ConsentStatus = 'pending' | 'accepted' | 'refused'

export function useCookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>('pending')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (consent === 'accepted') {
        setStatus('accepted')
      } else if (consent === 'refused') {
        setStatus('refused')
      } else {
        setStatus('pending')
      }
      setIsLoading(false)
    }
  }, [])

  // Listen for storage changes (in case consent is updated)
  useEffect(() => {
    function handleStorageChange() {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (consent === 'accepted') {
        setStatus('accepted')
      } else if (consent === 'refused') {
        setStatus('refused')
      } else {
        setStatus('pending')
      }
    }

    // Custom event for same-tab updates
    window.addEventListener('cookie-consent-change', handleStorageChange)
    // Storage event for cross-tab updates
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('cookie-consent-change', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const accept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setStatus('accepted')
    window.dispatchEvent(new Event('cookie-consent-change'))
  }, [])

  const refuse = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'refused')
    setStatus('refused')
    window.dispatchEvent(new Event('cookie-consent-change'))
  }, [])

  // Consent has been handled (either accepted or refused)
  const hasConsented = status === 'accepted' || status === 'refused'

  return {
    status,
    isLoading,
    hasConsented,
    accept,
    refuse,
  }
}
