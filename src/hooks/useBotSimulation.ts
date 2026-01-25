'use client'

import { useEffect, useRef } from 'react'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import type { GameClick } from './useGame'

/**
 * ============================================
 * SIMULATION FRONTEND DES BOTS CLEEKZY v6
 * ============================================
 *
 * Synchronise les clics de bots avec la DB via API
 * pour que le lobby affiche le même leader que la page jeu.
 *
 * Système de bataille (phase finale):
 * - Durée: 30min à 1h59min (déterministe par jeu)
 * - 0-90%: bots cliquent normalement
 * - 90-100%: probabilité décroissante
 * - >100%: bots arrêtent, timer descend à 0
 */

// Sync bot click to database (fire and forget)
async function syncBotClickToDb(gameId: string, username: string) {
  try {
    await fetch('/api/games/bot-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, username }),
    })
  } catch (error) {
    console.error('[BOT SIM] Failed to sync to DB:', error)
  }
}

interface UseBotSimulationProps {
  gameId: string
  endTime: number
  status: string
  battleStartTime: string | null
  lastClickUsername: string | null
  lastClickUserId: string | null
  addClick: (click: GameClick) => void
  optimisticUpdate: (update: { end_time?: number; last_click_username?: string; last_click_user_id?: string | null }) => void
  enabled?: boolean
}

// Seed déterministe basé sur gameId + timestamp arrondi (MÊME QUE LOBBY)
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

function getGamePersonality(gameId: string): number {
  const seed = getDeterministicSeed(gameId, 0)
  return 0.7 + (seed % 60) / 100
}

// Générateur pseudo-aléatoire déterministe
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
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

  return Math.min(1.5, elapsed / totalDuration) // Cap à 150% pour éviter des valeurs infinies
}

function shouldBotClickInBattle(gameId: string, battleProgress: number, hasRealPlayer: boolean): boolean {
  // Tant que la bataille n'est pas terminée (< 100%), les bots DOIVENT cliquer
  // pour maintenir le timer et faire durer la bataille 30min à 1h59min

  if (battleProgress < 1) {
    // Bataille en cours - toujours cliquer pour maintenir le timer
    return true
  }

  // Bataille terminée (>= 100%)
  // Continuer seulement si un joueur réel est présent
  return hasRealPlayer
}

export function useBotSimulation({
  gameId,
  endTime,
  status,
  battleStartTime,
  lastClickUsername,
  lastClickUserId,
  addClick,
  optimisticUpdate,
  enabled = true,
}: UseBotSimulationProps) {

  const endTimeRef = useRef(endTime)
  const statusRef = useRef(status)
  const battleStartTimeRef = useRef(battleStartTime)
  const lastClickUserIdRef = useRef(lastClickUserId)
  const addClickRef = useRef(addClick)
  const optimisticUpdateRef = useRef(optimisticUpdate)
  const lastClickTimeRef = useRef<number>(0)
  const lastUsernameRef = useRef<string | null>(lastClickUsername)
  const personalityRef = useRef(getGamePersonality(gameId))

  useEffect(() => { endTimeRef.current = endTime }, [endTime])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { battleStartTimeRef.current = battleStartTime }, [battleStartTime])
  useEffect(() => { lastClickUserIdRef.current = lastClickUserId }, [lastClickUserId])
  useEffect(() => { addClickRef.current = addClick }, [addClick])
  useEffect(() => { optimisticUpdateRef.current = optimisticUpdate }, [optimisticUpdate])
  useEffect(() => { lastUsernameRef.current = lastClickUsername }, [lastClickUsername])

  useEffect(() => {
    if (!enabled) return
    if (status !== 'active' && status !== 'final_phase') return

    console.log(`[BOT SIM] Starting simulation for game ${gameId}, status: ${status}`)

    // Premier clic rapide
    lastClickTimeRef.current = Date.now() - 50000

    const intervalId = setInterval(() => {
      const now = Date.now()
      const currentEndTime = endTimeRef.current
      const currentStatus = statusRef.current
      const timeLeft = currentEndTime - now

      if (timeLeft <= 0 || (currentStatus !== 'active' && currentStatus !== 'final_phase')) {
        return
      }

      const timeSinceLastClick = now - lastClickTimeRef.current
      const personality = personalityRef.current
      const isInFinalPhase = currentStatus === 'final_phase' || timeLeft <= 90000
      const hasRealPlayer = !!lastClickUserIdRef.current

      // Vérifier si la bataille est terminée (phase finale seulement)
      // Si un joueur réel est présent, les bots continuent même après la durée max
      let battleEnded = false
      if (isInFinalPhase && battleStartTimeRef.current) {
        const battleProgress = getBattleProgress(gameId, battleStartTimeRef.current)
        battleEnded = !shouldBotClickInBattle(gameId, battleProgress, hasRealPlayer)
      }

      // SNIPE LOGIC: Quand joueur réel est leader en phase finale
      // Délai aléatoire entre 10s et 50s (moyenne ~20s) pour paraître naturel
      if (hasRealPlayer && isInFinalPhase) {
        // Générer un seuil de snipe aléatoire basé sur le gameId et le moment
        // Cela donne un délai différent à chaque "tentative" mais cohérent entre clients
        const snipeThresholdSeed = getDeterministicSeed(gameId + '-threshold', Math.floor(now / 5000))
        // Seuil entre 10s et 50s (10000ms à 50000ms)
        const snipeThreshold = 10000 + (snipeThresholdSeed % 40000)

        if (timeLeft <= 8000) {
          // SNIPE URGENT! Timer très critique (<8s), on reprend le lead immédiatement
          const roundedTime = Math.floor(now / 1000)
          const username = generateDeterministicUsername(`${gameId}-${roundedTime}-snipe`)
          const clickId = `snipe-${gameId}-${roundedTime}`

          const simulatedClick: GameClick = {
            id: clickId,
            username,
            clickedAt: new Date().toISOString(),
            isBot: true,
          }

          addClickRef.current(simulatedClick)
          optimisticUpdateRef.current({
            end_time: now + 90000,
            last_click_username: username,
            last_click_user_id: null,
          })
          syncBotClickToDb(gameId, username)

          lastClickTimeRef.current = now
          lastUsernameRef.current = username

          console.log(`[BOT SIM] URGENT SNIPE! ${username} stole at ${Math.floor(timeLeft/1000)}s`)
          return
        } else if (timeLeft <= snipeThreshold) {
          // Timer atteint le seuil aléatoire - sniper avec probabilité
          const snipeSeed = getDeterministicSeed(gameId + '-snipe', Math.floor(now / 3000))
          // 70% chance de sniper quand le seuil est atteint
          if (snipeSeed % 10 < 7) {
            const roundedTime = Math.floor(now / 1000)
            const username = generateDeterministicUsername(`${gameId}-${roundedTime}-earlysnipe`)

            addClickRef.current({
              id: `earlysnipe-${gameId}-${roundedTime}`,
              username,
              clickedAt: new Date().toISOString(),
              isBot: true,
            })
            optimisticUpdateRef.current({
              end_time: now + 90000,
              last_click_username: username,
              last_click_user_id: null,
            })
            syncBotClickToDb(gameId, username)

            lastClickTimeRef.current = now
            console.log(`[BOT SIM] SNIPE! ${username} at ${Math.floor(timeLeft/1000)}s (threshold: ${Math.floor(snipeThreshold/1000)}s)`)
            return
          }
          // Sinon attendre le prochain cycle
          return
        } else {
          // Timer au-dessus du seuil - laisser descendre
          return
        }
      }

      // Si bataille terminée et pas de joueur réel, laisser timer descendre
      if (battleEnded) {
        return
      }

      // Comportement normal des bots - délais augmentés pour plus de suspense
      let minDelay: number
      let shouldResetTimer = false

      if (isInFinalPhase) {
        // Phase finale : attendre 25-50s pour laisser le timer descendre bas
        minDelay = 25000 + (getDeterministicSeed(gameId, Math.floor(now / 5000)) % 25000)
        shouldResetTimer = timeLeft <= 90000
      } else if (timeLeft <= 15 * 60 * 1000) {
        minDelay = 40000 + (getDeterministicSeed(gameId, Math.floor(now / 10000)) % 40000)
      } else if (timeLeft <= 30 * 60 * 1000) {
        minDelay = 70000 + (getDeterministicSeed(gameId, Math.floor(now / 15000)) % 50000)
      } else {
        minDelay = 140000 + (getDeterministicSeed(gameId, Math.floor(now / 20000)) % 100000)
      }

      minDelay = minDelay / personality

      if (timeSinceLastClick < minDelay) {
        return
      }

      // Seed pour décision de clic (SYNCHRONISÉ entre clients)
      const clickSeed = getDeterministicSeed(gameId, Math.floor(now / 1000))
      const clickRandom = seededRandom(clickSeed)

      // Probabilité réduite en phase finale (50%) pour plus de suspense
      const clickProbability = isInFinalPhase ? 0.5 : 0.7
      if (clickRandom() > clickProbability) {
        lastClickTimeRef.current = now - minDelay + 3000
        return
      }

      // Générer le clic (username DÉTERMINISTE basé sur timestamp arrondi)
      const roundedTime = Math.floor(now / 1000)
      const username = generateDeterministicUsername(`${gameId}-${roundedTime}-bot`)
      const clickId = `sim-${gameId}-${roundedTime}`

      const simulatedClick: GameClick = {
        id: clickId,
        username,
        clickedAt: new Date().toISOString(),
        isBot: true,
      }

      addClickRef.current(simulatedClick)

      if (shouldResetTimer) {
        optimisticUpdateRef.current({
          end_time: now + 90000,
          last_click_username: username,
        })
      } else {
        optimisticUpdateRef.current({
          last_click_username: username,
        })
      }
      syncBotClickToDb(gameId, username) // Sync to DB for lobby

      lastClickTimeRef.current = now
      lastUsernameRef.current = username

      console.log(`[BOT SIM] ${username} clicked (${currentStatus}, ${Math.floor(timeLeft/1000)}s left)`)

    }, 1000)

    return () => {
      console.log(`[BOT SIM] Stopping simulation for game ${gameId}`)
      clearInterval(intervalId)
    }
  }, [enabled, gameId, status])

  return null
}
