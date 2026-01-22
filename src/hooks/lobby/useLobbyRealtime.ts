'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GAME_CONSTANTS } from '@/lib/constants'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GameWithItem } from '@/types/database'

interface ClickNotification {
  id: string
  username: string
  game_id: string
  item_name: string
  timestamp: number
}

interface LobbyRealtimeData {
  games: GameWithFinalPhaseTracking[]
  recentClicks: ClickNotification[]
  isConnected: boolean
  error: Error | null
  updateGame: (gameId: string, updates: Partial<GameWithItem>) => void
  addClickNotification: (username: string, gameId: string, itemName: string) => void
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

  // Update a specific game (for bot simulation)
  const updateGame = useCallback(
    (gameId: string, updates: Partial<GameWithItem>) => {
      setGames((prevGames) =>
        prevGames.map((game) =>
          game.id === gameId ? { ...game, ...updates } : game
        )
      )
    },
    []
  )

  // Fetch initial clicks from database
  useEffect(() => {
    const fetchInitialClicks = async () => {
      try {
        const response = await fetch('/api/clicks/recent?limit=5')
        if (response.ok) {
          const data = await response.json()
          if (data.clicks && data.clicks.length > 0) {
            setRecentClicks(data.clicks.map((click: { id: string; username: string; game_id: string; item_name: string; timestamp: number }) => ({
              id: click.id,
              username: click.username,
              game_id: click.game_id,
              item_name: click.item_name,
              timestamp: click.timestamp,
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial clicks:', error)
      }
    }

    fetchInitialClicks()
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to game updates AND clicks
    const channel = supabase
      .channel('lobby-games-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          // New click from database (bot or real player)
          const click = payload.new as {
            id: string
            game_id: string
            username: string | null
            item_name: string | null
            clicked_at: string
          }

          if (click.username) {
            const notification: ClickNotification = {
              id: click.id,
              username: click.username,
              game_id: click.game_id,
              item_name: click.item_name || 'Produit',
              timestamp: new Date(click.clicked_at).getTime(),
            }

            setRecentClicks((prev) => [notification, ...prev].slice(0, 5))
          }
        }
      )
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
    updateGame,
    addClickNotification,
  }
}
