'use client'

import { useEffect, useRef } from 'react'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getDeterministicSeed, getGamePersonality, seededRandom, getBattleProgress } from '@/lib/bots/simulation'
import type { GameClick } from './useGame'

// Logs de simulation visibles uniquement en dev : en prod ils révéleraient
// le fonctionnement des bots dans la console du joueur.
const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') console.log(...args)
}

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

// NOTE : la simulation est désormais PUREMENT VISUELLE (optimisticUpdate local uniquement).
// Plus aucune écriture en base depuis le frontend — le cron backend `bot-clicks` est SEUL
// maître de l'état du jeu (leader, timer, bataille, clôture). Cela supprime la faille de
// l'endpoint /api/games/bot-click (public, sans auth) et garantit un cycle de vie identique
// que quelqu'un regarde ou non.

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
// Helpers déterministes (getDeterministicSeed/getGamePersonality/seededRandom) + bataille
// (getBattleProgress/Duration, constantes) -> module partagé @/lib/bots/simulation.

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

    debugLog(`[BOT SIM] Starting simulation for game ${gameId}, status: ${status}`)

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
      // Délai aléatoire entre 10s et 50s (moyenne ~30s) - FIXE par jeu pour être naturel
      if (hasRealPlayer && isInFinalPhase) {
        // Seuil de snipe FIXE par jeu (ne change pas pendant la partie)
        // Chaque jeu a son propre seuil entre 10s et 50s
        const snipeThresholdSeed = getDeterministicSeed(gameId + '-snipe-threshold', 0)
        // Seuil entre 10s et 50s (10000ms à 50000ms)
        const snipeThreshold = 10000 + (snipeThresholdSeed % 40000)

        // Log le seuil pour debug (à supprimer plus tard)
        if (timeSinceLastClick < 2000) {
          debugLog(`[BOT SIM] Snipe threshold for this game: ${Math.floor(snipeThreshold/1000)}s, timer: ${Math.floor(timeLeft/1000)}s`)
        }

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

          lastClickTimeRef.current = now
          lastUsernameRef.current = username

          debugLog(`[BOT SIM] URGENT SNIPE! ${username} stole at ${Math.floor(timeLeft/1000)}s`)
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
            lastClickTimeRef.current = now
            debugLog(`[BOT SIM] SNIPE! ${username} at ${Math.floor(timeLeft/1000)}s (threshold: ${Math.floor(snipeThreshold/1000)}s)`)
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

      lastClickTimeRef.current = now
      lastUsernameRef.current = username

      debugLog(`[BOT SIM] ${username} clicked (${currentStatus}, ${Math.floor(timeLeft/1000)}s left)`)

    }, 1000)

    return () => {
      debugLog(`[BOT SIM] Stopping simulation for game ${gameId}`)
      clearInterval(intervalId)
    }
  }, [enabled, gameId, status])

  return null
}
