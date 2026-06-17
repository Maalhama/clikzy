// Pas de `server-only` : importé par game.ts qui est testé unitairement (le
// guard casse l'import vitest). N'utilise aucun secret — lecture d'une table RLS.

/** Date de fin d'auto-exclusion si elle est ACTIVE, sinon null.
 *  Le joueur en pause ne peut ni jouer ni acheter jusqu'à cette date. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function selfExcludedUntil(supabase: any, userId: string): Promise<Date | null> {
  const { data, error } = await supabase
    .from('user_self_exclusion')
    .select('excluded_until')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    // Fail-CLOSED (jeu responsable / conformité) : si on ne peut PAS vérifier l'exclusion
    // (erreur DB, pooler down…), on bloque l'action quelques minutes plutôt que de laisser
    // passer un joueur potentiellement exclu. Un retry lève le blocage une fois la DB OK.
    console.error('[selfExclusion] vérification impossible, fail-closed:', error.message)
    return new Date(Date.now() + 5 * 60 * 1000)
  }
  if (!data?.excluded_until) return null
  const until = new Date(data.excluded_until)
  return until.getTime() > Date.now() ? until : null
}

/** Message FR standard pour un compte en pause. */
export function selfExclusionError(until: Date): string {
  return `Ton compte est en pause (jeu responsable) jusqu'au ${until.toLocaleDateString('fr-FR')}.`
}
