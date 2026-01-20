'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { Game, Item } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type GameWithItem = Game & {
  item: Item
}

type GameUpdate = {
  end_time: number
  last_click_username: string | null
  last_click_at: string | null
  total_clicks: number
  status: Game['status']
  winner_id: string | null
}

// Click notification for the feed
export interface GameClick {
  id: string
  username: string
  clickedAt: string
  isBot: boolean
}

export function useGame(initialGame: GameWithItem) {
  const [game, setGame] = useState<GameWithItem>(initialGame)
  const [recentClicks, setRecentClicks] = useState<GameClick[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial clicks from API
  useEffect(() => {
    const fetchInitialClicks = async () => {
      try {
        const response = await fetch(`/api/clicks/recent?game_id=${initialGame.id}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          if (data.clicks && data.clicks.length > 0) {
            setRecentClicks(data.clicks.map((click: {
              id: string
              username: string
              timestamp: number
              is_bot: boolean
            }) => ({
              id: click.id,
              username: click.username,
              clickedAt: new Date(click.timestamp).toISOString(),
              isBot: click.is_bot || false,
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial clicks:', error)
      }
    }

    fetchInitialClicks()
  }, [initialGame.id])

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      // Subscribe to game updates AND clicks via Postgres Changes
      channel = supabase
        .channel(`game:${initialGame.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${initialGame.id}`,
          },
          (payload) => {
            const newData = payload.new as Game
            setGame((prev) => ({
              ...prev,
              ...newData,
            }))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'clicks',
            filter: `game_id=eq.${initialGame.id}`,
          },
          (payload) => {
            // New click from database (bot or real player)
            const click = payload.new as {
              id: string
              username: string | null
              clicked_at: string
              is_bot: boolean
            }

            if (click.username) {
              const newClick: GameClick = {
                id: click.id,
                username: click.username,
                clickedAt: click.clicked_at,
                isBot: click.is_bot || false,
              }

              setRecentClicks((prev) => {
                // Avoid duplicates
                if (prev.some(c => c.id === click.id)) return prev
                return [newClick, ...prev].slice(0, 10)
              })
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [initialGame.id])

  // Optimistic update function for local state
  const optimisticUpdate = useCallback((update: Partial<GameUpdate>) => {
    setGame((prev) => ({
      ...prev,
      ...update,
    }))
  }, [])

  // Add a click to the feed (for optimistic updates from real player clicks)
  const addClick = useCallback((click: GameClick) => {
    setRecentClicks((prev) => {
      if (prev.some(c => c.id === click.id)) return prev
      return [click, ...prev].slice(0, 10)
    })
  }, [])

  // Remove a click from the feed (for rollback on error)
  const removeClick = useCallback((clickId: string) => {
    setRecentClicks((prev) => prev.filter(c => c.id !== clickId))
  }, [])

  return {
    game,
    recentClicks,
    isConnected,
    optimisticUpdate,
    addClick,
    removeClick,
  }
}
