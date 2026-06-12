/**
 * Code parrain en attente — stocké côté client au passage sur /register?ref=CODE,
 * appliqué après la création du compte (email OU OAuth, qui passe par un redirect).
 */
const PENDING_REF_KEY = 'cleekzy-pending-ref'

export function storePendingReferral(code: string) {
  try {
    localStorage.setItem(PENDING_REF_KEY, code.trim().toUpperCase())
  } catch {}
}

export function readPendingReferral(): string | null {
  try {
    return localStorage.getItem(PENDING_REF_KEY)
  } catch {
    return null
  }
}

export function clearPendingReferral() {
  try {
    localStorage.removeItem(PENDING_REF_KEY)
  } catch {}
}
