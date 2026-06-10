'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Gift, Sparkles, Zap, Coins, MousePointerClick, Clover } from 'lucide-react'
import { getCollection, equipItem, unequipSlot, claimDailyChest, type Collection, type ChestDrop } from '@/actions/collection'
import { RARITY, SLOT_LABEL, SLOT_EMOJI, bonusLabel, type Rarity } from './rarity'
import { CaseOpeningModal } from './CaseOpeningModal'
import { NeonChest } from './NeonChest'
import { ItemIcon } from './ItemIcon'

const SLOTS: Array<Collection['equipment'] extends Partial<Record<infer K, unknown>> ? K : never> = ['casque', 'armure', 'anneau', 'artefact']
const CHEST_LABEL: Record<string, Rarity> = { common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary' }

export function CollectionClient() {
  const [data, setData] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [opening, setOpening] = useState<{ id: string; rarity: string } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await getCollection()
    if (res.success && res.data) setData(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const onReward = (d: ChestDrop) => {
    if (d.rewardKind === 'item' && d.item) setFlash(`${d.item.name} (${RARITY[d.item.rarity].label})`)
    else if (d.rewardKind === 'credits') setFlash(`+${d.credits} crédits`)
    else setFlash(`+${d.xp} XP`)
    setTimeout(() => setFlash(null), 3500)
  }

  // Coffre quotidien : claim puis ouverture immédiate (reset à minuit Paris)
  const onClaimDaily = async () => {
    setBusy('daily')
    const res = await claimDailyChest()
    if (res.success && res.data) {
      if (res.data.already) {
        setFlash('Coffres du jour déjà récupérés — reviens après minuit !')
      } else {
        setFlash(`+${res.data.granted} coffres ajoutés — ouvre-les !`)
      }
      setTimeout(() => setFlash(null), 3500)
      await load()
    }
    setBusy(null)
  }

  const onEquip = async (inventoryId: string) => {
    setBusy(inventoryId); await equipItem(inventoryId); await load(); setBusy(null)
  }
  const onUnequip = async (slot: string) => {
    setBusy('slot-' + slot); await unequipSlot(slot); await load(); setBusy(null)
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-bg-secondary/50" />
  if (!data) return null

  const b = data.bonuses
  const bonusChips = [
    { icon: Zap, label: `+${b.xpPct}% XP`, on: b.xpPct > 0, color: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10' },
    { icon: Coins, label: `+${b.creditPct}% crédits`, on: b.creditPct > 0, color: 'text-yellow-300 border-yellow-400/30 bg-yellow-400/10' },
    { icon: MousePointerClick, label: `+${b.dailyClicks} clics/j`, on: b.dailyClicks > 0, color: 'text-green-300 border-green-400/30 bg-green-400/10' },
    { icon: Clover, label: `+${b.chestLuck}% loot`, on: b.chestLuck > 0, color: 'text-purple-300 border-purple-400/30 bg-purple-400/10' },
  ]

  return (
    <div className="space-y-6">
      {flash && (
        <div role="status" className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-neon-purple/40 bg-neon-purple/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
          {flash}
        </div>
      )}

      {/* Coffres */}
      <section className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-neon-purple" />
          <h2 className="text-lg font-display font-semibold text-white">Coffres</h2>
          <span className="ml-auto text-sm text-white/40">{data.chests.length} à ouvrir</span>
        </div>

        {/* Coffre quotidien gratuit (reset minuit Paris) */}
        {data.dailyChestAvailable && (
          <button
            onClick={onClaimDaily}
            disabled={busy === 'daily'}
            className="group relative mb-4 flex w-full items-center gap-4 overflow-hidden rounded-xl border border-neon-purple/50 bg-gradient-to-r from-neon-purple/15 via-neon-pink/10 to-neon-purple/15 p-4 transition-all hover:border-neon-purple disabled:opacity-60"
            style={{ boxShadow: '0 0 30px -10px rgba(155,92,255,0.5)' }}
          >
            <span className="transition-transform group-hover:scale-105"><NeonChest rarity="common" size={56} /></span>
            <span className="flex-1 text-left">
              <span className="block font-display text-sm font-semibold text-white">Tes 3 coffres du jour sont arrivés !</span>
              <span className="block text-xs text-white/50">3 coffres gratuits par jour, raretés aléatoires — reset à minuit</span>
            </span>
            <span className="btn-arena px-5 py-2 text-xs">
              {busy === 'daily' ? 'Ouverture…' : 'Récupérer'}
            </span>
          </button>
        )}

        {data.chests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="opacity-35"><NeonChest rarity="common" size={84} /></span>
            <p className="text-center text-sm text-white/40">
              Aucun coffre à ouvrir pour l'instant.<br />
              <span className="text-white/60">Reviens après minuit</span> pour tes 3 coffres gratuits — et gagne des parties pour en obtenir plus.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {data.chests.map((c) => {
              const r = CHEST_LABEL[c.rarity] ?? 'common'
              return (
                <button
                  key={c.id}
                  onClick={() => setOpening({ id: c.id, rarity: c.rarity })}
                  className={`group flex flex-col items-center gap-1 rounded-xl border bg-gradient-to-b p-3 transition-transform hover:scale-105 ${RARITY[r].border} ${RARITY[r].bg} ${RARITY[r].glow}`}
                >
                  <span className="transition-transform group-hover:scale-105"><NeonChest rarity={c.rarity} size={64} /></span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${RARITY[r].text}`}>{RARITY[r].label}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Personnage + bonus */}
      <section className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-display font-semibold text-white">Ton personnage</h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {bonusChips.map((c) => (
            <span key={c.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.on ? c.color : 'border-white/10 bg-white/5 text-white/30'}`}>
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SLOTS.map((slot) => {
            const eq = data.equipment[slot]
            return (
              <div key={slot} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">{SLOT_LABEL[slot]}</p>
                {eq ? (
                  <div className={`rounded-lg border bg-gradient-to-b p-2 ${RARITY[eq.item.rarity].border} ${RARITY[eq.item.rarity].bg}`}>
                    <span className="flex justify-center"><ItemIcon itemId={eq.item.id} slot={eq.item.slot} rarity={eq.item.rarity} size={34} /></span>
                    <p className={`mt-1 truncate text-xs font-bold ${RARITY[eq.item.rarity].text}`}>{eq.item.name}</p>
                    <p className="truncate text-[10px] text-white/50">{bonusLabel(eq.item.bonusKind, eq.item.bonusValue)}</p>
                    <button onClick={() => onUnequip(slot)} disabled={busy === 'slot-' + slot} className="mt-2 text-[10px] font-semibold text-white/40 hover:text-white/70">
                      {busy === 'slot-' + slot ? '...' : 'Retirer'}
                    </button>
                  </div>
                ) : (
                  <div className="flex h-[104px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-white/20">
                    <span className="flex justify-center opacity-30"><ItemIcon slot={slot} rarity="common" size={30} /></span>
                    <span className="text-[10px]">Vide</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Inventaire */}
      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-display font-semibold text-white">Inventaire <span className="text-sm font-normal text-white/40">({data.inventory.length})</span></h2>
        {data.inventory.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Ouvre des coffres pour récupérer des pièces d&apos;équipement.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {data.inventory.map((inv) => {
              const equipped = data.equipment[inv.item.slot]?.inventoryId === inv.inventoryId
              return (
                <button
                  key={inv.inventoryId}
                  onClick={() => !equipped && onEquip(inv.inventoryId)}
                  disabled={equipped || busy === inv.inventoryId}
                  title={`${inv.item.name} — ${bonusLabel(inv.item.bonusKind, inv.item.bonusValue)}`}
                  className={`relative flex flex-col items-center gap-0.5 rounded-lg border bg-gradient-to-b p-2 transition-transform ${RARITY[inv.item.rarity].border} ${RARITY[inv.item.rarity].bg} ${equipped ? 'opacity-50' : 'hover:scale-105'}`}
                >
                  {busy === inv.inventoryId ? <Loader2 className="h-7 w-7 animate-spin text-white/60" /> : <ItemIcon itemId={inv.item.id} slot={inv.item.slot} rarity={inv.item.rarity} size={28} />}
                  <span className={`truncate text-[9px] font-semibold ${RARITY[inv.item.rarity].text}`}>{inv.item.name}</span>
                  {equipped && <span className="absolute right-1 top-1 rounded bg-green-500/80 px-1 text-[8px] font-bold text-white">É</span>}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {opening && (
        <CaseOpeningModal
          chestId={opening.id}
          chestRarity={opening.rarity}
          onClose={() => { setOpening(null); load() }}
          onReward={onReward}
        />
      )}
    </div>
  )
}
