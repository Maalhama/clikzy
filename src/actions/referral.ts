'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Credits given to referrer when someone signs up with their code
const REFERRAL_BONUS = 10

export interface ReferralStats {
  referralCode: string | null
  referralCount: number
  creditsEarned: number
  referredBy: string | null
}

export interface ReferralResult {
  success: boolean
  error?: string
  creditsAwarded?: number
}

/**
 * Get user's referral stats
 */
export async function getReferralStats(): Promise<ReferralStats | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('referral_code, referral_count, referral_credits_earned, referred_by')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    referralCode: profile.referral_code,
    referralCount: profile.referral_count || 0,
    creditsEarned: profile.referral_credits_earned || 0,
    referredBy: profile.referred_by,
  }
}

/**
 * Apply a referral code to current user (only works once, during first session)
 */
export async function applyReferralCode(code: string): Promise<ReferralResult> {
  if (!code || code.trim().length < 4) {
    return { success: false, error: 'Code invalide' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Application AUTORITATIVE via RPC SECURITY DEFINER : vérifie l'éligibilité
  // (pas déjà parrainé, pas son propre code, code existant) et crédite le PARRAIN
  // atomiquement. earned_credits/referral_count étant verrouillés par le trigger,
  // le client ne peut plus s'auto-créditer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('apply_referral_code', { p_code: code })

  if (error) {
    console.error('Error applying referral code:', error)
    return { success: false, error: 'Erreur lors de l\'application du code' }
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result?.ok) {
    const message =
      result?.reason === 'already_referred' ? 'Tu as déjà utilisé un code de parrainage'
      : result?.reason === 'own_code' ? 'Tu ne peux pas utiliser ton propre code'
      : result?.reason === 'not_found' ? 'Code de parrainage introuvable'
      : 'Erreur lors de l\'application du code'
    return { success: false, error: message }
  }

  revalidatePath('/profile')
  return { success: true, creditsAwarded: result.credits_awarded ?? REFERRAL_BONUS }
}
