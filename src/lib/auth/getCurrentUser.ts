import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Récupère l'utilisateur courant en validant le JWT (auth.getUser).
 *
 * Mémoïsé par requête via React `cache()` : le layout `(main)` ET la page rendue
 * en dessous l'appellent tous les deux, mais un seul aller-retour réseau de
 * validation du token est effectué par requête. Sans ça, chaque niveau revalide
 * le JWT auprès de Supabase Auth.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
