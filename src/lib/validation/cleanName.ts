// Validation partagée des noms publics (pseudos, clans) : anti-usurpation (noms
// réservés type "Cleekzy_Support", "Admin") + filtre de profanité basique.
// Audit 2026-06-19 (#4). Utilisé au signup, au changement de pseudo et à la création de clan.

const RESERVED_EXACT = [
  'admin', 'administrateur', 'staff', 'root', 'system', 'systeme',
  'modo', 'moderateur', 'moderator', 'help', 'contact', 'officiel', 'official',
]

// Sous-chaînes interdites (usurpation d'identité de la marque/équipe).
const RESERVED_SUBSTRING = ['cleekzy', 'support', 'moderat', 'officiel']

const PROFANITY = /(connard|conard|salope|salaud|encul\w*|\bfdp\b|\bntm\b|nique\s*ta|\bpd\b|n[ée]gre|bougnoule|\bpute|\bbite\b|couille)/i

export function validateName(raw: string, kind: 'pseudo' | 'clan' = 'pseudo'): { ok: boolean; error?: string } {
  const name = (raw ?? '').trim()
  const lower = name.toLowerCase()

  const reservedHit =
    RESERVED_EXACT.includes(lower) ||
    lower.startsWith('admin') ||
    RESERVED_SUBSTRING.some((r) => lower.includes(r))
  if (reservedHit) {
    return { ok: false, error: kind === 'clan' ? 'Ce nom de clan est réservé.' : 'Ce pseudo est réservé.' }
  }

  if (PROFANITY.test(name)) {
    return { ok: false, error: kind === 'clan' ? 'Ce nom de clan contient des termes interdits.' : 'Ce pseudo contient des termes interdits.' }
  }

  return { ok: true }
}
