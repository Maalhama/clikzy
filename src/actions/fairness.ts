'use server'

import { createClient } from '@/lib/supabase/server'

export type FairnessState = { serverSeedHash: string | null; clientSeed: string | null; nonce: number }
type Res<T> = { success: boolean; data?: T; error?: string }

/** État d'équité courant du joueur (le server_seed reste secret, on n'expose que son hash). */
export async function getFairness(): Promise<Res<FairnessState>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('fair_server_seed_hash, fair_client_seed, fair_nonce')
    .eq('id', user.id)
    .single()
  return {
    success: true,
    data: {
      serverSeedHash: data?.fair_server_seed_hash ?? null,
      clientSeed: data?.fair_client_seed ?? null,
      nonce: data?.fair_nonce ?? 0,
    },
  }
}

/** Tourne le server_seed : révèle l'ancien (vérifiable), en commit un nouveau, reset le nonce. */
export async function rotateFairness(clientSeed: string): Promise<Res<{ oldServerSeed: string; oldHash: string; newHash: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('rotate_fairness', { p_client_seed: clientSeed ?? '' })
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  return { success: true, data: { oldServerSeed: r.old_server_seed, oldHash: r.old_hash, newHash: r.new_hash } }
}
