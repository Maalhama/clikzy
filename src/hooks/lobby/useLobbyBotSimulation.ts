'use client'

import { useEffect, useRef, useCallback } from 'react'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import type { GameWithItem } from '@/types/database'

/**
 * ============================================
 * SIMULATION BOTS POUR LE LOBBY v2
 * ============================================
 *
 * Simule les clics de bots pour tous les jeux du lobby.
 * Utilise un seed déterministe pour synchroniser avec la page jeu.
 *
 * Système de bataille (phase finale):
 * - Durée: 30min à 1h59min (déterministe par jeu)
 * - 0-90%: bots cliquent normalement
 * - 90-100%: probabilité décroissante
 * - >100%: bots arrêtent, timer descend à 0
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

// ============================================
// SYSTÈME DE BATAILLE (durée limitée de la phase finale)
// ============================================

const BATTLE_MIN_DURATION = 30 * 60 * 1000  // 30 minutes min
const BATTLE_MAX_DURATION = 119 * 60 * 1000 // 1h59 max

function getBattleDuration(gameId: string): number {
  const hash = getDeterministicSeed(gameId + '-battle', 0)
  return BATTLE_MIN_DURATION + (hash % (BATTLE_MAX_DURATION - BATTLE_MIN_DURATION))
}

function getBattleProgress(gameId: string, battleStartTime: string | null): number {
  if (!battleStartTime) return 0

  const battleStart = new Date(battleStartTime).getTime()
  const elapsed = Date.now() - battleStart
  const totalDuration = getBattleDuration(gameId)

  return Math.min(1.5, elapsed / totalDuration)
}

function shouldBotClickInBattle(gameId: string, battleProgress: number): boolean {
  if (battleProgress >= 1) return false
  if (battleProgress < 0.9) return true

  const remainingProgress = (1 - battleProgress) / 0.1
  const seed = getDeterministicSeed(gameId, Math.floor(Date.now() / 5000))
  const random = (seed % 100) / 100

  return random < remainingProgress
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

        const isInFinalPhase = game.status === 'final_phase' || timeLeft <= 60000

        // Vérifier si la bataille est terminée (phase finale seulement)
        if (isInFinalPhase && game.battle_start_time) {
          const battleProgress = getBattleProgress(game.id, game.battle_start_time)
          if (!shouldBotClickInBattle(game.id, battleProgress)) {
            // Bataille terminée - laisser le timer descendre
            return
          }
        }

        const lastClickTime = lastClickTimesRef.current.get(game.id) || 0
        const timeSinceLastClick = now - lastClickTime
        const personality = getGamePersonality(game.id)

        // Déterminer le délai minimum selon la phase
        let minDelay: number

        if (isInFinalPhase) {
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
        const probability = isInFinalPhase ? 0.9 : 0.7
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
