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
  error: Error | null
  isLoading: boolean
}

// Constants for participant counter
const MIN_PARTICIPANTS = 1487
const MAX_PARTICIPANTS = 2382

// Deterministic pseudo-random based on time (all users see same value at same moment)
function getTimeBasedPlayerCount(): number {
  // Use 30-second intervals as seed for consistency
  const seed = Math.floor(Date.now() / 30000)
  // Simple hash function to get pseudo-random from seed
  const hash = ((seed * 9301 + 49297) % 233280) / 233280
  return Math.floor(MIN_PARTICIPANTS + hash * (MAX_PARTICIPANTS - MIN_PARTICIPANTS))
}

export function useLandingRealtime(
  initialWinners: Winner[] = [],
  initialGame: FeaturedGame | null = null
): LandingRealtimeData {
  // Initialize with deterministic value based on time (same for all users)
  const [playerCount, setPlayerCount] = useState(() => getTimeBasedPlayerCount())
  const [recentWinners, setRecentWinners] = useState<Winner[]>(initialWinners)
  const [featuredGame, setFeaturedGame] = useState<FeaturedGame | null>(initialGame)
  const [isConnected, setIsConnected] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const channelsRef = useRef<RealtimeChannel[]>([])
  const trendRef = useRef<number>(1)

  // Set mounted state and sync with time-based value
  useEffect(() => {
    setIsMounted(true)
    setIsLoading(false)
    // Sync with current time-based value
    setPlayerCount(getTimeBasedPlayerCount())
    trendRef.current = Date.now() % 2 === 0 ? 1 : -1
  }, [])

  // Participant counter synced with time-based value (all users see same count)
  useEffect(() => {
    if (!isMounted) return

    const syncWithTime = () => {
      setPlayerCount(getTimeBasedPlayerCount())
    }

    // Sync every 30 seconds (when the time-based value changes)
    const interval = setInterval(syncWithTime, 30000)
    setIsConnected(true)

    return () => clearInterval(interval)
  }, [isMounted])

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>

    try {
      supabase = createClient()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create Supabase client'))
      return
    }

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
          const fetchProfile = async () => {
            try {
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', newWinner.user_id)
                .single()

              if (profileError) {
                console.error('Error fetching winner profile:', profileError)
                return
              }

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
            } catch (err) {
              console.error('Error fetching winner profile:', err)
            }
          }
          fetchProfile()
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to connect to winners channel'))
        }
      })

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
    error,
    isLoading,
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

    // Prenoms francais credibles
    const firstNames = [
      'Lucas', 'Hugo', 'Emma', 'Lea', 'Thomas', 'Maxime', 'Camille', 'Nathan',
      'Chloe', 'Antoine', 'Julie', 'Quentin', 'Clara', 'Florian', 'Marion', 'Romain'
    ]
    const suffixes = ['', '75', '59', '69', '33', '_off', '_fr', '2k', '93', 'pro', '44']

    const generateUsername = () => {
      const name = firstNames[Math.floor(Math.random() * firstNames.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      return Math.random() > 0.5 ? name.toLowerCase() + suffix : name + suffix
    }

    const interval = setInterval(() => {
      addNotification(generateUsername())
    }, 2000 + Math.random() * 5000)

    return () => clearInterval(interval)
  }, [enabled, addNotification])

  return { notifications, addNotification }
}
