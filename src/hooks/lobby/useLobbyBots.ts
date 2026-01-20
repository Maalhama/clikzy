'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { generateUniqueUsernames } from '@/lib/bots/usernameGenerator'
import type { GameWithItem } from '@/types/database'

// ============================================
// CONFIGURATION DES BOTS INTELLIGENTS
// ============================================

const BOT_COUNT = 200

// Durée de bataille (avant de laisser quelqu'un gagner)
const MIN_BATTLE_DURATION = 30 * 60 * 1000   // 30 minutes minimum
const MAX_BATTLE_DURATION = 5 * 60 * 60 * 1000 // 5 heures maximum

// Seuils de temps pour le comportement des bots
const FINAL_PHASE_THRESHOLD = 60 * 1000      // < 1 minute = phase finale (bataille intense)
const INTERESTED_THRESHOLD = 5 * 60 * 1000   // < 5 minutes = bots intéressés
const CASUAL_THRESHOLD = 60 * 60 * 1000      // < 1 heure = clics occasionnels
// > 1 heure = très rare, juste pour le fun

// Intervalles de clic selon la phase
const FINAL_PHASE_MIN_INTERVAL = 1000        // Phase finale: 1-58 secondes
const FINAL_PHASE_MAX_INTERVAL = 58000
const INTERESTED_MIN_INTERVAL = 30000        // Intéressé: 30s-1min
const INTERESTED_MAX_INTERVAL = 60000
const CASUAL_MIN_INTERVAL = 180000           // Occasionnel: 3-30 minutes
const CASUAL_MAX_INTERVAL = 1800000
const RARE_MIN_INTERVAL = 1800000            // Rare: 30min-1h
const RARE_MAX_INTERVAL = 3600000

// Probabilités de clic selon la phase
const FINAL_PHASE_CLICK_CHANCE = 0.95        // 95% de chance de cliquer en phase finale
const INTERESTED_CLICK_CHANCE = 0.7          // 70% quand intéressé
const CASUAL_CLICK_CHANCE = 0.3              // 30% occasionnel
const RARE_CLICK_CHANCE = 0.05               // 5% quand beaucoup de temps

// Réponse aux vrais joueurs
const PLAYER_RESPONSE_CHANCE = 0.98          // 98% de chance de répondre à un vrai joueur

// Buffer avant fin du timer
const TIMER_END_BUFFER = 500                 // 500ms de marge avant 00:00

// LocalStorage key
const STORAGE_KEY = 'clikzy_bot_cache'
const CACHE_EXPIRY = 1000 * 60 * 60          // 1 heure

// ============================================
// INTERFACES
// ============================================

interface CachedGameData {
  totalClicks: number
  lastUser: string
  endTime: number
  updatedAt: number
  isRealPlayer?: boolean  // Track if last click was from a real player
}

interface RecentClick {
  id: string
  gameId: string
  username: string
  itemName: string
  timestamp: number
}

interface BotCache {
  games: Record<string, CachedGameData>
  recentClicks: RecentClick[]
  expiry: number
}

interface BattleState {
  startTime: number
  duration: number  // Random duration between MIN and MAX
  ended: boolean
}

// Timing individuel par jeu
interface GameTiming {
  lastClickAt: number
  nextClickDelay: number
}

interface UseLobbyBotsReturn {
  isActive: boolean
}

// ============================================
// CACHE FUNCTIONS
// ============================================

function loadBotCache(): Record<string, CachedGameData> {
  if (typeof window === 'undefined') return {}
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return {}
    const data: BotCache = JSON.parse(cached)
    if (Date.now() > data.expiry) {
      localStorage.removeItem(STORAGE_KEY)
      return {}
    }
    return data.games || {}
  } catch {
    return {}
  }
}

function saveBotCache(gameId: string, gameData: CachedGameData, recentClick?: RecentClick) {
  if (typeof window === 'undefined') return
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    const data: BotCache = cached
      ? JSON.parse(cached)
      : { games: {}, recentClicks: [], expiry: Date.now() + CACHE_EXPIRY }

    if (!data.games) data.games = {}
    if (!data.recentClicks) data.recentClicks = []

    // Update game data
    data.games[gameId] = gameData

    // Add recent click
    if (recentClick) {
      data.recentClicks = [recentClick, ...data.recentClicks].slice(0, 20)
    }

    data.expiry = Date.now() + CACHE_EXPIRY
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useLobbyBots(
  games: GameWithItem[],
  enabled: boolean = true
): UseLobbyBotsReturn {
  const [isActive, setIsActive] = useState(false)

  // Bot usernames
  const botsRef = useRef<string[]>([])

  // Battle state per game (tracks when to let a bot win)
  const battleStatesRef = useRef<Record<string, BattleState>>({})

  // Timing individuel par jeu (chaque jeu a son propre délai)
  const gameTimingsRef = useRef<Record<string, GameTiming>>({})

  // Last bot username per game (to avoid same bot clicking twice)
  const lastBotPerGameRef = useRef<Record<string, string>>({})

  // Interval ref for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Ref to store latest simulateBotClicks (avoids useEffect re-running on every games change)
  const simulateBotClicksRef = useRef<() => void>(() => {})

  // Initialize bot usernames
  useEffect(() => {
    if (botsRef.current.length === 0) {
      botsRef.current = generateUniqueUsernames(BOT_COUNT)
    }
  }, [])

  // Get a random bot username (different from last one for this game)
  const getRandomBot = useCallback((gameId: string): string => {
    const lastBot = lastBotPerGameRef.current[gameId]
    const bots = botsRef.current.filter(b => b !== lastBot)
    const bot = bots[Math.floor(Math.random() * bots.length)]
    lastBotPerGameRef.current[gameId] = bot
    return bot
  }, [])

  // Initialize or get battle state for a game
  const getBattleState = useCallback((gameId: string): BattleState => {
    if (!battleStatesRef.current[gameId]) {
      battleStatesRef.current[gameId] = {
        startTime: 0,
        duration: MIN_BATTLE_DURATION + Math.random() * (MAX_BATTLE_DURATION - MIN_BATTLE_DURATION),
        ended: false,
      }
    }
    return battleStatesRef.current[gameId]
  }, [])

  // Get random delay based on time left
  const getRandomDelay = useCallback((timeLeftMs: number): number => {
    if (timeLeftMs <= FINAL_PHASE_THRESHOLD) {
      return FINAL_PHASE_MIN_INTERVAL + Math.random() * (FINAL_PHASE_MAX_INTERVAL - FINAL_PHASE_MIN_INTERVAL)
    }
    if (timeLeftMs <= INTERESTED_THRESHOLD) {
      return INTERESTED_MIN_INTERVAL + Math.random() * (INTERESTED_MAX_INTERVAL - INTERESTED_MIN_INTERVAL)
    }
    if (timeLeftMs <= CASUAL_THRESHOLD) {
      return CASUAL_MIN_INTERVAL + Math.random() * (CASUAL_MAX_INTERVAL - CASUAL_MIN_INTERVAL)
    }
    return RARE_MIN_INTERVAL + Math.random() * (RARE_MAX_INTERVAL - RARE_MIN_INTERVAL)
  }, [])

  // Get or initialize timing for a game
  const getGameTiming = useCallback((gameId: string, timeLeftMs: number): GameTiming => {
    if (!gameTimingsRef.current[gameId]) {
      // Initialize avec lastClickAt = now pour éviter que tous les jeux cliquent en même temps
      // Chaque jeu attend son propre délai aléatoire avant le premier clic
      const baseDelay = getRandomDelay(timeLeftMs)
      const randomOffset = Math.random() * baseDelay // Décalage aléatoire entre 0 et baseDelay
      gameTimingsRef.current[gameId] = {
        lastClickAt: Date.now(), // Commence maintenant, pas à 0
        nextClickDelay: randomOffset, // Délai initial aléatoire différent pour chaque jeu
      }
    }
    return gameTimingsRef.current[gameId]
  }, [getRandomDelay])

  // Check if battle should end (let someone win)
  const shouldEndBattle = useCallback((gameId: string): boolean => {
    const battle = getBattleState(gameId)
    if (battle.ended) return true
    if (battle.startTime === 0) return false // Battle hasn't started yet

    const battleDuration = Date.now() - battle.startTime
    if (battleDuration >= battle.duration) {
      battle.ended = true
      return true
    }
    return false
  }, [getBattleState])

  // Decide if bot should click based on time left (INTELLIGENCE)
  const shouldBotClick = useCallback((timeLeftMs: number, isResponseToPlayer: boolean): boolean => {
    // ALWAYS respond to real players in final phase (never let them win easily)
    if (isResponseToPlayer && timeLeftMs <= FINAL_PHASE_THRESHOLD) {
      return Math.random() < PLAYER_RESPONSE_CHANCE
    }

    // Phase finale (< 1 minute): très actif
    if (timeLeftMs <= FINAL_PHASE_THRESHOLD) {
      return Math.random() < FINAL_PHASE_CLICK_CHANCE
    }

    // Intéressé (< 5 minutes): actif
    if (timeLeftMs <= INTERESTED_THRESHOLD) {
      return Math.random() < INTERESTED_CLICK_CHANCE
    }

    // Occasionnel (< 1 heure): quelques clics
    if (timeLeftMs <= CASUAL_THRESHOLD) {
      return Math.random() < CASUAL_CLICK_CHANCE
    }

    // Beaucoup de temps (> 1 heure): très rare, juste pour le fun
    return Math.random() < RARE_CLICK_CHANCE
  }, [])

  // Main bot click simulation
  const simulateBotClicks = useCallback(() => {
    if (games.length === 0) return

    const now = Date.now()
    const cachedData = loadBotCache()

    // Process each active game
    games.forEach((game) => {
      // Check cache for the most up-to-date endTime (bots write to cache)
      const cached = cachedData[game.id]
      const effectiveEndTime = cached?.endTime && cached.endTime > game.end_time
        ? cached.endTime
        : game.end_time
      const timeLeft = effectiveEndTime - now

      // Skip games that are truly ended
      if (game.status === 'ended') return

      // For games in final_phase status but with expired timer:
      // This can happen when the database was updated but no bot clicked yet
      // In this case, we should click to "revive" the game
      const isExpiredButShouldBeActive = timeLeft <= TIMER_END_BUFFER && game.status === 'final_phase'

      // Skip only if timer is expired AND game is not supposed to be in final phase
      if (timeLeft <= TIMER_END_BUFFER && !isExpiredButShouldBeActive) return

      // Check if a REAL player clicked recently (we need to respond!)
      const isResponseToPlayer = cached?.isRealPlayer === true && (now - cached.updatedAt) < 10000

      // =============================================
      // TIMING INDIVIDUEL: Chaque jeu a son propre délai
      // =============================================
      const timing = getGameTiming(game.id, timeLeft)
      const timeSinceLastClick = now - timing.lastClickAt

      // Skip if not enough time has passed for THIS game (unless reviving or responding)
      if (!isExpiredButShouldBeActive && !isResponseToPlayer && timeSinceLastClick < timing.nextClickDelay) {
        return // Pas encore le moment pour ce jeu
      }

      // Start battle timer when entering final phase
      const battle = getBattleState(game.id)
      if (timeLeft <= FINAL_PHASE_THRESHOLD && battle.startTime === 0) {
        battle.startTime = now
      }

      // If reviving an expired game, skip all the probability checks - just click!
      if (!isExpiredButShouldBeActive) {
        // Check if battle should end (let someone win)
        // BUT never let a REAL player win - always respond to them
        if (!isResponseToPlayer && shouldEndBattle(game.id)) {
          return // Don't click, let the timer run out
        }

        // INTELLIGENCE: Should bot click now?
        if (!shouldBotClick(timeLeft, isResponseToPlayer)) {
          // Don't update timing - let it try again on next loop
          // Only update timing AFTER a successful click
          return
        }
      }
      // If isExpiredButShouldBeActive, we skip all checks and force a click to revive the game

      // CLICK!
      const botUsername = getRandomBot(game.id)

      // Calculate new end time (reset to 1 minute if in final phase)
      let newEndTime = effectiveEndTime
      if (timeLeft <= FINAL_PHASE_THRESHOLD) {
        newEndTime = now + 60000 // Reset to 1 minute
      }

      // Calculate new total clicks
      const currentTotal = Math.max(
        cached?.totalClicks || 0,
        game.total_clicks || 0
      )
      const newTotal = currentTotal + 1

      // Save to cache
      const gameData: CachedGameData = {
        totalClicks: newTotal,
        lastUser: botUsername,
        endTime: newEndTime,
        updatedAt: now,
        isRealPlayer: false, // This is a bot click
      }

      const recentClick: RecentClick = {
        id: `bot-${now}-${Math.random().toString(36).substr(2, 9)}`,
        gameId: game.id,
        username: botUsername,
        itemName: game.item?.name || 'Item',
        timestamp: now,
      }

      saveBotCache(game.id, gameData, recentClick)

      // Update timing pour ce jeu avec un nouveau délai aléatoire
      const newTimeLeft = timeLeft <= FINAL_PHASE_THRESHOLD ? 60000 : timeLeft
      gameTimingsRef.current[game.id] = {
        lastClickAt: now,
        nextClickDelay: getRandomDelay(newTimeLeft),
      }
    })
  }, [games, getRandomBot, getBattleState, shouldEndBattle, shouldBotClick, getGameTiming, getRandomDelay])

  // Keep ref updated with latest function
  useEffect(() => {
    simulateBotClicksRef.current = simulateBotClicks
  }, [simulateBotClicks])

  // Main loop - check every 200ms
  // Uses ref so it doesn't restart when games change
  useEffect(() => {
    if (!enabled) {
      setIsActive(false)
      return
    }

    setIsActive(true)

    // Check frequently, each game decides individually if it should click
    const MAIN_LOOP_INTERVAL = 200

    // Wrapper that calls the latest function from ref
    const runBots = () => {
      simulateBotClicksRef.current()
    }

    // Start after initial delay
    const startDelay = 500 + Math.random() * 1000
    const startTimeout = setTimeout(() => {
      runBots()
      intervalRef.current = setInterval(runBots, MAIN_LOOP_INTERVAL)
    }, startDelay)

    return () => {
      clearTimeout(startTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled]) // Only depends on enabled, not games or simulateBotClicks

  return { isActive }
}
