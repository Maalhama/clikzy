// Helpers déterministes partagés entre useBotSimulation (page de jeu) et
// useLobbyBotSimulation (lobby) — extraits pour supprimer la duplication (audit 2026-06).
// Fonctions PURES et déterministes : extraction sans changement de comportement.
// (shouldBotClickInBattle a divergé entre les deux hooks -> reste local à chacun.)

/** Hash déterministe (gameId + temps arrondi) -> graine entière positive. */
export function getDeterministicSeed(gameId: string, roundedTime: number): number {
  const str = `${gameId}-${roundedTime}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/** « Personnalité » de la partie (densité de bots), 0,70–1,29, déterministe. */
export function getGamePersonality(gameId: string): number {
  const seed = getDeterministicSeed(gameId, 0)
  return 0.7 + (seed % 60) / 100
}

/** Générateur pseudo-aléatoire déterministe (LCG). */
export function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// Bataille (durée limitée de la phase finale)
export const BATTLE_MIN_DURATION = 30 * 60 * 1000 // 30 minutes min
export const BATTLE_MAX_DURATION = 119 * 60 * 1000 // 1h59 max

export function getBattleDuration(gameId: string): number {
  const hash = getDeterministicSeed(gameId + '-battle', 0)
  return BATTLE_MIN_DURATION + (hash % (BATTLE_MAX_DURATION - BATTLE_MIN_DURATION))
}

export function getBattleProgress(gameId: string, battleStartTime: string | null): number {
  if (!battleStartTime) return 0
  const battleStart = new Date(battleStartTime).getTime()
  const elapsed = Date.now() - battleStart
  const totalDuration = getBattleDuration(gameId)
  return Math.min(1.5, elapsed / totalDuration) // Cap à 150% pour éviter des valeurs infinies
}
