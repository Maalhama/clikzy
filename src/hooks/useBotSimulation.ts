'use client'

import { useEffect, useRef, useCallback } from 'react'
import { generateDeterministicUsername, generateUsername } from '@/lib/bots/usernameGenerator'
import type { GameClick } from './useGame'

/**
 * ============================================
 * SIMULATION FRONTEND DES BOTS CLIKZY
 * ============================================
 *
 * Ce hook simule les clics de bots VISUELLEMENT côté client.
 * Les vrais clics sont enregistrés par le cron backend.
 *
 * Avantages:
 * - Expérience temps réel fluide
 * - Pas de dépendance au timing du cron
 * - Synchronisation automatique avec le backend via Realtime
 */

// ============================================
// TYPES
// ============================================

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

interface ScheduledClick {
  id: string
  username: string
  scheduledAt: number
  timeoutId: NodeJS.Timeout
}

// ============================================
// FONCTIONS UTILITAIRES (même logique que backend)
// ============================================

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getBattleDuration(gameId: string): number {
  const hash = hashString(gameId)
  const minMs = 30 * 60 * 1000   // 30 min
  const maxMs = 119 * 60 * 1000  // 1h59
  return minMs + (hash % (maxMs - minMs))
}

function getGamePersonality(gameId: string): number {
  const hash = hashString(gameId + '-personality')
  return 0.7 + (hash % 60) / 100  // 0.70 à 1.30
}

/**
 * Détermine le prochain clic de bot selon la phase du jeu
 */
function getNextClickDelay(
  timeLeftMs: number,
  gamePersonality: number,
  battleStartTime: Date | null,
  battleDuration: number
): { delay: number; shouldClick: boolean; reason: string } {

  // ============ PHASE FINALE (< 1 minute) ============
  if (timeLeftMs <= 60000 && timeLeftMs > 0) {

    // Vérifier si bataille en cours
    if (battleStartTime) {
      const battleElapsed = Date.now() - battleStartTime.getTime()
      const battleProgress = battleElapsed / battleDuration

      // Bataille terminée → pas de clic, laisser finir
      if (battleElapsed >= battleDuration) {
        return { delay: 0, shouldClick: false, reason: 'battle_ended' }
      }

      // Derniers 10% de la bataille → clics réduits
      if (battleProgress > 0.9) {
        const reduction = (battleProgress - 0.9) * 10
        const clickChance = 1 - reduction * 0.8

        if (Math.random() > clickChance) {
          return { delay: 0, shouldClick: false, reason: 'winding_down' }
        }
      }
    }

    // Phase finale active: 3 clics par minute = 1 clic toutes les ~20 secondes
    // Mais espacés aléatoirement entre 5s et 25s
    const baseDelay = 5000 + Math.random() * 20000
    return { delay: baseDelay * (1 / gamePersonality), shouldClick: true, reason: 'final_phase' }
  }

  // ============ PHASE ACTIVE (15min → 1min) ============
  if (timeLeftMs <= 15 * 60 * 1000) {
    // 1 clic par minute en moyenne
    const probability = 1.0 * gamePersonality
    if (Math.random() < probability) {
      const delay = 30000 + Math.random() * 60000 // 30s à 90s
      return { delay, shouldClick: true, reason: 'active_phase' }
    }
    return { delay: 0, shouldClick: false, reason: 'active_skip' }
  }

  // ============ PHASE BUILDING (30min → 15min) ============
  if (timeLeftMs <= 30 * 60 * 1000) {
    // 1 clic toutes les 1.5 minutes
    const probability = 0.67 * gamePersonality
    if (Math.random() < probability) {
      const delay = 60000 + Math.random() * 90000 // 60s à 150s
      return { delay, shouldClick: true, reason: 'building_phase' }
    }
    return { delay: 0, shouldClick: false, reason: 'building_skip' }
  }

  // ============ PHASE POSITIONING (1h → 30min) ============
  if (timeLeftMs <= 60 * 60 * 1000) {
    // 1 clic toutes les 3 minutes
    const probability = 0.33 * gamePersonality
    if (Math.random() < probability) {
      const delay = 120000 + Math.random() * 180000 // 2min à 5min
      return { delay, shouldClick: true, reason: 'positioning_phase' }
    }
    return { delay: 0, shouldClick: false, reason: 'positioning_skip' }
  }

  // ============ TRÈS TÔT (> 1h) ============
  const probability = 0.05 * gamePersonality
  if (Math.random() < probability) {
    const delay = 180000 + Math.random() * 300000 // 3min à 8min
    return { delay, shouldClick: true, reason: 'early_rare' }
  }

  return { delay: 0, shouldClick: false, reason: 'early_skip' }
}

/**
 * Génère un username unique différent du dernier
 */
function generateUniqueUsername(excludeUsername: string | null, gameId: string, timestamp: number): string {
  const seed = `${gameId}-${timestamp}-sim`
  let username = generateDeterministicUsername(seed)

  let attempts = 0
  while (username === excludeUsername && attempts < 10) {
    username = generateDeterministicUsername(`${seed}-${attempts}`)
    attempts++
  }

  if (username === excludeUsername) {
    username = generateUsername()
  }

  return username
}

// ============================================
// HOOK PRINCIPAL
// ============================================

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

  const scheduledClicksRef = useRef<ScheduledClick[]>([])
  const lastClickUsernameRef = useRef(lastClickUsername)
  const isSimulatingRef = useRef(false)

  // Update ref when lastClickUsername changes (from real clicks)
  useEffect(() => {
    lastClickUsernameRef.current = lastClickUsername
  }, [lastClickUsername])

  /**
   * Planifie un clic de bot simulé
   */
  const scheduleClick = useCallback((delay: number) => {
    if (!enabled || status === 'ended') return

    const now = Date.now()
    const clickTime = now + delay
    const clickId = `sim-${gameId}-${clickTime}-${Math.random().toString(36).substr(2, 9)}`

    const timeoutId = setTimeout(() => {
      // Vérifier que le jeu n'est pas terminé
      const currentTimeLeft = endTime - Date.now()
      if (currentTimeLeft <= 0 || status === 'ended') {
        return
      }

      // Générer le username
      const username = generateUniqueUsername(
        lastClickUsernameRef.current,
        gameId,
        Date.now()
      )

      // Créer le clic simulé
      const simulatedClick: GameClick = {
        id: clickId,
        username,
        clickedAt: new Date().toISOString(),
        isBot: true,
      }

      // Ajouter au feed
      addClick(simulatedClick)

      // Mettre à jour le leader et le timer si en phase finale
      const timeLeft = endTime - Date.now()
      if (timeLeft <= 60000 && timeLeft > 0) {
        // Reset timer à 60s en phase finale
        optimisticUpdate({
          end_time: Date.now() + 60000,
          last_click_username: username,
        })
      } else {
        optimisticUpdate({
          last_click_username: username,
        })
      }

      // Mettre à jour la ref
      lastClickUsernameRef.current = username

      // Retirer des clics planifiés
      scheduledClicksRef.current = scheduledClicksRef.current.filter(
        c => c.id !== clickId
      )

      // Planifier le prochain clic
      scheduleNextClick()
    }, delay)

    // Ajouter aux clics planifiés
    scheduledClicksRef.current.push({
      id: clickId,
      username: '',
      scheduledAt: clickTime,
      timeoutId,
    })
  }, [enabled, status, endTime, gameId, addClick, optimisticUpdate])

  /**
   * Planifie le prochain clic basé sur la phase actuelle
   */
  const scheduleNextClick = useCallback(() => {
    if (!enabled || status === 'ended' || isSimulatingRef.current === false) return

    const now = Date.now()
    const timeLeft = endTime - now

    if (timeLeft <= 0) return

    const gamePersonality = getGamePersonality(gameId)
    const battleDuration = getBattleDuration(gameId)
    const battleStart = battleStartTime ? new Date(battleStartTime) : null

    const { delay, shouldClick, reason } = getNextClickDelay(
      timeLeft,
      gamePersonality,
      battleStart,
      battleDuration
    )

    if (shouldClick && delay > 0) {
      // S'assurer que le clic arrive avant la fin du timer
      const safeDelay = Math.min(delay, timeLeft - 1000)
      if (safeDelay > 0) {
        scheduleClick(safeDelay)
      }
    } else {
      // Réessayer dans quelques secondes
      const retryDelay = Math.min(5000, timeLeft / 2)
      if (retryDelay > 1000) {
        setTimeout(scheduleNextClick, retryDelay)
      }
    }
  }, [enabled, status, endTime, gameId, battleStartTime, scheduleClick])

  /**
   * Démarrer la simulation
   */
  const startSimulation = useCallback(() => {
    if (isSimulatingRef.current) return
    if (status === 'ended') return

    isSimulatingRef.current = true

    // Petit délai initial aléatoire pour éviter les clics immédiats
    const initialDelay = 2000 + Math.random() * 5000
    setTimeout(scheduleNextClick, initialDelay)
  }, [status, scheduleNextClick])

  /**
   * Arrêter la simulation
   */
  const stopSimulation = useCallback(() => {
    isSimulatingRef.current = false

    // Annuler tous les clics planifiés
    scheduledClicksRef.current.forEach(click => {
      clearTimeout(click.timeoutId)
    })
    scheduledClicksRef.current = []
  }, [])

  // Démarrer/arrêter la simulation selon le status
  useEffect(() => {
    if (enabled && (status === 'active' || status === 'final_phase')) {
      startSimulation()
    } else {
      stopSimulation()
    }

    return () => {
      stopSimulation()
    }
  }, [enabled, status, startSimulation, stopSimulation])

  // Replanifier quand endTime change (nouveau clic réel reçu)
  useEffect(() => {
    if (!enabled || status === 'ended') return

    // Annuler les clics planifiés trop tard
    const now = Date.now()
    scheduledClicksRef.current = scheduledClicksRef.current.filter(click => {
      if (click.scheduledAt > endTime) {
        clearTimeout(click.timeoutId)
        return false
      }
      return true
    })

    // Replanifier si nécessaire
    if (scheduledClicksRef.current.length === 0 && isSimulatingRef.current) {
      scheduleNextClick()
    }
  }, [endTime, enabled, status, scheduleNextClick])

  return {
    startSimulation,
    stopSimulation,
    isSimulating: isSimulatingRef.current,
    scheduledClicks: scheduledClicksRef.current.length,
  }
}
