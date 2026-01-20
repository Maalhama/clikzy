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
  const currentYRef = useRef(0)
  const isAtTopRef = useRef(false)

  // Check if page is scrolled to top
  const checkIfAtTop = useCallback(() => {
    return window.scrollY <= 0
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return

    isAtTopRef.current = checkIfAtTop()
    if (!isAtTopRef.current) return

    startYRef.current = e.touches[0].clientY
    currentYRef.current = startYRef.current
    setIsPulling(true)
  }, [isRefreshing, checkIfAtTop])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || !isPulling) return
    if (!isAtTopRef.current) return

    currentYRef.current = e.touches[0].clientY
    const diff = currentYRef.current - startYRef.current

    // Only pull down, not up
    if (diff > 0) {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = 0.5
      const distance = Math.min(diff * resistance, maxPull)
      setPullDistance(distance)

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }, [isRefreshing, isPulling, maxPull])

  const onTouchEnd = useCallback(async () => {
    if (isRefreshing || !isPulling) return

    setIsPulling(false)

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
