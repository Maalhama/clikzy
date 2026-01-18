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

// Constants for participant counter
const MIN_PARTICIPANTS = 1487
const MAX_PARTICIPANTS = 2382

export function useLandingRealtime(
  initialWinners: Winner[] = [],
  initialGame: FeaturedGame | null = null
): LandingRealtimeData {
  // Initialize with fixed value to avoid hydration mismatch, then randomize on client
  const [playerCount, setPlayerCount] = useState(MIN_PARTICIPANTS + 400) // Fixed initial value
  const [recentWinners, setRecentWinners] = useState<Winner[]>(initialWinners)
  const [featuredGame, setFeaturedGame] = useState<FeaturedGame | null>(initialGame)
  const [isConnected, setIsConnected] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const channelsRef = useRef<RealtimeChannel[]>([])
  const trendRef = useRef<number>(1)

  // Set mounted state and initialize random value client-side only
  useEffect(() => {
    setIsMounted(true)
    // Set random initial value only on client
    setPlayerCount(Math.floor(MIN_PARTICIPANTS + Math.random() * (MAX_PARTICIPANTS - MIN_PARTICIPANTS)))
    trendRef.current = Math.random() > 0.5 ? 1 : -1
  }, [])

  // Realistic participant counter that fluctuates (only after mount)
  useEffect(() => {
    if (!isMounted) return

    const updateCount = () => {
      setPlayerCount(prev => {
        // Change trend direction occasionally (10% chance)
        if (Math.random() < 0.1) {
          trendRef.current *= -1
        }

        // Also reverse trend if we're near boundaries
        if (prev <= MIN_PARTICIPANTS + 50) trendRef.current = 1
        if (prev >= MAX_PARTICIPANTS - 50) trendRef.current = -1

        // Calculate change (1-12 in trend direction, occasionally opposite)
        let change = Math.floor(1 + Math.random() * 12) * trendRef.current

        // 20% chance to go opposite direction for natural feel
        if (Math.random() < 0.2) {
          change = -change
        }

        // Apply change and clamp to range
        const newCount = Math.max(MIN_PARTICIPANTS, Math.min(MAX_PARTICIPANTS, prev + change))
        return newCount
      })
    }

    // Update every 2-5 seconds randomly
    const scheduleNextUpdate = () => {
      const delay = 2000 + Math.random() * 3000
      return setTimeout(() => {
        updateCount()
        timeoutId = scheduleNextUpdate()
      }, delay)
    }

    let timeoutId = scheduleNextUpdate()
    setIsConnected(true)

    return () => clearTimeout(timeoutId)
  }, [isMounted])

  useEffect(() => {
    const supabase = createClient()

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
