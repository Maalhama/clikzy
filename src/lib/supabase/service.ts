import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Client Supabase service_role (bypass RLS) — réservé au CODE SERVEUR de confiance
 * (Server Actions, route handlers) APRÈS avoir authentifié/autorisé l'appelant.
 * NE JAMAIS importer dans un composant client : la clé service_role n'est pas
 * exposée (pas de préfixe NEXT_PUBLIC_), donc le helper lève une erreur si appelé
 * dans un contexte sans accès à SUPABASE_SERVICE_ROLE_KEY.
 *
 * Sert à appeler les RPC/écritures réservées au backend (ex: add_mini_game_credits
 * révoqué de `authenticated`, actions admin sur items/winners sans policy RLS).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Configuration Supabase service_role manquante')
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
