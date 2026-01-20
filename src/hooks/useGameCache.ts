'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { GAME_CONSTANTS } from '@/lib/constants'

// Shared localStorage key with useLobbyBots
const STORAGE_KEY = 'clikzy_bot_cache'

// Poll interval for reading cache
const POLL_INTERVAL = 200 // 200ms for responsive updates

interface CachedGameData {
  totalClicks: number
  lastUser: string
  endTime: number
  updatedAt: number
  isRealPlayer?: boolean  // True if last click was from a real player (not a bot)
}

interface CachedRecentClick {
  id: string
  gameId: string
  username: string
  itemName: string
  timestamp: number
}

interface BotCache {
  games: Record<string, CachedGameData>
  recentClicks: CachedRecentClick[]
  expiry: number
}

// Cache expiry duration
const CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour

// Load cache from localStorage
function loadBotCache(): BotCache | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    const data: BotCache = JSON.parse(cached)
    if (Date.now() > data.expiry) {
      return null
    }
    return data
  } catch {
    return null
  }
}

/**
 * Save a REAL player click to the cache
 * This ensures the lobby shows the real player as leader, not a bot
 */
export function savePlayerClickToCache(
  gameId: string,
  username: string,
  newEndTime: number,
  newTotalClicks: number,
  itemName: string
) {
  if (typeof window === 'undefined') return
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    let data: BotCache = cached
      ? JSON.parse(cached)
      : { games: {}, recentClicks: [], expiry: Date.now() + CACHE_EXPIRY }

    // Ensure structure exists
    if (!data.games) data.games = {}
    if (!data.recentClicks) data.recentClicks = []

    const now = Date.now()

    // Update game data with REAL player click
    // isRealPlayer: true tells lobby bots to RESPOND (never let real player win)
    data.games[gameId] = {
      totalClicks: newTotalClicks,
      lastUser: username,
      endTime: newEndTime,
      updatedAt: now,
      isRealPlayer: true,  // IMPORTANT: Bots will respond to this
    }

    // Add to recent clicks
    const newClick: CachedRecentClick = {
      id: `player-click-${now}-${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      username,
      itemName,
      timestamp: now,
    }
    data.recentClicks = [newClick, ...data.recentClicks].slice(0, 20)

    // Refresh expiry
    data.expiry = Date.now() + CACHE_EXPIRY

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

interface GameCacheData {
  totalClicks: number
  lastUser: string | null
  endTime: number | null
  recentClicks: CachedRecentClick[]
}

interface UseGameCacheOptions {
  gameId: string
  initialTotalClicks: number
  initialEndTime: number
  initialLastUser: string | null
}

interface UseGameCacheReturn {
  cachedData: GameCacheData | null
  isActive: boolean
}

/**
 * Hook to read bot data from shared cache (populated by lobby bots)
 * This replaces useGameBots - the game page now only READS, doesn't generate bots
 */
export function useGameCache({
  gameId,
  initialTotalClicks,
  initialEndTime,
  initialLastUser,
}: UseGameCacheOptions): UseGameCacheReturn {
  const [cachedData, setCachedData] = useState<GameCacheData | null>(null)
  const [isActive, setIsActive] = useState(false)

  // Track last synced timestamp to avoid redundant updates
  const lastSyncedRef = useRef<number>(0)

  // Poll cache for updates from lobby bots
  useEffect(() => {
    const pollCache = () => {
      const cache = loadBotCache()

      if (!cache) {
        setIsActive(false)
        return
      }

      setIsActive(true)
      const gameData = cache.games[gameId]

      if (!gameData) {
        // No cached data for this game yet
        setCachedData({
          totalClicks: initialTotalClicks,
          lastUser: initialLastUser,
          endTime: initialEndTime,
          recentClicks: cache.recentClicks?.filter(c => c.gameId === gameId) || [],
        })
        return
      }

      // Always apply cache updates if there's newer data
      // The cache endTime may be newer than initialEndTime (from bot clicks resetting the timer)
      if (gameData.updatedAt > lastSyncedRef.current) {
        lastSyncedRef.current = gameData.updatedAt

        // Use the best (most recent) endTime between cache and initial
        const effectiveEndTime = Math.max(gameData.endTime, initialEndTime)

        // Filter recent clicks for this game
        const gameRecentClicks = cache.recentClicks?.filter(c => c.gameId === gameId) || []

        setCachedData({
          totalClicks: Math.max(gameData.totalClicks, initialTotalClicks),
          lastUser: gameData.lastUser || initialLastUser,
          endTime: effectiveEndTime,
          recentClicks: gameRecentClicks,
        })
      }
    }

    // Poll frequently for responsive updates
    const interval = setInterval(pollCache, POLL_INTERVAL)
    // Check immediately on mount
    pollCache()

    return () => clearInterval(interval)
  }, [gameId, initialTotalClicks, initialEndTime, initialLastUser])

  return {
    cachedData,
    isActive,
  }
}
