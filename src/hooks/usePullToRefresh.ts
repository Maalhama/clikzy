'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Distance to trigger refresh (default: 80px)
  maxPull?: number // Maximum pull distance (default: 120px)
}

interface UsePullToRefreshReturn {
  pullDistance: number
  isRefreshing: boolean
  isPulling: boolean
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * Hook pour implémenter le Pull to Refresh sur mobile
 * Détecte la direction du swipe et ignore les mouvements horizontaux
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const startYRef = useRef(0)
  const startXRef = useRef(0)
  const currentYRef = useRef(0)
  const isAtTopRef = useRef(false)
  const directionLockedRef = useRef<'vertical' | 'horizontal' | null>(null)

  // Check if page is scrolled to top
  const checkIfAtTop = useCallback(() => {
    return window.scrollY <= 0
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return

    isAtTopRef.current = checkIfAtTop()
    if (!isAtTopRef.current) return

    startYRef.current = e.touches[0].clientY
    startXRef.current = e.touches[0].clientX
    currentYRef.current = startYRef.current
    directionLockedRef.current = null // Reset direction lock
    setIsPulling(true)
  }, [isRefreshing, checkIfAtTop])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || !isPulling) return
    if (!isAtTopRef.current) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    currentYRef.current = currentY

    const diffY = currentY - startYRef.current
    const diffX = currentX - startXRef.current

    // Determine direction on first significant movement (10px threshold)
    if (directionLockedRef.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe - don't interfere
        directionLockedRef.current = 'horizontal'
        setIsPulling(false)
        setPullDistance(0)
        return
      } else {
        // Vertical swipe - enable pull to refresh
        directionLockedRef.current = 'vertical'
      }
    }

    // If locked to horizontal, don't do anything
    if (directionLockedRef.current === 'horizontal') {
      return
    }

    // Only pull down, not up
    if (diffY > 0 && directionLockedRef.current === 'vertical') {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = 0.5
      const distance = Math.min(diffY * resistance, maxPull)
      setPullDistance(distance)

      // Prevent default scroll when pulling down
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }, [isRefreshing, isPulling, maxPull])

  const onTouchEnd = useCallback(async () => {
    if (isRefreshing || !isPulling) return

    setIsPulling(false)
    directionLockedRef.current = null

    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true)
      setPullDistance(threshold) // Hold at threshold during refresh

      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull to refresh error:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back
      setPullDistance(0)
    }
  }, [isRefreshing, isPulling, pullDistance, threshold, onRefresh])

  // Reset on unmount
  useEffect(() => {
    return () => {
      setPullDistance(0)
      setIsRefreshing(false)
      setIsPulling(false)
    }
  }, [])

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
