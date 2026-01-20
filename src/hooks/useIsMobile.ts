'use client'

import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check on mount
    setIsMobile(window.innerWidth < breakpoint)

    // Optional: listen for resize (disabled by default for performance)
    // const handleResize = () => setIsMobile(window.innerWidth < breakpoint)
    // window.addEventListener('resize', handleResize)
    // return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
