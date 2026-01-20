'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GAME_CONSTANTS } from '@/lib/constants'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GameWithItem } from '@/types/database'

// Shared localStorage key with useGameBots for synchronization
const STORAGE_KEY = 'clikzy_bot_cache'

// Poll interval - faster for more responsive sync
const POLL_INTERVAL = 300 // 300ms

interface CachedRecentClick {
  id: string
  gameId: string
  username: string
  itemName: string
  timestamp: number
}

interface CachedGameData {
  totalClicks: number
  lastUser: string
  endTime: number
  updatedAt: number
}

interface BotCache {
  games: Record<string, CachedGameData>
  recentClicks: CachedRecentClick[]
  expiry: number
}

// Load the entire cache from localStorage
function loadBotCache(): BotCache | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    const data: BotCache = JSON.parse(cached)
    if (Date.now() > data.expiry) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

interface ClickNotification {
  id: string
  username: string
  game_id: string
  item_name: string
  timestamp: number
}

interface BotClick {
  id: string
  gameId: string
  username: string
  timestamp: number
}

interface LobbyRealtimeData {
  games: GameWithFinalPhaseTracking[]
  recentClicks: ClickNotification[]
  isConnected: boolean
  error: Error | null
  addBotClicks: (botClicks: BotClick[]) => void
  applyCachedLeaders: (cachedData: Record<string, { leader: string; clicks: number; endTime: number | null }>) => void
}

interface GameUpdate {
  id: string
  end_time: number
  total_clicks: number
  last_click_username: string | null
  last_click_user_id: string | null
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

// Extended game type with final phase entry tracking
export interface GameWithFinalPhaseTracking extends GameWithItem {
  enteredFinalPhaseAt?: number // Timestamp when game entered final phase
}

export function useLobbyRealtime(
  initialGames: GameWithItem[]
): LobbyRealtimeData {
  const [games, setGames] = useState<GameWithFinalPhaseTracking[]>(initialGames)
  const [recentClicks, setRecentClicks] = useState<ClickNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)

  // Track ORIGINAL end_time from database (to prevent infinite extensions)
  const originalEndTimesRef = useRef<Record<string, number>>({})

  // Track known game IDs to detect new games
  const knownGameIdsRef = useRef<Set<string>>(new Set())

  // Track when each game entered final phase (persistent across renders)
  const finalPhaseEntryRef = useRef<Record<string, number>>({})

  // Initialize known game IDs from initial games
  useEffect(() => {
    initialGames.forEach(game => {
      knownGameIdsRef.current.add(game.id)
    })
  }, [initialGames])

  // Poll for new games every 5 seconds
  useEffect(() => {
    const supabase = createClient()

    const pollForNewGames = async () => {
      const { data: activeGames } = await supabase
        .from('games')
        .select(`*, item:items(*)`)
        .in('status', ['active', 'final_phase', 'waiting'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (!activeGames) return

      const gamesTyped = activeGames as GameWithItem[]

      // Find new games that we don't know about yet
      const newGames = gamesTyped.filter(
        (game) => !knownGameIdsRef.current.has(game.id)
      )

      if (newGames.length > 0) {
        // Add new game IDs to known set
        newGames.forEach(game => {
          knownGameIdsRef.current.add(game.id)
        })

        // Add new games to state
        setGames((prevGames) => {
          // Avoid duplicates
          const existingIds = new Set(prevGames.map(g => g.id))
          const uniqueNewGames = newGames.filter(g => !existingIds.has(g.id))
          return [...uniqueNewGames, ...prevGames]
        })
      }
    }

    // Poll every 5 seconds
    const interval = setInterval(pollForNewGames, 5000)
    // Also poll immediately
    pollForNewGames()

    return () => clearInterval(interval)
  }, [])

  // Update games when initial data changes (e.g., revalidation)
  useEffect(() => {
    const now = Date.now()

    // Process initial games and track final phase entry
    const gamesWithTracking: GameWithFinalPhaseTracking[] = initialGames.map((game) => {
      // Store original end times from database
      if (!originalEndTimesRef.current[game.id] || game.end_time > originalEndTimesRef.current[game.id]) {
        originalEndTimesRef.current[game.id] = game.end_time
      }

      // Check if game is in final phase
      const timeLeft = game.end_time - now
      const inFinalPhase = timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD

      // Track when game entered final phase
      let enteredFinalPhaseAt = finalPhaseEntryRef.current[game.id]
      if (inFinalPhase && !enteredFinalPhaseAt) {
        // Game is in final phase but we haven't tracked it yet
        // Use "now" as the entry time (best approximation for existing final phase games)
        finalPhaseEntryRef.current[game.id] = now
        enteredFinalPhaseAt = now
      }

      return {
        ...game,
        enteredFinalPhaseAt,
      }
    })

    setGames(gamesWithTracking)
  }, [initialGames])

  // Helper to check if a game is in final phase
  const isInFinalPhase = useCallback((endTime: number) => {
    const now = Date.now()
    const timeLeft = endTime - now
    return timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD
  }, [])

  // Poll localStorage cache for updates from lobby bots
  useEffect(() => {
    const pollCache = () => {
      const cache = loadBotCache()
      if (!cache) return

      const now = Date.now()

      // Apply ALL cached game data to games state
      // This ensures lobby always shows the latest bot data
      if (cache.games && Object.keys(cache.games).length > 0) {
        setGames((prevGames) =>
          prevGames.map((game) => {
            // NEVER update ended games - they stay ended
            if (game.status === 'ended') return game

            const cached = cache.games[game.id]
            if (!cached || !cached.lastUser) return game

            // Check if ORIGINAL game timer has expired (should be ended)
            // This prevents cache from "resurrecting" a game that should have ended
            const originalEndTime = originalEndTimesRef.current[game.id] || game.end_time
            if (originalEndTime <= now && cached.endTime <= now) {
              // Original timer expired AND cache doesn't have a valid future time
              // Game should be ended, don't apply cache updates
              return game
            }

            // Only update if cached data is different/better
            const shouldUpdate =
              cached.totalClicks > game.total_clicks ||
              cached.lastUser !== game.last_click_username ||
              cached.endTime > game.end_time

            if (!shouldUpdate) return game

            const newEndTime = Math.max(cached.endTime, game.end_time)
            const wasInFinalPhase = isInFinalPhase(game.end_time)
            const nowInFinalPhase = isInFinalPhase(newEndTime)

            // Track when game FIRST enters final phase
            let enteredFinalPhaseAt = game.enteredFinalPhaseAt
            if (nowInFinalPhase && !wasInFinalPhase && !finalPhaseEntryRef.current[game.id]) {
              // Game just entered final phase - record timestamp
              finalPhaseEntryRef.current[game.id] = now
              enteredFinalPhaseAt = now
            } else if (finalPhaseEntryRef.current[game.id]) {
              // Already tracked - use stored value
              enteredFinalPhaseAt = finalPhaseEntryRef.current[game.id]
            }

            return {
              ...game,
              last_click_username: cached.lastUser,
              total_clicks: Math.max(cached.totalClicks, game.total_clicks),
              end_time: newEndTime,
              status: nowInFinalPhase ? 'final_phase' : game.status,
              enteredFinalPhaseAt,
            }
          })
        )
      }

      // Update recent clicks from cache
      if (cache.recentClicks && cache.recentClicks.length > 0) {
        setRecentClicks(
          cache.recentClicks.slice(0, 5).map(click => ({
            id: click.id,
            username: click.username,
            game_id: click.gameId,
            item_name: click.itemName,
            timestamp: click.timestamp,
          }))
        )
      }
    }

    // Poll frequently for responsive sync
    const interval = setInterval(pollCache, POLL_INTERVAL)
    // Also check immediately on mount
    pollCache()

    return () => clearInterval(interval)
  }, [])

  // Add click notification (no auto-remove - rotates through 3 slots)
  const addClickNotification = useCallback(
    (username: string, gameId: string, itemName: string) => {
      const notification: ClickNotification = {
        id: Math.random().toString(36).substring(7),
        username,
        game_id: gameId,
        item_name: itemName,
        timestamp: Date.now(),
      }

      // Keep only the 3 most recent clicks (for the 3 visible slots)
      // New click goes to position 1, others shift down
      setRecentClicks((prev) => [notification, ...prev].slice(0, 3))
    },
    []
  )

  // Process bot clicks and integrate them into the game state
  const processedBotClicksRef = useRef<Set<string>>(new Set())

  const addBotClicks = useCallback(
    (botClicks: BotClick[]) => {
      // Filter out already processed clicks
      const newClicks = botClicks.filter(
        (click) => !processedBotClicksRef.current.has(click.id)
      )

      if (newClicks.length === 0) return

      // Mark as processed
      newClicks.forEach((click) => {
        processedBotClicksRef.current.add(click.id)
      })

      // Keep the set from growing indefinitely
      if (processedBotClicksRef.current.size > 1000) {
        const entries = Array.from(processedBotClicksRef.current)
        processedBotClicksRef.current = new Set(entries.slice(-500))
      }

      // Group clicks by game
      const clicksByGame = new Map<string, BotClick[]>()
      newClicks.forEach((click) => {
        const existing = clicksByGame.get(click.gameId) || []
        existing.push(click)
        clicksByGame.set(click.gameId, existing)
      })

      // Update games with bot clicks
      setGames((prevGames) => {
        const updatedGames = prevGames.map((game) => {
          const gameClicks = clicksByGame.get(game.id)
          if (!gameClicks || gameClicks.length === 0) return game

          // Get the most recent click for this game
          const lastClick = gameClicks.reduce((latest, click) =>
            click.timestamp > latest.timestamp ? click : latest
          )

          // Calculate new end_time if in final phase (< 1 minute)
          const now = Date.now()
          const timeLeft = game.end_time - now
          let newEndTime = game.end_time

          // Reset timer to 1 minute if in final phase
          if (timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
            newEndTime = now + GAME_CONSTANTS.TIMER_RESET_VALUE
          }

          return {
            ...game,
            total_clicks: game.total_clicks + gameClicks.length,
            last_click_username: lastClick.username,
            end_time: newEndTime,
            status: timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD ? 'final_phase' : game.status,
          }
        })
        return updatedGames
      })

      // Add notifications OUTSIDE of setGames to avoid duplicates
      newClicks.forEach((click) => {
        // Find the game to get item name
        const game = games.find(g => g.id === click.gameId)
        if (game) {
          addClickNotification(click.username, click.gameId, game.item?.name || 'Item')
        }
      })
    },
    [addClickNotification, games]
  )

  // Apply cached bot data to games (for persistence across page loads)
  const applyCachedLeaders = useCallback(
    (cachedData: Record<string, { leader: string; clicks: number; endTime: number | null }>) => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          const cached = cachedData[game.id]
          // Only apply if game doesn't already have a leader from DB
          if (cached && !game.last_click_username) {
            return {
              ...game,
              last_click_username: cached.leader,
              total_clicks: game.total_clicks + cached.clicks,
              // Apply cached endTime if it's newer
              end_time: cached.endTime && cached.endTime > game.end_time ? cached.endTime : game.end_time,
            }
          }
          return game
        })
      )
    },
    []
  )

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to game updates
    const channel = supabase
      .channel('lobby-games-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
        },
        (payload) => {
          const updated = payload.new as GameUpdate
          const now = Date.now()

          setGames((prevGames) =>
            prevGames.map((game) => {
              if (game.id === updated.id) {
                // Check if this is a new click (total_clicks increased)
                if (
                  updated.total_clicks > game.total_clicks &&
                  updated.last_click_username
                ) {
                  addClickNotification(
                    updated.last_click_username,
                    game.id,
                    game.item?.name || 'Item'
                  )
                }

                // Track final phase entry via database update
                const wasInFinalPhase = game.enteredFinalPhaseAt !== undefined
                const timeLeft = updated.end_time - now
                const nowInFinalPhase = timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD

                let enteredFinalPhaseAt = game.enteredFinalPhaseAt
                if (nowInFinalPhase && !wasInFinalPhase && !finalPhaseEntryRef.current[game.id]) {
                  // Game just entered final phase - record timestamp
                  finalPhaseEntryRef.current[game.id] = now
                  enteredFinalPhaseAt = now
                } else if (finalPhaseEntryRef.current[game.id]) {
                  enteredFinalPhaseAt = finalPhaseEntryRef.current[game.id]
                }

                return {
                  ...game,
                  end_time: updated.end_time,
                  total_clicks: updated.total_clicks,
                  last_click_username: updated.last_click_username,
                  last_click_user_id: updated.last_click_user_id,
                  status: updated.status,
                  enteredFinalPhaseAt,
                }
              }
              return game
            })
          )
          // Note: We keep ended games in the list - the sorting/filtering handles display
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games',
        },
        async (payload) => {
          // Fetch the complete game with item
          const { data: newGame, error } = await supabase
            .from('games')
            .select(
              `
              *,
              item:items(*)
            `
            )
            .eq('id', payload.new.id)
            .single()

          if (error) {
            console.error('[REALTIME] Error fetching new game:', error)
            return
          }

          if (newGame) {
            const game = newGame as GameWithItem
            setGames((prevGames) => [game, ...prevGames])
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to connect to realtime channel'))
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [addClickNotification])

  return {
    games,
    recentClicks,
    isConnected,
    error,
    addBotClicks,
    applyCachedLeaders,
  }
}
