'use server'

import { createClient } from '@/lib/supabase/server'
import { validateName } from '@/lib/validation/cleanName'

export type ClanMember = { userId: string; username: string; level: number; xp: number; role: string }
export type MyClan = {
  id: string; name: string; tag: string; description: string | null
  myRole: string; members: ClanMember[]; totalXp: number
}
export type ClanRow = { clanId: string; name: string; tag: string; memberCount: number; totalXp: number; rank: number }
type Res<T> = { success: boolean; data?: T; error?: string }

const REASON: Record<string, string> = {
  already_in_clan: 'Tu es déjà dans un clan',
  bad_name: 'Nom invalide (3 à 24 caractères)',
  bad_tag: 'Tag invalide (2 à 5 lettres/chiffres)',
  name_taken: 'Ce nom est déjà pris',
  tag_taken: 'Ce tag est déjà pris',
  not_found: 'Clan introuvable',
  not_in_clan: 'Tu n’es dans aucun clan',
  not_owner: 'Seul le chef du clan peut faire ça',
  not_in_your_clan: 'Ce joueur n’est pas dans ton clan',
  cannot_kick_self: 'Tu ne peux pas t’exclure toi-même (quitte le clan)',
  already_owner: 'Ce joueur est déjà le chef',
}

/** Clan du joueur courant (avec membres) ou null. */
export async function getMyClan(): Promise<Res<MyClan | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: mine } = await sb.from('clan_members').select('clan_id, role').eq('user_id', user.id).single()
  if (!mine) return { success: true, data: null }

  // Roster via RPC DEFINER (colonnes publiques) : profiles est en RLS own-row,
  // un embed profiles(...) sur le client session renverrait null pour les autres.
  const [{ data: clan }, { data: members }] = await Promise.all([
    sb.from('clans').select('id, name, tag, description').eq('id', mine.clan_id).single(),
    sb.rpc('get_clan_members', { p_clan_id: mine.clan_id }),
  ])
  if (!clan) return { success: true, data: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped: ClanMember[] = (members ?? []).map((m: any) => ({
    userId: m.user_id, username: m.username ?? 'Joueur', level: m.level ?? 1,
    xp: m.xp ?? 0, role: m.role,
  })).sort((a: ClanMember, b: ClanMember) => b.xp - a.xp)

  return {
    success: true,
    data: {
      id: clan.id, name: clan.name, tag: clan.tag, description: clan.description,
      myRole: mine.role, members: mapped, totalXp: mapped.reduce((s, m) => s + m.xp, 0),
    },
  }
}

export async function getClanLeaderboard(limit = 50): Promise<Res<ClanRow[]>> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_clan_leaderboard', { p_limit: limit })
  if (error) return { success: false, error: 'Erreur' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: ClanRow[] = (data ?? []).map((r: any) => ({
    clanId: r.clan_id, name: r.name, tag: r.tag, memberCount: Number(r.member_count), totalXp: Number(r.total_xp), rank: Number(r.rank),
  }))
  return { success: true, data: rows }
}

async function callClanRpc(fn: string, args: Record<string, unknown>): Promise<Res<{ clanId?: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args)
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: REASON[r?.reason] ?? 'Erreur' }
  return { success: true, data: { clanId: r.clan_id } }
}

export async function createClan(name: string, tag: string, description?: string) {
  // Anti-usurpation + profanité sur le nom ET le tag (#4 audit)
  const nameCheck = validateName(name, 'clan')
  if (!nameCheck.ok) return { success: false, error: nameCheck.error }
  const tagCheck = validateName(tag, 'clan')
  if (!tagCheck.ok) return { success: false, error: tagCheck.error }
  return callClanRpc('create_clan', { p_name: name, p_tag: tag, p_desc: description ?? null })
}
export async function joinClan(clanId: string) {
  return callClanRpc('join_clan', { p_clan_id: clanId })
}
export async function leaveClan() {
  return callClanRpc('leave_clan', {})
}
export async function kickClanMember(userId: string) {
  return callClanRpc('kick_clan_member', { p_user_id: userId })
}
export async function transferClanOwnership(userId: string) {
  return callClanRpc('transfer_clan_ownership', { p_user_id: userId })
}
export async function disbandClan() {
  return callClanRpc('disband_clan', {})
}
