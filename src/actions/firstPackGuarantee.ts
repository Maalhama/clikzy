'use server'

import { createClient } from '@/lib/supabase/server'

export type FirstPackGuaranteeStatus = {
  eligible: boolean
  claimed: boolean
  amount: number
  reason: string
  deadline: string | null
}

type ActionResult<T> = { success: boolean; data?: T; error?: string }

/**
 * Statut de la garantie « 1er pack » (Lot G — confiance). Lecture seule :
 * dit si le joueur peut récupérer l'équivalent crédits de son premier pack
 * (jamais gagné + acheté il y a < 60 j + a joué), ou pourquoi pas.
 */
export async function getFirstPackGuarantee(): Promise<FirstPackGuaranteeStatus | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.rpc as any)('first_pack_guarantee_status')
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    eligible: !!row.eligible,
    claimed: !!row.claimed,
    amount: row.amount ?? 0,
    reason: row.reason ?? 'no_purchase',
    deadline: row.deadline ?? null,
  }
}

/** Réclame le crédit-back du 1er pack (idempotent, 1×/compte, validé serveur). */
export async function claimFirstPackGuarantee(): Promise<ActionResult<{ credited: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_first_pack_guarantee')
  if (error) return { success: false, error: 'Erreur lors de la récupération' }
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.ok) {
    const msg =
      row?.reason === 'already_claimed' ? 'Déjà récupéré'
      : row?.reason === 'has_won' ? 'Tu as déjà remporté un lot — garantie non applicable'
      : row?.reason === 'expired' ? 'La fenêtre de 60 jours est dépassée'
      : row?.reason === 'not_played' ? 'Joue au moins une enchère pour activer la garantie'
      : row?.reason === 'no_purchase' ? 'Aucun pack acheté'
      : 'Indisponible'
    return { success: false, error: msg }
  }
  return { success: true, data: { credited: row.credited ?? 0 } }
}
