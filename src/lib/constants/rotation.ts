// ============================================
// CONFIGURATION DU SYSTÈME DE ROTATION
// ============================================

// Heures de rotation (heure française/Paris)
// Toutes les 3 heures à partir de minuit
export const ROTATION_HOURS = [0, 3, 6, 9, 12, 15, 18, 21] as const

// Durée avant le start_time pour afficher dans "Bientôt" (en ms)
export const SOON_THRESHOLD = 15 * 60 * 1000 // 15 minutes

// Durée initiale d'un jeu (en ms)
export const DEFAULT_GAME_DURATION = 1 * 60 * 60 * 1000 // 1 heure

// Timezone pour les calculs
export const TIMEZONE = 'Europe/Paris'

/**
 * Calcule la prochaine heure de rotation
 * @returns Date de la prochaine rotation (en UTC)
 */
export function getNextRotationTime(): Date {
  const now = new Date()

  // Obtenir l'heure actuelle à Paris via Intl
  const parisFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = parisFormatter.formatToParts(now)
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0'

  const currentHour = parseInt(getPart('hour'), 10)
  const currentMinutes = parseInt(getPart('minute'), 10)
  const currentDay = parseInt(getPart('day'), 10)
  const currentMonth = parseInt(getPart('month'), 10) - 1 // JS months are 0-indexed
  const currentYear = parseInt(getPart('year'), 10)

  // Trouver la prochaine heure de rotation (strictement supérieure)
  let nextRotationHour = ROTATION_HOURS.find(h => h > currentHour)

  // Si on est EXACTEMENT sur une heure de rotation et dans la première minute
  const isExactlyOnRotation = ROTATION_HOURS.includes(currentHour as typeof ROTATION_HOURS[number]) && currentMinutes < 1
  if (isExactlyOnRotation) {
    nextRotationHour = currentHour as typeof ROTATION_HOURS[number]
  }

  // Si pas de rotation plus tard aujourd'hui, prendre la première de demain
  let isNextDay = nextRotationHour === undefined
  if (isNextDay) {
    nextRotationHour = ROTATION_HOURS[0]
  }

  // Construire la date en heure Paris
  // On crée d'abord la date en UTC puis on ajuste pour Paris
  const targetDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, nextRotationHour!, 0, 0, 0))

  if (isNextDay) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 1)
  }

  // Calculer l'offset Paris (en heures) pour cette date
  // Paris est UTC+1 en hiver, UTC+2 en été
  const parisOffset = getParisOffsetHours(targetDate)

  // Soustraire l'offset pour obtenir l'heure UTC
  // Ex: 15h Paris = 15h - 1h = 14h UTC (en hiver)
  targetDate.setUTCHours(targetDate.getUTCHours() - parisOffset)

  return targetDate
}

/**
 * Obtient l'offset Paris en heures (1 en hiver, 2 en été)
 */
function getParisOffsetHours(date: Date): number {
  // Créer deux strings formatées pour comparer
  const utcString = date.toLocaleString('en-US', { timeZone: 'UTC', hour: '2-digit', hour12: false })
  const parisString = date.toLocaleString('en-US', { timeZone: TIMEZONE, hour: '2-digit', hour12: false })

  const utcHour = parseInt(utcString, 10)
  const parisHour = parseInt(parisString, 10)

  // Gérer le cas où on traverse minuit
  let diff = parisHour - utcHour
  if (diff < -12) diff += 24
  if (diff > 12) diff -= 24

  return diff
}

/**
 * Calcule l'heure de rotation précédente
 * @returns Date de la rotation précédente
 */
export function getPreviousRotationTime(): Date {
  const now = new Date()

  // Obtenir l'heure actuelle à Paris
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const currentHour = parisTime.getHours()

  // Trouver l'heure de rotation précédente
  let prevRotationHour = [...ROTATION_HOURS].reverse().find(h => h <= currentHour)

  // Si pas de rotation avant aujourd'hui, prendre la dernière d'hier
  const isPrevDay = prevRotationHour === undefined
  if (isPrevDay) {
    prevRotationHour = ROTATION_HOURS[ROTATION_HOURS.length - 1]
  }

  // Construire la date de la rotation précédente
  const prevRotation = new Date(parisTime)
  prevRotation.setHours(prevRotationHour!, 0, 0, 0)

  if (isPrevDay) {
    prevRotation.setDate(prevRotation.getDate() - 1)
  }

  // Convertir de Paris vers UTC
  const parisOffset = getParisOffset(prevRotation)
  const utcRotation = new Date(prevRotation.getTime() - parisOffset)

  return utcRotation
}

/**
 * Vérifie si on est dans la fenêtre "Bientôt" (15 min avant une rotation)
 * @param startTime - Le start_time du jeu
 * @returns true si le jeu devrait être visible dans "Bientôt"
 */
export function isInSoonWindow(startTime: Date | number): boolean {
  const now = Date.now()
  const start = typeof startTime === 'number' ? startTime : startTime.getTime()

  const timeUntilStart = start - now

  // Visible si entre 0 et 15 minutes avant le start
  return timeUntilStart > 0 && timeUntilStart <= SOON_THRESHOLD
}

/**
 * Vérifie si un jeu devrait être activé (start_time atteint)
 * @param startTime - Le start_time du jeu
 * @returns true si le jeu devrait passer en 'active'
 */
export function shouldActivateGame(startTime: Date | number): boolean {
  const now = Date.now()
  const start = typeof startTime === 'number' ? startTime : startTime.getTime()

  return now >= start
}

/**
 * Obtient le décalage horaire de Paris (en ms)
 * Prend en compte l'heure d'été/hiver
 */
function getParisOffset(date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const parisDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return parisDate.getTime() - utcDate.getTime()
}

/**
 * Formate une heure de rotation pour affichage
 * @param hour - Heure (0-23)
 * @returns String formatée "HH:00"
 */
export function formatRotationHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

/**
 * Obtient toutes les rotations du jour avec leur statut
 */
export function getTodayRotations(): Array<{
  hour: number
  time: Date
  status: 'passed' | 'current' | 'upcoming'
}> {
  const now = new Date()
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const currentHour = parisTime.getHours()

  return ROTATION_HOURS.map(hour => {
    const rotationTime = new Date(parisTime)
    rotationTime.setHours(hour, 0, 0, 0)

    let status: 'passed' | 'current' | 'upcoming'
    if (hour < currentHour) {
      status = 'passed'
    } else if (hour === currentHour) {
      status = 'current'
    } else {
      status = 'upcoming'
    }

    return { hour, time: rotationTime, status }
  })
}
