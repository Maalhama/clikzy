// SSOT des types DB : on ré-exporte le type GÉNÉRÉ (supabase gen types) au lieu de
// le maintenir à la main (l'ancienne version dérivait du schéma réel et forçait des
// casts `as any`). Pour régénérer après une migration : npm run db:types
export type { Json, Database } from '@/lib/supabase/database.types'
import type { Database } from '@/lib/supabase/database.types'

export type GameStatus = Database['public']['Enums']['game_status']

// Convenience types (dérivés de la source de vérité générée)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Click = Database['public']['Tables']['clicks']['Row']
export type Winner = Database['public']['Tables']['winners']['Row']

// Extended types for frontend
export interface GameWithItem extends Game {
  item: Item
}
