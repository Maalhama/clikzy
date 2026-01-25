/**
 * Fraud Detection System
 * Detects suspicious patterns and potential cheating
 */

import { auditLog } from './audit'

// In-memory store for click patterns (use Redis in production)
const clickPatterns = new Map<string, ClickPattern>()

interface ClickPattern {
  userId: string
  clicks: number[]  // timestamps
  gamesClicked: Set<string>
  totalCreditsSpent: number
  lastCleanup: number
}

// Thresholds
const CLICK_RATE_WINDOW = 60 * 1000  // 1 minute window
const MAX_CLICKS_PER_MINUTE = 30     // Max 30 clicks per minute
const MAX_GAMES_PER_MINUTE = 10      // Max 10 different games per minute
const SUSPICIOUS_CLICK_SPEED = 200   // Less than 200ms between clicks
const PATTERN_CLEANUP_INTERVAL = 5 * 60 * 1000 // Cleanup every 5 minutes

export interface FraudCheckResult {
  allowed: boolean
  reason?: string
  riskScore: number  // 0-100, higher = more risky
  flags: string[]
}

/**
 * Check if a click action should be allowed
 */
export function checkClickFraud(
  userId: string,
  gameId: string,
  ip: string
): FraudCheckResult {
  const now = Date.now()
  const flags: string[] = []
  let riskScore = 0

  // Get or create pattern
  let pattern = clickPatterns.get(userId)
  if (!pattern) {
    pattern = {
      userId,
      clicks: [],
      gamesClicked: new Set(),
      totalCreditsSpent: 0,
      lastCleanup: now,
    }
    clickPatterns.set(userId, pattern)
  }

  // Cleanup old data periodically
  if (now - pattern.lastCleanup > PATTERN_CLEANUP_INTERVAL) {
    cleanupPattern(pattern, now)
  }

  // Add current click
  pattern.clicks.push(now)
  pattern.gamesClicked.add(gameId)
  pattern.totalCreditsSpent++

  // Filter to only clicks in the last minute
  const recentClicks = pattern.clicks.filter(t => now - t < CLICK_RATE_WINDOW)

  // Check 1: Click rate
  if (recentClicks.length > MAX_CLICKS_PER_MINUTE) {
    flags.push('excessive_click_rate')
    riskScore += 40
  }

  // Check 2: Games per minute
  if (pattern.gamesClicked.size > MAX_GAMES_PER_MINUTE) {
    flags.push('too_many_games')
    riskScore += 30
  }

  // Check 3: Click speed (time between clicks)
  if (recentClicks.length >= 2) {
    const lastTwo = recentClicks.slice(-2)
    const timeBetween = lastTwo[1] - lastTwo[0]
    if (timeBetween < SUSPICIOUS_CLICK_SPEED) {
      flags.push('inhuman_click_speed')
      riskScore += 50
    }
  }

  // Check 4: Consistent click intervals (bot pattern)
  if (recentClicks.length >= 5) {
    const intervals = []
    for (let i = 1; i < recentClicks.length; i++) {
      intervals.push(recentClicks[i] - recentClicks[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)

    // Very low variance = too consistent = likely bot
    if (stdDev < 50 && avgInterval < 1000) {
      flags.push('bot_like_pattern')
      riskScore += 60
    }
  }

  // Determine if allowed
  const allowed = riskScore < 70

  // Log if suspicious
  if (riskScore >= 30) {
    auditLog(
      riskScore >= 70 ? 'game.fraud_detected' : 'security.suspicious_activity',
      {
        riskScore,
        flags,
        clicksLastMinute: recentClicks.length,
        gamesClicked: pattern.gamesClicked.size,
        gameId,
      },
      {
        userId,
        ip,
        severity: riskScore >= 70 ? 'critical' : 'warning',
      }
    )
  }

  return {
    allowed,
    reason: allowed ? undefined : `Fraud detected: ${flags.join(', ')}`,
    riskScore,
    flags,
  }
}

/**
 * Check for suspicious spending patterns
 */
export function checkSpendingFraud(
  userId: string,
  amount: number,
  ip: string
): FraudCheckResult {
  const flags: string[] = []
  let riskScore = 0

  // Check for unusually high spending in short time
  // This would need a database query in production
  if (amount > 100) {
    flags.push('high_single_purchase')
    riskScore += 20
  }

  // Log if suspicious
  if (riskScore >= 30) {
    auditLog('security.suspicious_activity', {
      type: 'spending',
      amount,
      riskScore,
      flags,
    }, {
      userId,
      ip,
      severity: 'warning',
    })
  }

  return {
    allowed: riskScore < 70,
    reason: riskScore >= 70 ? `Suspicious spending: ${flags.join(', ')}` : undefined,
    riskScore,
    flags,
  }
}

/**
 * Record a successful click for pattern tracking
 */
export function recordClick(userId: string, gameId: string): void {
  const pattern = clickPatterns.get(userId)
  if (pattern) {
    pattern.clicks.push(Date.now())
    pattern.gamesClicked.add(gameId)
  }
}

/**
 * Cleanup old pattern data
 */
function cleanupPattern(pattern: ClickPattern, now: number): void {
  // Keep only clicks from last 5 minutes
  const fiveMinutesAgo = now - 5 * 60 * 1000
  pattern.clicks = pattern.clicks.filter(t => t > fiveMinutesAgo)
  pattern.gamesClicked.clear()
  pattern.lastCleanup = now
}

/**
 * Clear all patterns (for testing)
 */
export function clearPatterns(): void {
  clickPatterns.clear()
}

/**
 * Get current risk level for a user
 */
export function getUserRiskLevel(userId: string): number {
  const pattern = clickPatterns.get(userId)
  if (!pattern) return 0

  const now = Date.now()
  const recentClicks = pattern.clicks.filter(t => now - t < CLICK_RATE_WINDOW)

  let risk = 0
  if (recentClicks.length > MAX_CLICKS_PER_MINUTE * 0.5) risk += 20
  if (recentClicks.length > MAX_CLICKS_PER_MINUTE * 0.8) risk += 30

  return Math.min(100, risk)
}
