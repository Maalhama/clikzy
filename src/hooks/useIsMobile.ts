'use client'

import { useState, useEffect } from 'react'

// Direct check for immediate use (no hydration issues in effects/callbacks)
export function checkIsMobile(breakpoint: number = 768): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < breakpoint
}

export function useIsMobile(breakpoint: number = 768): boolean {
  // Initialize with actual value to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    // Re-check on mount in case SSR value differs
    setIsMobile(window.innerWidth < breakpoint)
  }, [breakpoint])

  return isMobile
}
