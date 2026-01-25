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
    last_click_user_id?: string | null
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

    // Reset timer SEULEMENT si timeLeft < 120s (phase finale)
    const shouldResetTimer = timeLeft <= 90000

    // Mettre à jour le jeu
    onGameUpdateRef.current(game.id, {
      total_clicks: (game.total_clicks || 0) + 1,
      last_click_username: username,
      end_time: shouldResetTimer ? now + 90000 : game.end_time,
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

        const isInFinalPhase = game.status === 'final_phase' || timeLeft <= 90000
        const hasRealPlayer = !!game.last_click_user_id

        // Vérifier si la bataille est terminée
        let battleEnded = false
        if (isInFinalPhase && game.battle_start_time) {
          const battleProgress = getBattleProgress(game.id, game.battle_start_time)
          battleEnded = !shouldBotClickInBattle(game.id, battleProgress)
        }

        // SNIPE: Seuil FIXE par jeu entre 10s et 50s (synchronisé avec la page jeu)
        const snipeThresholdSeed = getDeterministicSeed(game.id + '-snipe-threshold', 0)
        const snipeThreshold = 10000 + (snipeThresholdSeed % 40000) // 10s à 50s

        // Snipe urgent si timer < 8s
        if (hasRealPlayer && isInFinalPhase && timeLeft <= 8000) {
          const roundedTime = Math.floor(now / 1000)
          const username = generateDeterministicUsername(`${game.id}-${roundedTime}-snipe`)

          onGameUpdateRef.current(game.id, {
            total_clicks: (game.total_clicks || 0) + 1,
            last_click_username: username,
            last_click_user_id: null, // Bot reprend
            end_time: now + 90000,
          })
          lastClickTimesRef.current.set(game.id, now)
          console.log(`[LOBBY BOT] URGENT SNIPE! ${username} at ${Math.floor(timeLeft/1000)}s`)
          return
        }

        // Snipe si timer atteint le seuil aléatoire
        if (hasRealPlayer && isInFinalPhase && timeLeft <= snipeThreshold) {
          const snipeSeed = getDeterministicSeed(game.id + '-snipe', Math.floor(now / 3000))
          // 70% chance de sniper
          if (snipeSeed % 10 < 7) {
            const roundedTime = Math.floor(now / 1000)
            const username = generateDeterministicUsername(`${game.id}-${roundedTime}-snipe`)

            onGameUpdateRef.current(game.id, {
              total_clicks: (game.total_clicks || 0) + 1,
              last_click_username: username,
              last_click_user_id: null,
              end_time: now + 90000,
            })
            lastClickTimesRef.current.set(game.id, now)
            console.log(`[LOBBY BOT] SNIPE! ${username} at ${Math.floor(timeLeft/1000)}s (threshold: ${Math.floor(snipeThreshold/1000)}s)`)
            return
          }
          return // Attendre le prochain cycle
        }

        // Si bataille terminée mais joueur réel leader et timer < 8s, snipe quand même
        if (battleEnded && hasRealPlayer && timeLeft <= 8000) {
          const roundedTime = Math.floor(now / 1000)
          const username = generateDeterministicUsername(`${game.id}-${roundedTime}-endsnipe`)

          onGameUpdateRef.current(game.id, {
            total_clicks: (game.total_clicks || 0) + 1,
            last_click_username: username,
            last_click_user_id: null,
            end_time: now + 90000,
          })
          lastClickTimesRef.current.set(game.id, now)
          console.log(`[LOBBY BOT] ENDGAME SNIPE! ${username}`)
          return
        }

        // Si bataille terminée, laisser timer descendre
        if (battleEnded) return

        // Si joueur réel leader en phase finale (au-dessus du seuil), attendre
        if (hasRealPlayer && isInFinalPhase) return

        const lastClickTime = lastClickTimesRef.current.get(game.id) || 0
        const timeSinceLastClick = now - lastClickTime
        const personality = getGamePersonality(game.id)

        // Déterminer le délai minimum selon la phase - augmentés pour plus de suspense
        let minDelay: number

        if (isInFinalPhase) {
          // Phase finale : attendre 25-50s pour laisser le timer descendre bas
          minDelay = 25000 + (getDeterministicSeed(game.id, Math.floor(now / 5000)) % 25000)
        } else if (timeLeft <= 15 * 60 * 1000) {
          minDelay = 40000 + (getDeterministicSeed(game.id, Math.floor(now / 10000)) % 40000)
        } else if (timeLeft <= 30 * 60 * 1000) {
          minDelay = 70000 + (getDeterministicSeed(game.id, Math.floor(now / 15000)) % 50000)
        } else {
          minDelay = 140000 + (getDeterministicSeed(game.id, Math.floor(now / 20000)) % 100000)
        }

        minDelay = minDelay / personality

        if (timeSinceLastClick < minDelay) return

        const clickSeed = getDeterministicSeed(game.id, Math.floor(now / 1000))
        const clickRandom = seededRandom(clickSeed)

        // Probabilité réduite en phase finale (50%) pour plus de suspense
        const probability = isInFinalPhase ? 0.5 : 0.7
        if (clickRandom() > probability) {
          lastClickTimesRef.current.set(game.id, now - minDelay + 3000)
          return
        }

        simulateClick(game)
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [enabled, games, simulateClick])
}
