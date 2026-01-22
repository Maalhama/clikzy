'use client'

import { useEffect, useRef } from 'react'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import type { GameClick } from './useGame'

/**
 * ============================================
 * SIMULATION FRONTEND DES BOTS CLIKZY v4
 * ============================================
 *
 * Utilise un seed déterministe pour synchroniser
 * les clics entre la page jeu et le lobby.
 */

interface UseBotSimulationProps {
  gameId: string
  endTime: number
  status: string
  battleStartTime: string | null
  lastClickUsername: string | null
  addClick: (click: GameClick) => void
  optimisticUpdate: (update: { end_time?: number; last_click_username?: string }) => void
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

export function useBotSimulation({
  gameId,
  endTime,
  status,
  battleStartTime,
  lastClickUsername,
  addClick,
  optimisticUpdate,
  enabled = true,
}: UseBotSimulationProps) {

  const endTimeRef = useRef(endTime)
  const statusRef = useRef(status)
  const addClickRef = useRef(addClick)
  const optimisticUpdateRef = useRef(optimisticUpdate)
  const lastClickTimeRef = useRef<number>(0)
  const lastUsernameRef = useRef<string | null>(lastClickUsername)
  const personalityRef = useRef(getGamePersonality(gameId))

  useEffect(() => { endTimeRef.current = endTime }, [endTime])
  useEffect(() => { statusRef.current = status }, [status])
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

      // Déterminer le délai minimum (DÉTERMINISTE - même que lobby)
      let minDelay: number
      let shouldResetTimer = false

      if (currentStatus === 'final_phase' || timeLeft <= 60000) {
        minDelay = 8000 + (getDeterministicSeed(gameId, Math.floor(now / 5000)) % 17000)
        shouldResetTimer = true
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

      const clickProbability = currentStatus === 'final_phase' ? 0.9 : 0.7
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
          end_time: now + 60000,
          last_click_username: username,
        })
      } else {
        optimisticUpdateRef.current({
          last_click_username: username,
        })
      }

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
