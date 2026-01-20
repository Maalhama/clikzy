'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { generateUniqueUsernames } from '@/lib/bots/usernameGenerator'
import { GAME_CONSTANTS } from '@/lib/constants'

// Shared localStorage key with useLobbyBots for synchronization
const STORAGE_KEY = 'clikzy_bot_cache'
const CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour

interface CachedGameData {
  totalClicks: number
  lastUser: string
  endTime: number
  updatedAt: number
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

// Load cached data for a specific game (leader + clicks + endTime)
function loadCachedGameData(gameId: string): { leader: string; clicks: number; endTime: number | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    const data: BotCache = JSON.parse(cached)
    if (Date.now() > data.expiry) return null
    const gameData = data.games[gameId]
    if (!gameData?.lastUser) return null
    return {
      leader: gameData.lastUser,
      clicks: gameData.totalClicks || 0,
      endTime: gameData.endTime || null,
    }
  } catch {
    return null
  }
}

// Save bot click to shared cache (stores ABSOLUTE total clicks for sync with lobby)
function saveBotClickToCache(
  gameId: string,
  username: string,
  newEndTime: number,
  itemName: string,
  absoluteTotalClicks: number // The actual total clicks count to display
) {
  if (typeof window === 'undefined') return
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    let data: BotCache = cached ? JSON.parse(cached) : { games: {}, recentClicks: [], expiry: Date.now() + CACHE_EXPIRY }

    // Ensure recentClicks array exists (for backwards compatibility)
    if (!data.recentClicks) data.recentClicks = []

    const now = Date.now()

    // Update or create game entry with ABSOLUTE click count
    data.games[gameId] = {
      totalClicks: absoluteTotalClicks,
      lastUser: username,
      endTime: newEndTime,
      updatedAt: now,
    }

    // Add to recent clicks (keep last 20)
    const newClick: RecentClick = {
      id: `click-${now}-${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      username,
      itemName,
      timestamp: now,
    }
    data.recentClicks = [newClick, ...data.recentClicks].slice(0, 20)

    // Refresh expiry
    data.expiry = Date.now() + CACHE_EXPIRY

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

interface GameBotClick {
  id: string
  username: string
  timestamp: number
}

interface UseGameBotsOptions {
  gameId: string
  gameEndTime: number
  gameStatus: string
  currentLeader: string | null
  currentTotalClicks: number // Current total clicks count (for sync)
  itemName: string
  onBotClick: (username: string, newEndTime: number) => void
  enabled?: boolean
}

interface UseGameBotsReturn {
  triggerBotResponse: () => void
  lastBotClick: GameBotClick | null
  isActive: boolean
  cachedData: { leader: string; clicks: number; endTime: number | null } | null
}

// ===========================================
// BOT INTELLIGENCE CONFIGURATION
// ===========================================

// Thresholds - when bots become active
const BOT_CASUAL_THRESHOLD = 5 * 60 * 1000        // > 5 min: rare casual clicks
const BOT_ANTICIPATION_THRESHOLD = 2 * 60 * 1000  // 2-5 min: occasional clicks
const BOT_INTERESTED_THRESHOLD = 60 * 1000        // < 2 min: more active
// < 1 min = FINAL_PHASE_THRESHOLD: intense battle

// Intervals based on time remaining
const CASUAL_MIN_INTERVAL = 30000         // 30-60s between checks when > 5 min
const CASUAL_MAX_INTERVAL = 60000
const ANTICIPATION_MIN_INTERVAL = 15000   // 15-30s between clicks when 2-5 min left
const ANTICIPATION_MAX_INTERVAL = 30000
const INTERESTED_MIN_INTERVAL = 5000      // 5-12s between clicks when 1-2 min left
const INTERESTED_MAX_INTERVAL = 12000
const BATTLE_MIN_INTERVAL = 800           // Fast clicks in final phase
const BATTLE_MAX_INTERVAL = 3000
const URGENT_MIN_INTERVAL = 400           // Faster when < 30 seconds
const URGENT_MAX_INTERVAL = 1500
const CRITICAL_MIN_INTERVAL = 200         // Very fast when < 10 seconds
const CRITICAL_MAX_INTERVAL = 800
const FINAL_BURST_INTERVAL = 100          // Super fast in last 3 seconds

// Response to real player - only respond if it makes sense
const PLAYER_RESPONSE_MIN_DELAY = 500
const PLAYER_RESPONSE_MAX_DELAY = 2000

// Battle duration limits (in milliseconds) - for final phase
const MIN_BATTLE_DURATION = 30 * 60 * 1000   // Minimum 30 minutes of battle
const MAX_BATTLE_DURATION = 3 * 60 * 60 * 1000   // Maximum 3 hours of battle

// Fatigue system - bots slow down as battle progresses
const FATIGUE_START_PERCENT = 0.6  // Start slowing down at 60% of battle duration
const MAX_FATIGUE_MULTIPLIER = 8   // At max fatigue, intervals are 8x longer
const MAX_MISS_CHANCE = 0.7        // At max fatigue, 70% chance to "miss" a click

// Chance to skip a click (bots aren't fully committed yet)
const CASUAL_SKIP_CHANCE = 0.85       // 85% chance to skip when > 5 min (rare clicks)
const ANTICIPATION_SKIP_CHANCE = 0.4  // 40% chance to skip when 2-5 min left
const INTERESTED_SKIP_CHANCE = 0.2    // 20% chance to skip when 1-2 min left

/**
 * Hook pour simuler une bataille intelligente entre bots
 * Les bots ne cliquent que quand ça a du sens stratégiquement
 */
export function useGameBots({
  gameId,
  gameEndTime,
  gameStatus,
  currentLeader,
  currentTotalClicks,
  itemName,
  onBotClick,
  enabled = true,
}: UseGameBotsOptions): UseGameBotsReturn {
  const [lastBotClick, setLastBotClick] = useState<GameBotClick | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [battleEnded, setBattleEnded] = useState(false)
  const [cachedData, setCachedData] = useState<{ leader: string; clicks: number; endTime: number | null } | null>(null)

  // Track total clicks internally (to avoid stale closures with rapid bot clicks)
  const totalClicksRef = useRef(currentTotalClicks)
  const botUsernamesRef = useRef<string[]>([])
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const battleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastBotUsernameRef = useRef<string | null>(null)
  const battleStartTimeRef = useRef<number | null>(null)
  const battleDurationRef = useRef<number>(0)

  // Keep totalClicksRef in sync with prop (but only update if prop is higher)
  useEffect(() => {
    if (currentTotalClicks > totalClicksRef.current) {
      totalClicksRef.current = currentTotalClicks
    }
  }, [currentTotalClicks])

  // Initialize bot usernames and load cached data
  useEffect(() => {
    if (botUsernamesRef.current.length === 0) {
      botUsernamesRef.current = generateUniqueUsernames(100)
    }
    // Load cached data from localStorage (synced with lobby)
    const cached = loadCachedGameData(gameId)
    if (cached) {
      lastBotUsernameRef.current = cached.leader
      setCachedData(cached)
      // Sync total clicks from cache if higher
      if (cached.clicks > totalClicksRef.current) {
        totalClicksRef.current = cached.clicks
      }
    }
  }, [gameId])

  // Get a random bot username (different from current leader if possible)
  const getRandomBotUsername = useCallback((excludeUsername?: string | null) => {
    const usernames = botUsernamesRef.current
    let attempts = 0
    let selected = usernames[Math.floor(Math.random() * usernames.length)]

    // Try to pick a different bot (max 5 attempts)
    while (selected === excludeUsername && attempts < 5) {
      selected = usernames[Math.floor(Math.random() * usernames.length)]
      attempts++
    }

    return selected
  }, [])

  // Calculate fatigue level (0 = fresh, 1 = exhausted) - only in final phase
  const getFatigueLevel = useCallback(() => {
    if (!battleStartTimeRef.current || battleDurationRef.current === 0) return 0

    const elapsed = Date.now() - battleStartTimeRef.current
    const targetDuration = battleDurationRef.current

    // No fatigue until FATIGUE_START_PERCENT of battle
    const fatigueStartTime = targetDuration * FATIGUE_START_PERCENT
    if (elapsed < fatigueStartTime) return 0

    // Linear increase from 0 to 1 after fatigue starts
    const fatigueProgress = (elapsed - fatigueStartTime) / (targetDuration - fatigueStartTime)
    return Math.min(1, Math.max(0, fatigueProgress))
  }, [])

  // Get interval based on time remaining - INTELLIGENT intervals
  const getSmartInterval = useCallback((timeLeftMs: number) => {
    let baseInterval: number

    // Final burst - last 3 seconds, ultra fast clicks
    if (timeLeftMs <= 3000 && timeLeftMs > 0) {
      baseInterval = FINAL_BURST_INTERVAL + Math.random() * 200
    }
    // Critical: < 10 seconds
    else if (timeLeftMs <= 10000) {
      baseInterval = CRITICAL_MIN_INTERVAL + Math.random() * (CRITICAL_MAX_INTERVAL - CRITICAL_MIN_INTERVAL)
    }
    // Urgent: < 30 seconds
    else if (timeLeftMs <= 30000) {
      baseInterval = URGENT_MIN_INTERVAL + Math.random() * (URGENT_MAX_INTERVAL - URGENT_MIN_INTERVAL)
    }
    // Final phase: < 1 minute - intense battle
    else if (timeLeftMs <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      baseInterval = BATTLE_MIN_INTERVAL + Math.random() * (BATTLE_MAX_INTERVAL - BATTLE_MIN_INTERVAL)
    }
    // Interested: 1-2 minutes - bots getting serious
    else if (timeLeftMs <= BOT_ANTICIPATION_THRESHOLD) {
      baseInterval = INTERESTED_MIN_INTERVAL + Math.random() * (INTERESTED_MAX_INTERVAL - INTERESTED_MIN_INTERVAL)
    }
    // Anticipation: 2-5 minutes - occasional clicks
    else if (timeLeftMs <= BOT_CASUAL_THRESHOLD) {
      baseInterval = ANTICIPATION_MIN_INTERVAL + Math.random() * (ANTICIPATION_MAX_INTERVAL - ANTICIPATION_MIN_INTERVAL)
    }
    // > 5 minutes - casual rare clicks for fun
    else {
      baseInterval = CASUAL_MIN_INTERVAL + Math.random() * (CASUAL_MAX_INTERVAL - CASUAL_MIN_INTERVAL)
    }

    // Apply fatigue multiplier only in final phase
    if (timeLeftMs <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD && battleStartTimeRef.current) {
      const fatigue = getFatigueLevel()
      const fatigueMultiplier = 1 + (fatigue * (MAX_FATIGUE_MULTIPLIER - 1))
      baseInterval *= fatigueMultiplier
    }

    return baseInterval
  }, [getFatigueLevel])

  // Check if battle should end (let timer run out)
  const shouldEndBattle = useCallback(() => {
    if (!battleStartTimeRef.current) return false

    const battleDuration = Date.now() - battleStartTimeRef.current

    // Random end between MIN and MAX duration
    if (battleDurationRef.current === 0) {
      // Set a random target duration for this battle
      battleDurationRef.current = MIN_BATTLE_DURATION +
        Math.random() * (MAX_BATTLE_DURATION - MIN_BATTLE_DURATION)
    }

    return battleDuration >= battleDurationRef.current
  }, [])

  // Should bot click based on current time? (Intelligence check)
  const shouldBotClick = useCallback((timeLeftMs: number, isResponse: boolean = false) => {
    // Always respond to real players in final phase
    if (isResponse && timeLeftMs <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      return true
    }

    // > 5 minutes: rare casual clicks for fun (15% chance)
    if (timeLeftMs > BOT_CASUAL_THRESHOLD) {
      // Don't respond to players when > 5 min (no point)
      if (isResponse) {
        return false
      }
      return Math.random() > CASUAL_SKIP_CHANCE
    }

    // 2-5 minutes: occasional clicks with skip chance
    if (timeLeftMs > BOT_ANTICIPATION_THRESHOLD) {
      // For responses, still respond sometimes
      if (isResponse) {
        return Math.random() > 0.5 // 50% chance to respond
      }
      return Math.random() > ANTICIPATION_SKIP_CHANCE
    }

    // 1-2 minutes: more active, small skip chance
    if (timeLeftMs > GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      if (isResponse) {
        return Math.random() > 0.2 // 80% chance to respond
      }
      return Math.random() > INTERESTED_SKIP_CHANCE
    }

    // < 1 minute: always active (battle mode)
    return true
  }, [])

  // Execute a bot click
  const executeBotClick = useCallback((forceUsername?: string, isResponse: boolean = false) => {
    const now = Date.now()
    const timeLeft = gameEndTime - now

    // Don't click if game is ended or no time left
    if (timeLeft <= 0 || gameStatus === 'ended') {
      return false
    }

    // INTELLIGENCE CHECK: Should the bot click now?
    if (!shouldBotClick(timeLeft, isResponse)) {
      // Return true to keep the loop going, but don't click
      return true
    }

    // Start battle timer when entering final phase
    if (timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD && !battleStartTimeRef.current) {
      battleStartTimeRef.current = now
      // Random battle duration between 30min and 3h
      battleDurationRef.current = MIN_BATTLE_DURATION +
        Math.random() * (MAX_BATTLE_DURATION - MIN_BATTLE_DURATION)
    }

    // Check if battle should end (let a bot win) - only in final phase
    if (battleStartTimeRef.current && shouldEndBattle()) {
      setBattleEnded(true)
      return false // Stop clicking, let timer run out
    }

    // Fatigue system - chance to "miss" a click (only in final phase, not for responses)
    if (!isResponse && battleStartTimeRef.current && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      const fatigue = getFatigueLevel()
      const missChance = fatigue * MAX_MISS_CHANCE

      if (Math.random() < missChance) {
        // Bot "missed" - didn't click in time
        return true
      }
    }

    // Pick a bot (different from current leader to simulate battle)
    const botUsername = forceUsername || getRandomBotUsername(lastBotUsernameRef.current)
    lastBotUsernameRef.current = botUsername

    // Calculate new end time (reset to 1 minute if in final phase)
    let newEndTime = gameEndTime
    if (timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      newEndTime = now + GAME_CONSTANTS.TIMER_RESET_VALUE
    }

    const botClick: GameBotClick = {
      id: `bot-click-${now}-${Math.random().toString(36).substr(2, 9)}`,
      username: botUsername,
      timestamp: now,
    }

    // Increment total clicks and save to cache with ABSOLUTE count
    totalClicksRef.current += 1
    const newTotalClicks = totalClicksRef.current

    // Save to shared cache (synced with lobby) - includes ABSOLUTE total clicks
    saveBotClickToCache(gameId, botUsername, newEndTime, itemName, newTotalClicks)

    setLastBotClick(botClick)
    onBotClick(botUsername, newEndTime)
    return true
  }, [gameId, gameEndTime, gameStatus, getRandomBotUsername, onBotClick, shouldEndBattle, getFatigueLevel, shouldBotClick, itemName])

  // Trigger bot response after player clicks (to steal the lead back)
  const triggerBotResponse = useCallback(() => {
    if (!enabled || battleEnded) return

    // Clear any existing response timeout
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
    }

    const now = Date.now()
    const timeLeft = gameEndTime - now

    // Don't respond if game is ended
    if (timeLeft <= 0 || gameStatus === 'ended') {
      return
    }

    // INTELLIGENCE: Don't respond if > 5 minutes left (no point)
    if (timeLeft > BOT_CASUAL_THRESHOLD) {
      return
    }

    // Quick response to steal lead back from real player
    const delay = PLAYER_RESPONSE_MIN_DELAY + Math.random() * (PLAYER_RESPONSE_MAX_DELAY - PLAYER_RESPONSE_MIN_DELAY)

    responseTimeoutRef.current = setTimeout(() => {
      executeBotClick(undefined, true) // isResponse = true
    }, delay)
  }, [enabled, battleEnded, gameEndTime, gameStatus, executeBotClick])

  // Main bot activity loop - intelligent clicking
  useEffect(() => {
    if (!enabled || gameStatus === 'ended' || battleEnded) {
      setIsActive(false)
      return
    }

    setIsActive(true)

    const runBotLoop = () => {
      const now = Date.now()
      const timeLeft = gameEndTime - now

      // Game ended or battle ended
      if (timeLeft <= 0 || gameStatus === 'ended' || battleEnded) {
        return
      }

      // Execute bot click (may or may not actually click based on intelligence)
      const shouldContinue = executeBotClick()

      // Schedule next check/click
      if (shouldContinue) {
        const nextInterval = getSmartInterval(timeLeft)
        battleTimeoutRef.current = setTimeout(runBotLoop, nextInterval)
      }
    }

    // Start loop after initial delay
    const startDelay = 500 + Math.random() * 1000
    battleTimeoutRef.current = setTimeout(runBotLoop, startDelay)

    return () => {
      if (battleTimeoutRef.current) {
        clearTimeout(battleTimeoutRef.current)
      }
    }
  }, [enabled, gameEndTime, gameStatus, battleEnded, executeBotClick, getSmartInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current)
      }
      if (battleTimeoutRef.current) {
        clearTimeout(battleTimeoutRef.current)
      }
    }
  }, [])

  return {
    triggerBotResponse,
    lastBotClick,
    isActive,
    cachedData,
  }
}
