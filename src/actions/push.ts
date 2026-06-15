'use server'

import { createClient } from '@/lib/supabase/server'

type Res<T = null> = { success: boolean; data?: T; error?: string }

/** Enregistre (ou met à jour) l'abonnement push du navigateur courant. */
export async function savePushSubscription(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<Res> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { success: false, error: 'Abonnement invalide' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .upsert(
      { endpoint: sub.endpoint, user_id: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: 'endpoint' }
    )
  if (error) return { success: false, error: 'Erreur d\'enregistrement' }
  return { success: true, data: null }
}

/** Supprime l'abonnement push du navigateur courant. */
export async function removePushSubscription(endpoint: string): Promise<Res> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)
  if (error) return { success: false, error: 'Erreur' }
  return { success: true, data: null }
}
