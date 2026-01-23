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

  // Check if user already has a referrer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentProfile } = await (supabase as any)
    .from('profiles')
    .select('referred_by, referral_code')
    .eq('id', user.id)
    .single()

  if (currentProfile?.referred_by) {
    return { success: false, error: 'Tu as déjà utilisé un code de parrainage' }
  }

  // Can't use your own code
  if (currentProfile?.referral_code?.toUpperCase() === code.toUpperCase()) {
    return { success: false, error: 'Tu ne peux pas utiliser ton propre code' }
  }

  // Find the referrer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrer } = await (supabase as any)
    .from('profiles')
    .select('id, referral_code, referral_count, referral_credits_earned, credits')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (!referrer) {
    return { success: false, error: 'Code de parrainage introuvable' }
  }

  // Update current user with referrer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateUserError } = await (supabase as any)
    .from('profiles')
    .update({ referred_by: referrer.referral_code })
    .eq('id', user.id)

  if (updateUserError) {
    console.error('Error updating referred_by:', updateUserError)
    return { success: false, error: 'Erreur lors de l\'application du code' }
  }

  // Give bonus credits to referrer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateReferrerError } = await (supabase as any)
    .from('profiles')
    .update({
      credits: (referrer.credits || 0) + REFERRAL_BONUS,
      referral_count: (referrer.referral_count || 0) + 1,
      referral_credits_earned: (referrer.referral_credits_earned || 0) + REFERRAL_BONUS,
    })
    .eq('id', referrer.id)

  if (updateReferrerError) {
    console.error('Error updating referrer:', updateReferrerError)
    // Don't return error - the referral was recorded even if bonus failed
  }

  revalidatePath('/profile')
  return { success: true, creditsAwarded: REFERRAL_BONUS }
}

/**
 * Get referral link for sharing
 */
export async function getReferralLink(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  if (!profile?.referral_code) {
    return null
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clikzy.fr'
  return `${baseUrl}/register?ref=${profile.referral_code}`
}
