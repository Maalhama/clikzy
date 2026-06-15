'use server'

import { createClient } from '@/lib/supabase/server'
import { selfExcludedUntil, selfExclusionError } from '@/lib/selfExclusion'

export type CatalogItem = {
  id: string
  name: string
  slot: 'casque' | 'armure' | 'anneau' | 'artefact'
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  emoji: string
  bonusKind: string
  bonusValue: number
}
export type InventoryItem = { inventoryId: string; item: CatalogItem }
export type ChestRow = { id: string; rarity: string; source: string | null }
export type ChestDrop = {
  rewardKind: 'item' | 'credits' | 'xp'
  credits: number
  xp: number
  item: CatalogItem | null
}
export type DropHistoryRow = {
  id: string
  openedAt: string
  rarity: string
  credits: number | null
  item: CatalogItem | null
}
export type Collection = {
  chests: ChestRow[]
  history: DropHistoryRow[]
  inventory: InventoryItem[]
  equipment: Partial<Record<CatalogItem['slot'], InventoryItem>>
  bonuses: { xpPct: number; creditPct: number; dailyClicks: number; chestLuck: number }
  dailyChestAvailable: boolean
}

type Res<T> = { success: boolean; data?: T; error?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toItem(c: any): CatalogItem {
  return { id: c.id, name: c.name, slot: c.slot, rarity: c.rarity, emoji: c.emoji, bonusKind: c.bonus_kind, bonusValue: c.bonus_value ?? 0 }
}

export async function getCollection(): Promise<Res<Collection>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [{ data: chests }, { data: inv }, { data: equip }, { data: prof }, { data: hist }] = await Promise.all([
    sb.from('user_chests').select('id, rarity, source').eq('user_id', user.id).eq('opened', false).order('created_at', { ascending: false }),
    sb.from('user_inventory').select('id, item:items_catalog(*)').eq('user_id', user.id).order('acquired_at', { ascending: false }),
    sb.from('user_equipment').select('slot, inventory_id, item:items_catalog(*)').eq('user_id', user.id),
    sb.from('profiles').select('equip_bonus_pct, equip_credit_bonus_pct, equip_daily_clicks, equip_chest_luck, chest_last_claim_day').eq('id', user.id).single(),
    sb.from('user_chests').select('id, rarity, opened_at, dropped_credits, item:items_catalog(*)').eq('user_id', user.id).eq('opened', true).order('opened_at', { ascending: false }).limit(10),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inventory: InventoryItem[] = ((inv as any[]) || []).filter((r) => r.item).map((r) => ({ inventoryId: r.id, item: toItem(r.item) }))
  const equipment: Collection['equipment'] = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of ((equip as any[]) || [])) {
    if (e.item) equipment[e.slot as CatalogItem['slot']] = { inventoryId: e.inventory_id, item: toItem(e.item) }
  }

  return {
    success: true,
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chests: ((chests as any[]) || []).map((c) => ({ id: c.id, rarity: c.rarity, source: c.source })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: ((hist as any[]) || []).map((h) => ({
        id: h.id,
        openedAt: h.opened_at,
        rarity: h.rarity,
        credits: h.dropped_credits ?? null,
        item: h.item ? toItem(h.item) : null,
      })),
      inventory,
      equipment,
      bonuses: {
        xpPct: prof?.equip_bonus_pct ?? 0,
        creditPct: prof?.equip_credit_bonus_pct ?? 0,
        dailyClicks: prof?.equip_daily_clicks ?? 0,
        chestLuck: prof?.equip_chest_luck ?? 0,
      },
      // jour Paris : le coffre quotidien se réinitialise à minuit Europe/Paris
      dailyChestAvailable:
        (prof?.chest_last_claim_day ?? '') !==
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date()),
    },
  }
}

export async function openChest(chestId: string): Promise<Res<ChestDrop>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // Jeu responsable : un compte en pause ne peut pas ouvrir de coffre (tirage hasard).
  const excl = await selfExcludedUntil(supabase, user.id)
  if (excl) return { success: false, error: selfExclusionError(excl) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('open_chest', { p_chest_id: chestId })
  if (error) return { success: false, error: 'Erreur ouverture' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: r?.reason === 'not_found' ? 'Coffre indisponible' : 'Erreur' }
  return {
    success: true,
    data: {
      rewardKind: r.reward_kind,
      credits: r.credits ?? 0,
      xp: r.xp ?? 0,
      item: r.reward_kind === 'item'
        ? { id: r.item_id, name: r.item_name, slot: r.slot, rarity: r.item_rarity, emoji: r.emoji, bonusKind: r.bonus_kind, bonusValue: r.bonus_value ?? 0 }
        : null,
    },
  }
}

export async function equipItem(inventoryId: string): Promise<Res<{ slot: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('equip_item', { p_inventory_id: inventoryId })
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: r?.reason === 'not_owned' ? 'Item non possédé' : 'Erreur' }
  return { success: true, data: { slot: r.slot } }
}

export async function unequipSlot(slot: string): Promise<Res<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('unequip_slot', { p_slot: slot })
  if (error) return { success: false, error: 'Erreur' }
  return { success: true, data: null }
}

export async function claimDailyChest(): Promise<Res<{ already: boolean; granted: number; rarities: string[] }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('claim_daily_chest', { p_user_id: user.id })
  if (error) return { success: false, error: 'Erreur' }
  const r = Array.isArray(data) ? data[0] : data
  if (!r?.ok) return { success: false, error: 'Erreur' }
  return { success: true, data: { already: !!r.already, granted: r.granted ?? 0, rarities: r.rarities ?? [] } }
}
