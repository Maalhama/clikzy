'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Winner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
  avatar_url?: string
}

interface FeaturedGame {
  id: string
  item_name: string
  item_image_url: string
  item_value: number
  end_time: number
  total_clicks: number
  last_click_username: string | null
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

interface LandingRealtimeData {
  playerCount: number
  recentWinners: Winner[]
  featuredGame: FeaturedGame | null
  isConnected: boolean
}

export function useLandingRealtime(
  initialWinners: Winner[] = [],
  initialGame: FeaturedGame | null = null
): LandingRealtimeData {
  const [playerCount, setPlayerCount] = useState(0)
  const [recentWinners, setRecentWinners] = useState<Winner[]>(initialWinners)
  const [featuredGame, setFeaturedGame] = useState<FeaturedGame | null>(initialGame)
  const [isConnected, setIsConnected] = useState(false)

  const channelsRef = useRef<RealtimeChannel[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Presence channel for player count
    const presenceChannel = supabase.channel('landing-presence', {
      config: {
        presence: {
          key: `visitor-${Math.random().toString(36).substring(7)}`,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const count = Object.keys(state).length
        setPlayerCount(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() })
          setIsConnected(true)
        }
      })

    channelsRef.current.push(presenceChannel)

    // Winners channel - listen for new winners
    const winnersChannel = supabase
      .channel('landing-winners')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'winners',
        },
        (payload) => {
          const newWinner = payload.new as {
            id: string
            user_id: string
            item_name: string
            item_value: number
            created_at: string
          }

          // Fetch username for the winner
          supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newWinner.user_id)
            .single()
            .then(({ data }) => {
              const profileData = data as { username: string; avatar_url: string | null } | null
              if (profileData) {
                const winner: Winner = {
                  id: newWinner.id,
                  username: profileData.username || 'Anonyme',
                  item_name: newWinner.item_name,
                  item_value: newWinner.item_value,
                  won_at: newWinner.created_at,
                  avatar_url: profileData.avatar_url || undefined,
                }
                setRecentWinners((prev) => [winner, ...prev.slice(0, 9)])
              }
            })
        }
      )
      .subscribe()

    channelsRef.current.push(winnersChannel)

    // Featured game channel - listen for game updates
    if (initialGame?.id) {
      const gameChannel = supabase
        .channel(`landing-game-${initialGame.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${initialGame.id}`,
          },
          (payload) => {
            const updated = payload.new as {
              id: string
              end_time: number
              total_clicks: number
              last_click_username: string | null
              status: 'waiting' | 'active' | 'final_phase' | 'ended'
            }

            setFeaturedGame((prev) =>
              prev
                ? {
                    ...prev,
                    end_time: updated.end_time,
                    total_clicks: updated.total_clicks,
                    last_click_username: updated.last_click_username,
                    status: updated.status,
                  }
                : null
            )
          }
        )
        .subscribe()

      channelsRef.current.push(gameChannel)
    }

    // Cleanup
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [initialGame?.id])

  return {
    playerCount,
    recentWinners,
    featuredGame,
    isConnected,
  }
}

// Hook for simulated click notifications (for demo/showcase)
export function useClickNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<
    { id: string; username: string; timestamp: number }[]
  >([])

  const addNotification = useCallback((username: string) => {
    const id = Math.random().toString(36).substring(7)
    setNotifications((prev) => [...prev.slice(-4), { id, username, timestamp: Date.now() }])

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  // Simulate random clicks for demo effect
  useEffect(() => {
    if (!enabled) return

    const usernames = [
      'Alex42', 'MarieLucas', 'GamerPro', 'NeonKing',
      'StarPlayer', 'LuckyOne', 'FastClick', 'WinnerX',
    ]

    const interval = setInterval(() => {
      const randomUser = usernames[Math.floor(Math.random() * usernames.length)]
      addNotification(randomUser)
    }, 2000 + Math.random() * 5000)

    return () => clearInterval(interval)
  }, [enabled, addNotification])

  return { notifications, addNotification }
}
