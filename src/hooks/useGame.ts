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

export function useGame(initialGame: GameWithItem) {
  const [game, setGame] = useState<GameWithItem>(initialGame)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      // Subscribe to game updates via Postgres Changes
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

  return {
    game,
    isConnected,
    optimisticUpdate,
  }
}
