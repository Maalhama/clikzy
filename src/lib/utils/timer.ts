import { FINAL_PHASE_THRESHOLD, FINAL_PHASE_RESET } from './constants'

/**
 * Calculate time left from end timestamp
 * Accepts either a number (ms) or an ISO date string
 */
export function calculateTimeLeft(endTime: number | string): number {
  const endMs = typeof endTime === 'string' ? new Date(endTime).getTime() : endTime
  return Math.max(0, endMs - Date.now())
}

/**
 * Check if game is in final phase (< 1 minute remaining)
 */
export function isInFinalPhase(timeLeft: number): boolean {
  return timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
}

/**
 * Calculate new end time after a click
 * Only resets timer if in final phase
 */
export function calculateNewEndTime(
  currentEndTime: number,
  clicked: boolean
): number {
  const timeLeft = calculateTimeLeft(currentEndTime)

  // If in final phase and valid click, reset to 1 minute
  if (clicked && isInFinalPhase(timeLeft)) {
    return Date.now() + FINAL_PHASE_RESET
  }

  return currentEndTime
}

/**
 * Format milliseconds to display string
 * Shows HH:MM:SS for times > 1 hour
 * Shows MM:SS for times < 1 hour
 */
export function formatTime(ms: number): string {
  if (ms <= 0) return '00:00'

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Format time with more detail for display
 */
export function formatTimeVerbose(ms: number): string {
  if (ms <= 0) return 'Terminé'

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`)
  }
  parts.push(`${seconds}s`)

  return parts.join(' ')
}
