import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

// Stats publiques pour « Cleekzy Wrapped » (bilan partageable d'un joueur).
// Client anon direct -> utilisable AUSSI BIEN en server component qu'en route
// edge (opengraph-image). Ne lit que des colonnes publiques (profiles whitelist
// + winners, déjà exposés par le profil public et le mur des gagnants).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface WrappedStats {
  username: string
  avatarUrl: string | null
  level: number
  isVip: boolean
  memberSince: string | null
  daysInArena: number
  totalClicks: number
  totalWins: number
  xp: number
  badges: number
  totalValueWon: number
  bestLot: { name: string; value: number } | null
  title: string
}

/** Titre « personnalité » dérivé du comportement de jeu (touche fun premium). */
function computeTitle(s: { totalClicks: number; totalWins: number; totalValueWon: number }): string {
  if (s.totalWins >= 10) return "Légende de l'arène"
  if (s.totalValueWon >= 500) return 'Chasseur de gros lots'
  if (s.totalWins >= 3) return 'Sniper du dernier clic'
  if (s.totalClicks >= 500) return "L'acharné"
  if (s.totalClicks >= 100) return 'Compétiteur'
  if (s.totalWins >= 1) return 'Premier sang'
  return "Recrue de l'arène"
}

// Mémoïsé par requête : la page Wrapped l'appelle dans generateMetadata ET dans
// le rendu. Sans cache(), les mêmes requêtes Supabase partent deux fois.
export const fetchWrappedStats = cache(async (username: string): Promise<WrappedStats | null> => {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: p } = await sb
    .from('profiles')
    .select('id, username, avatar_url, total_wins, total_clicks, created_at, is_vip, level, xp')
    .eq('username', username)
    .single()
  if (!p) return null

  const [{ count: badges }, { data: wins }] = await Promise.all([
    sb.from('user_badges').select('badge_id', { count: 'exact', head: true }).eq('user_id', p.id),
    sb
      .from('winners')
      .select('item_name, item_value')
      .eq('user_id', p.id)
      .eq('is_bot', false)
      .order('item_value', { ascending: false }),
  ])

  const winRows = (wins ?? []) as { item_name: string | null; item_value: number | null }[]
  const totalValueWon = winRows.reduce((acc, w) => acc + (Number(w.item_value) || 0), 0)
  const best = winRows[0]
  const bestLot = best && best.item_name ? { name: best.item_name, value: Number(best.item_value) || 0 } : null

  const totalClicks = p.total_clicks ?? 0
  const totalWins = p.total_wins ?? 0
  const daysInArena = p.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86_400_000))
    : 0
  const memberSince = p.created_at
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(p.created_at))
    : null

  return {
    username: p.username,
    avatarUrl: p.avatar_url ?? null,
    level: p.level ?? 1,
    isVip: !!p.is_vip,
    memberSince,
    daysInArena,
    totalClicks,
    totalWins,
    xp: p.xp ?? 0,
    badges: badges ?? 0,
    totalValueWon,
    bestLot,
    title: computeTitle({ totalClicks, totalWins, totalValueWon }),
  }
})
