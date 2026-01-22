'use client'

import { useEffect, useRef } from 'react'
import { generateDeterministicUsername, generateUsername } from '@/lib/bots/usernameGenerator'
import type { GameClick } from './useGame'

/**
 * ============================================
 * SIMULATION FRONTEND DES BOTS CLIKZY v2
 * ============================================
 *
 * Simulation simplifiée et robuste des clics de bots.
 * Utilise un interval au lieu de timeouts chaînés.
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

  const lastClickTimeRef = useRef<number>(Date.now())
  const lastUsernameRef = useRef<string | null>(lastClickUsername)

  // Update ref when lastClickUsername changes
  useEffect(() => {
    lastUsernameRef.current = lastClickUsername
  }, [lastClickUsername])

  useEffect(() => {
    if (!enabled) return
    if (status !== 'active' && status !== 'final_phase') return

    const personality = getGamePersonality(gameId)

    // Interval qui vérifie toutes les secondes si on doit cliquer
    const intervalId = setInterval(() => {
      const now = Date.now()
      const timeLeft = endTime - now

      // Jeu terminé
      if (timeLeft <= 0) {
        return
      }

      const timeSinceLastClick = now - lastClickTimeRef.current

      // Déterminer le délai minimum entre clics selon la phase
      let minDelay: number
      let shouldResetTimer = false

      if (status === 'final_phase' || timeLeft <= 60000) {
        // Phase finale: 3 clics par minute = ~20 secondes entre clics
        // Délai aléatoire entre 8s et 25s
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

      // Ajuster selon la personnalité du jeu
      minDelay = minDelay / personality

      // Vérifier si assez de temps s'est écoulé
      if (timeSinceLastClick < minDelay) {
        return
      }

      // Probabilité de cliquer (pour ajouter de la variance)
      const clickProbability = status === 'final_phase' ? 0.8 : 0.6
      if (Math.random() > clickProbability) {
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
      addClick(simulatedClick)

      // Mettre à jour le state
      if (shouldResetTimer) {
        optimisticUpdate({
          end_time: now + 60000,
          last_click_username: username,
        })
      } else {
        optimisticUpdate({
          last_click_username: username,
        })
      }

      // Mettre à jour les refs
      lastClickTimeRef.current = now
      lastUsernameRef.current = username

      console.log(`[BOT SIM] ${username} clicked (${status}, ${Math.floor(timeLeft/1000)}s left)`)

    }, 1000) // Check toutes les secondes

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, status, gameId, endTime, addClick, optimisticUpdate])

  // Reset lastClickTime quand on entre sur la page
  useEffect(() => {
    // Premier clic plus rapide (2-5 secondes après l'entrée)
    lastClickTimeRef.current = Date.now() - 50000 + Math.random() * 5000
  }, [gameId])

  return null
}
