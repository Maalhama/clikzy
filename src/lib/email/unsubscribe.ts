import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Lien de désabonnement signé pour les emails de rétention (sans authentification).
 * Le jeton est un HMAC du user_id (clé = CRON_SECRET, déjà présent côté serveur),
 * ce qui empêche de désabonner un compte tiers sans connaître le secret.
 * Si le secret est absent, on ne génère pas de lien (l'email part sans, fail-safe).
 */

const SITE_URL = 'https://cleekzy.com'

function secret(): string | null {
  return process.env.CRON_SECRET || null
}

export function unsubscribeToken(userId: string): string | null {
  const s = secret()
  if (!s) return null
  return createHmac('sha256', s).update(`unsub:${userId}`).digest('hex').slice(0, 32)
}

export function unsubscribeUrl(userId: string): string | null {
  const t = unsubscribeToken(userId)
  if (!t) return null
  return `${SITE_URL}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}`
}

export function verifyUnsubscribe(userId: string, token: string): boolean {
  const expected = unsubscribeToken(userId)
  if (!expected || token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
