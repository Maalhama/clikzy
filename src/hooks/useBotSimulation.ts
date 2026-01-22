'use client'

import { useEffect, useRef } from 'react'
import { generateDeterministicUsername, generateUsername } from '@/lib/bots/usernameGenerator'
import type { GameClick } from './useGame'

/**
 * ============================================
 * SIMULATION FRONTEND DES BOTS CLIKZY v3
 * ============================================
 *
 * Simulation robuste avec refs pour éviter les re-renders.
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

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getGamePersonality(gameId: string): number {
  const hash = hashString(gameId + '-personality')
  return 0.7 + (hash % 60) / 100
}

function generateUniqueUsername(excludeUsername: string | null, gameId: string): string {
  const seed = `${gameId}-${Date.now()}-${Math.random()}`
  let username = generateDeterministicUsername(seed)

  if (username === excludeUsername) {
    username = generateUsername()
  }

  return username
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

  // Utiliser des refs pour toutes les valeurs qui changent fréquemment
  const endTimeRef = useRef(endTime)
  const statusRef = useRef(status)
  const addClickRef = useRef(addClick)
  const optimisticUpdateRef = useRef(optimisticUpdate)
  const lastClickTimeRef = useRef<number>(0)
  const lastUsernameRef = useRef<string | null>(lastClickUsername)
  const personalityRef = useRef(getGamePersonality(gameId))

  // Mettre à jour les refs quand les props changent
  useEffect(() => { endTimeRef.current = endTime }, [endTime])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { addClickRef.current = addClick }, [addClick])
  useEffect(() => { optimisticUpdateRef.current = optimisticUpdate }, [optimisticUpdate])
  useEffect(() => { lastUsernameRef.current = lastClickUsername }, [lastClickUsername])

  useEffect(() => {
    if (!enabled) return
    if (status !== 'active' && status !== 'final_phase') return

    console.log(`[BOT SIM] Starting simulation for game ${gameId}, status: ${status}`)

    // Premier clic rapide (3-8 secondes)
    lastClickTimeRef.current = Date.now() - 50000

    // Interval qui vérifie toutes les secondes
    const intervalId = setInterval(() => {
      const now = Date.now()
      const currentEndTime = endTimeRef.current
      const currentStatus = statusRef.current
      const timeLeft = currentEndTime - now

      // Jeu terminé ou status changé
      if (timeLeft <= 0 || (currentStatus !== 'active' && currentStatus !== 'final_phase')) {
        return
      }

      const timeSinceLastClick = now - lastClickTimeRef.current
      const personality = personalityRef.current

      // Déterminer le délai minimum entre clics selon la phase
      let minDelay: number
      let shouldResetTimer = false

      if (currentStatus === 'final_phase' || timeLeft <= 60000) {
        // Phase finale: 3 clics par minute = ~20 secondes entre clics
        minDelay = 8000 + Math.random() * 17000
        shouldResetTimer = true
      } else if (timeLeft <= 15 * 60 * 1000) {
        // Phase active: 1 clic par minute
        minDelay = 40000 + Math.random() * 40000
      } else if (timeLeft <= 30 * 60 * 1000) {
        // Phase building: 1 clic toutes les 1.5 minutes
        minDelay = 70000 + Math.random() * 50000
      } else {
        // Phase positioning: 1 clic toutes les 3 minutes
        minDelay = 140000 + Math.random() * 100000
      }

      // Ajuster selon la personnalité
      minDelay = minDelay / personality

      // Pas encore le moment de cliquer
      if (timeSinceLastClick < minDelay) {
        return
      }

      // Probabilité de cliquer
      const clickProbability = currentStatus === 'final_phase' ? 0.9 : 0.7
      if (Math.random() > clickProbability) {
        // Reset le timer pour réessayer
        lastClickTimeRef.current = now - minDelay + 3000
        return
      }

      // Générer le clic
      const username = generateUniqueUsername(lastUsernameRef.current, gameId)
      const clickId = `sim-${gameId}-${now}-${Math.random().toString(36).substr(2, 6)}`

      const simulatedClick: GameClick = {
        id: clickId,
        username,
        clickedAt: new Date().toISOString(),
        isBot: true,
      }

      // Ajouter au feed
      addClickRef.current(simulatedClick)

      // Mettre à jour le state
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

      // Mettre à jour les refs
      lastClickTimeRef.current = now
      lastUsernameRef.current = username

      console.log(`[BOT SIM] ${username} clicked (${currentStatus}, ${Math.floor(timeLeft/1000)}s left)`)

    }, 1000)

    return () => {
      console.log(`[BOT SIM] Stopping simulation for game ${gameId}`)
      clearInterval(intervalId)
    }
  }, [enabled, gameId, status]) // Seulement gameId et status initial en dépendance

  return null
}
