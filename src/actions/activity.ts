'use server'

import { createClient } from '@/lib/supabase/server'

/** Marque l'activité du jour du joueur connecté (throttlé côté DB à 1×/jour). */
export async function touchLastActive(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('touch_last_active', { p_user_id: user.id })
  } catch {
    // best-effort, ne jamais bloquer le rendu
  }
}
