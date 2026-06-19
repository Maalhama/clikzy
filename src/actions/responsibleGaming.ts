'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Jeu responsable (#5 audit) : auto-limitation de dépense mensuelle.
// Durcir (définir/baisser) = immédiat. Assouplir (augmenter/retirer) = cooldown 24h.

const LOOSEN_COOLDOWN_MS = 24 * 3600 * 1000

export interface PurchaseLimitState {
  limit: number | null
  canLoosenNow: boolean
  canLoosenAt: string | null
}

export async function getMyPurchaseLimit(): Promise<PurchaseLimitState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { limit: null, canLoosenNow: true, canLoosenAt: null }
  const svc = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (svc as any)
    .from('profiles')
    .select('monthly_purchase_limit, monthly_purchase_limit_updated_at')
    .eq('id', user.id)
    .single()
  const limit = (data?.monthly_purchase_limit ?? null) as number | null
  const updatedAt = (data?.monthly_purchase_limit_updated_at ?? null) as string | null
  if (!updatedAt) return { limit, canLoosenNow: true, canLoosenAt: null }
  const next = new Date(updatedAt).getTime() + LOOSEN_COOLDOWN_MS
  return { limit, canLoosenNow: Date.now() >= next, canLoosenAt: new Date(next).toISOString() }
}

export async function setMyPurchaseLimit(newLimit: number | null): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  if (newLimit != null) {
    if (!Number.isFinite(newLimit) || newLimit < 0) return { success: false, error: 'Montant invalide' }
    if (newLimit > 100000) return { success: false, error: 'Montant trop élevé' }
    newLimit = Math.floor(newLimit)
  }

  const svc = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cur } = await (svc as any)
    .from('profiles')
    .select('monthly_purchase_limit, monthly_purchase_limit_updated_at')
    .eq('id', user.id)
    .single()
  const currentLimit = (cur?.monthly_purchase_limit ?? null) as number | null
  const updatedAt = (cur?.monthly_purchase_limit_updated_at ?? null) as string | null

  // Assouplir = retirer la limite, ou l'augmenter -> soumis au cooldown.
  const isLoosening =
    (newLimit == null && currentLimit != null) ||
    (newLimit != null && currentLimit != null && newLimit > currentLimit)
  if (isLoosening && updatedAt && Date.now() < new Date(updatedAt).getTime() + LOOSEN_COOLDOWN_MS) {
    return { success: false, error: 'Augmenter ou retirer ta limite est possible 24h après ton dernier changement.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from('profiles')
    .update({ monthly_purchase_limit: newLimit, monthly_purchase_limit_updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) {
    console.error('[RESPONSIBLE] setMyPurchaseLimit error:', error)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }
  return { success: true }
}
