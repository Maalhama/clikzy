'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/analytics/webVitals'

/**
 * Client component to initialize Web Vitals tracking
 * Add this to your root layout
 */
export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals()
  }, [])

  return null
}
