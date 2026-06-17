'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Res<T = void> = { success: boolean; data?: T; error?: string }

/**
 * Export RGPD : renvoie l'ensemble des données du joueur connecté (JSON).
 * Droit d'accès / portabilité (art. 15 & 20 RGPD).
 */
export async function exportMyData(): Promise<Res<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const svc = createServiceClient()
  const sb = svc
  const [
    { data: profile }, { data: winners }, { data: purchases }, { data: gifts }, clicksRes,
    { data: comments }, { data: packBuys }, { data: giftsReceived },
    { data: selfExclusion }, { data: miniGamePlays }, { data: badges }, { data: clanMembership },
    { data: gauges }, { data: gaugeWins },
  ] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).single(),
    sb.from('winners').select('item_name, item_value, won_at, shipping_status').eq('user_id', user.id),
    sb.from('buy_it_now_purchases').select('item_name, price_paid, created_at, shipping_status').eq('user_id', user.id),
    sb.from('gift_codes').select('kind, credits, vip_days, created_at, redeemed_at').eq('gifter_id', user.id),
    sb.from('clicks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    sb.from('comments').select('content, game_id, created_at').eq('user_id', user.id),
    sb.from('pack_purchases').select('*').eq('user_id', user.id),
    sb.from('gift_codes').select('kind, credits, vip_days, redeemed_at').eq('redeemed_by', user.id),
    sb.from('user_self_exclusion').select('excluded_until, created_at').eq('user_id', user.id),
    sb.from('mini_game_plays').select('*').eq('user_id', user.id),
    sb.from('user_badges').select('*').eq('user_id', user.id),
    sb.from('clan_members').select('clan_id, role, joined_at').eq('user_id', user.id),
    // Feature jauge (paiement cash) : progression en cours + items obtenus (#305 RGPD).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb as any).from('user_item_gauges').select('item_id, progress, target, completed_count, last_click_at, updated_at').eq('user_id', user.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb as any).from('gauge_wins').select('item_id, paid_credits, shipping_status, created_at').eq('user_id', user.id),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    totalClicks: (clicksRes as { count: number | null }).count ?? 0,
    winners: winners ?? [],
    purchases: purchases ?? [],
    packPurchases: packBuys ?? [],
    giftsSent: gifts ?? [],
    giftsReceived: giftsReceived ?? [],
    comments: comments ?? [],
    miniGamePlays: miniGamePlays ?? [],
    badges: badges ?? [],
    clanMembership: clanMembership ?? [],
    selfExclusion: selfExclusion ?? [],
    gauges: gauges ?? [],
    gaugeWins: gaugeWins ?? [],
    note: "Tes paiements détaillés sont conservés chez notre prestataire Stripe conformément aux obligations comptables.",
  }
  return { success: true, data: JSON.stringify(payload, null, 2) }
}

/**
 * Suppression RGPD (droit à l'effacement, art. 17). Anonymise les enregistrements
 * conservés pour obligation légale (gagnants/achats) PUIS supprime le compte
 * d'authentification (l'email + le profil partent en cascade).
 */
export async function deleteMyAccount(confirmation: string): Promise<Res> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (confirmation.trim().toUpperCase() !== 'SUPPRIMER') {
    return { success: false, error: 'Tape SUPPRIMER pour confirmer.' }
  }

  const svc = createServiceClient()
  const sb = svc
  try {
    // 1) Anonymiser les PII dénormalisées qui survivent à la suppression du profil.
    await sb.from('winners').update({ username: 'Compte supprimé' }).eq('user_id', user.id)
    // games.last_click_username est dénormalisé (pseudo en clair) : on l'anonymise et on
    // coupe la référence pour ne pas bloquer la suppression du profil (#304 PII résiduelle).
    await sb.from('games').update({ last_click_username: 'Compte supprimé', last_click_user_id: null }).eq('last_click_user_id', user.id)
    // 2) Effacer les PII du profil (au cas où la FK ne cascade pas).
    await sb.from('profiles').update({
      username: `deleted_${user.id.slice(0, 8)}`,
      avatar_url: null,
      shipping_firstname: null, shipping_lastname: null,
      shipping_address: null, shipping_address2: null,
      shipping_postal_code: null, shipping_city: null, shipping_phone: null,
    }).eq('id', user.id)
    // 3) Supprimer le compte d'auth (email + login). Cascade le profil si configuré.
    const { error: delErr } = await svc.auth.admin.deleteUser(user.id)
    if (delErr) {
      console.error('[PRIVACY] deleteUser error:', delErr.message)
      return { success: false, error: 'Tes données ont été anonymisées mais la suppression finale a échoué. Contacte le support.' }
    }
    await supabase.auth.signOut()
    return { success: true }
  } catch (e) {
    console.error('[PRIVACY] deleteMyAccount error:', e)
    return { success: false, error: 'Erreur lors de la suppression. Réessaie ou contacte le support.' }
  }
}

/** Jeu responsable : met le compte en pause (auto-exclusion) pour N jours et déconnecte. */
export async function requestSelfExclusion(days: number): Promise<Res<{ until: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (![1, 7, 30, 90].includes(days)) return { success: false, error: 'Durée invalide' }
  // @supabase/ssr 0.5.2 type mal `.rpc(name, args)` sur le client serveur (args
  // résolus à `undefined`), contrairement au client service_role. La fonction et
  // ses args sont validés côté DB : set_self_exclusion(p_days integer).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('set_self_exclusion', { p_days: days })
  if (error) {
    console.error('[PRIVACY] set_self_exclusion error:', error)
    return { success: false, error: 'Erreur lors de la mise en pause.' }
  }
  await supabase.auth.signOut()
  return { success: true, data: { until: data as string } }
}
