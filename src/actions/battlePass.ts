'use server'

import { createClient } from '@/lib/supabase/server'

export type PassState = {
  purchased: boolean
  daysClaimed: number
  claimedTiers: number[]
}

export type PassReward = {
  kind: 'chest' | 'credits' | 'item'
  rarity: string | null
  amount: number | null
  itemId: string | null
  itemName: string | null
}

type Res<T> = { success: boolean; data?: T; error?: string }

/** État du Passe d'Arène pour le mois en cours (Paris). */
export async function getPassState(): Promise<Res<PassState>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_pass_state', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur de chargement' }
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: true,
    data: {
      purchased: !!row?.purchased,
      daysClaimed: Number(row?.days_claimed ?? 0),
      claimedTiers: (row?.claimed_tiers as number[] | null) ?? [],
    },
  }
}

/** Réclame un palier premium (5/10/15/20/25 jours). */
export async function claimPassTier(tier: number): Promise<Res<PassReward>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_pass_tier', {
    p_user_id: user.id,
    p_tier: tier,
  })
  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('pass_not_purchased')) return { success: false, error: 'Passe non acheté' }
    if (msg.includes('tier_locked')) return { success: false, error: 'Palier pas encore atteint' }
    if (msg.includes('duplicate') || msg.includes('pass_tier_claims_pkey')) {
      return { success: false, error: 'Déjà réclamé' }
    }
    return { success: false, error: 'Erreur de réclamation' }
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: true,
    data: {
      kind: row?.reward_kind ?? 'chest',
      rarity: row?.reward_rarity ?? null,
      amount: row?.reward_amount ?? null,
      itemId: row?.reward_item_id ?? null,
      itemName: row?.reward_item_name ?? null,
    },
  }
}
