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
 * @returns Date de la prochaine rotation
 */
export function getNextRotationTime(): Date {
  const now = new Date()

  // Obtenir l'heure actuelle à Paris
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const currentHour = parisTime.getHours()
  const currentMinutes = parisTime.getMinutes()

  // Trouver la prochaine heure de rotation
  let nextRotationHour = ROTATION_HOURS.find(h => h > currentHour)

  // Si on est dans l'heure de rotation mais pas encore passé, vérifier les minutes
  const currentRotationHour = ROTATION_HOURS.find(h => h === currentHour)
  if (currentRotationHour !== undefined && currentMinutes < 1) {
    // On est dans la minute de la rotation, c'est maintenant
    nextRotationHour = currentRotationHour
  }

  // Si pas de rotation aujourd'hui, prendre la première de demain
  const isNextDay = nextRotationHour === undefined
  if (isNextDay) {
    nextRotationHour = ROTATION_HOURS[0]
  }

  // Construire la date de la prochaine rotation
  const nextRotation = new Date(parisTime)
  nextRotation.setHours(nextRotationHour!, 0, 0, 0)

  if (isNextDay) {
    nextRotation.setDate(nextRotation.getDate() + 1)
  }

  // Convertir de Paris vers UTC
  const parisOffset = getParisOffset(nextRotation)
  const utcRotation = new Date(nextRotation.getTime() - parisOffset)

  return utcRotation
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
