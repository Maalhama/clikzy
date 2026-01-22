'use client'

import { useEffect, useRef, useCallback } from 'react'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import type { GameWithItem } from '@/types/database'

/**
 * ============================================
 * SIMULATION BOTS POUR LE LOBBY
 * ============================================
 *
 * Simule les clics de bots pour tous les jeux du lobby.
 * Utilise un seed déterministe pour synchroniser avec la page jeu.
 */

interface UseLobbyBotSimulationProps {
  games: GameWithItem[]
  onGameUpdate: (gameId: string, updates: {
    total_clicks?: number
    last_click_username?: string
    end_time?: number
  }) => void
  enabled?: boolean
}

// Seed déterministe basé sur gameId + timestamp arrondi
function getDeterministicSeed(gameId: string, roundedTime: number): number {
  const str = `${gameId}-${roundedTime}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Générateur pseudo-aléatoire déterministe
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

function getGamePersonality(gameId: string): number {
  const seed = getDeterministicSeed(gameId, 0)
  return 0.7 + (seed % 60) / 100
}

export function useLobbyBotSimulation({
  games,
  onGameUpdate,
  enabled = true,
}: UseLobbyBotSimulationProps) {

  const lastClickTimesRef = useRef<Map<string, number>>(new Map())
  const onGameUpdateRef = useRef(onGameUpdate)

  useEffect(() => {
    onGameUpdateRef.current = onGameUpdate
  }, [onGameUpdate])

  // Fonction pour simuler un clic sur un jeu
  const simulateClick = useCallback((game: GameWithItem) => {
    const now = Date.now()
    const timeLeft = game.end_time - now

    if (timeLeft <= 0) return

    // Seed basé sur le timestamp arrondi à la seconde pour synchronisation
    const roundedTime = Math.floor(now / 1000)

    // Générer username déterministe
    const username = generateDeterministicUsername(`${game.id}-${roundedTime}-bot`)

    // Reset timer SEULEMENT si timeLeft < 60s (pas juste le status)
    const shouldResetTimer = timeLeft <= 60000

    // Mettre à jour le jeu
    onGameUpdateRef.current(game.id, {
      total_clicks: (game.total_clicks || 0) + 1,
      last_click_username: username,
      end_time: shouldResetTimer ? now + 60000 : game.end_time,
    })

    // Mettre à jour le temps du dernier clic
    lastClickTimesRef.current.set(game.id, now)

    console.log(`[LOBBY BOT] ${username} clicked on ${game.item?.name || game.id.substring(0, 8)}`)
  }, [])

  useEffect(() => {
    if (!enabled || games.length === 0) return

    // Initialiser les temps de dernier clic
    games.forEach(game => {
      if (!lastClickTimesRef.current.has(game.id)) {
        // Premier clic rapide (2-5 secondes)
        lastClickTimesRef.current.set(game.id, Date.now() - 50000)
      }
    })

    const intervalId = setInterval(() => {
      const now = Date.now()

      games.forEach(game => {
        // Seulement les jeux actifs
        if (game.status !== 'active' && game.status !== 'final_phase') return

        const timeLeft = game.end_time - now
        if (timeLeft <= 0) return

        const lastClickTime = lastClickTimesRef.current.get(game.id) || 0
        const timeSinceLastClick = now - lastClickTime
        const personality = getGamePersonality(game.id)

        // Déterminer le délai minimum selon la phase
        let minDelay: number

        if (game.status === 'final_phase' || timeLeft <= 60000) {
          // Phase finale: 3 clics par minute
          minDelay = 8000 + (getDeterministicSeed(game.id, Math.floor(now / 5000)) % 17000)
        } else if (timeLeft <= 15 * 60 * 1000) {
          // Phase active: 1 clic par minute
          minDelay = 40000 + (getDeterministicSeed(game.id, Math.floor(now / 10000)) % 40000)
        } else if (timeLeft <= 30 * 60 * 1000) {
          // Phase building
          minDelay = 70000 + (getDeterministicSeed(game.id, Math.floor(now / 15000)) % 50000)
        } else {
          // Phase positioning
          minDelay = 140000 + (getDeterministicSeed(game.id, Math.floor(now / 20000)) % 100000)
        }

        minDelay = minDelay / personality

        // Pas encore le moment
        if (timeSinceLastClick < minDelay) return

        // Seed pour décision de clic (synchronisé entre clients)
        const clickSeed = getDeterministicSeed(game.id, Math.floor(now / 1000))
        const clickRandom = seededRandom(clickSeed)

        // Probabilité de cliquer
        const probability = game.status === 'final_phase' ? 0.9 : 0.7
        if (clickRandom() > probability) {
          // Reset timer pour réessayer
          lastClickTimesRef.current.set(game.id, now - minDelay + 3000)
          return
        }

        simulateClick(game)
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [enabled, games, simulateClick])
}
