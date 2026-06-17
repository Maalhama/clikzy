'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Gift } from 'lucide-react'
import { motion } from 'framer-motion'
import { getCollection, claimDailyChest, type Collection, type ChestDrop } from '@/actions/collection'
import { CaseOpeningModal } from '@/components/collection/CaseOpeningModal'
import { NeonChest } from '@/components/collection/NeonChest'
import { RARITY, type Rarity } from '@/components/collection/rarity'

const CHEST_LABEL: Record<string, Rarity> = { common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary' }

/**
 * Modal « Mes coffres » accessible depuis le lobby : récupération des coffres
 * quotidiens + ouverture directe (CaseOpeningModal) sans quitter la page.
 */
export function LobbyChestsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Collection | null>(null)
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState<{ id: string; rarity: string } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await getCollection()
    if (res.success && res.data) setData(res.data)
  }, [])
  useEffect(() => { load() }, [load])

  const onClaimDaily = async () => {
    setBusy(true)
    const res = await claimDailyChest()
    if (res.success && res.data) {
      setFlash(res.data.already
        ? 'Coffres du jour déjà récupérés, reviens après minuit !'
        : `+${res.data.granted} coffres ajoutés !`)
      setTimeout(() => setFlash(null), 3000)
      await load()
    }
    setBusy(false)
  }

  const onReward = (d: ChestDrop) => {
    if (d.rewardKind === 'item' && d.item) setFlash(`${d.item.name} obtenu !`)
    else if (d.rewardKind === 'credits') setFlash(`+${d.credits} crédits !`)
    else setFlash(`+${d.xp} XP !`)
    setTimeout(() => setFlash(null), 3000)
  }

  if (typeof window === 'undefined') return null
  return createPortal(
    <>
      <div role="dialog" aria-modal="true" aria-label="Tes coffres" className="fixed inset-0 max-sm:min-h-[100lvh] z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary p-6"
        >
          <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-10 text-white/55 hover:text-white">
            <X size={20} />
          </button>

          <span className="kicker !text-[0.6rem]">Collection</span>
          <h3 className="mt-2 mb-1 flex items-center gap-2 font-display text-2xl font-semibold text-white">
            <Gift className="h-6 w-6 text-neon-purple" /> Mes coffres
          </h3>

          {flash && (
            <p role="status" className="mb-2 text-sm font-semibold text-success">{flash}</p>
          )}

          {!data ? (
            <div className="h-40 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ) : (
            <>
              {/* Coffres quotidiens */}
              {data.dailyChestAvailable && (
                <button
                  onClick={onClaimDaily}
                  disabled={busy}
                  className="group mb-4 mt-3 flex w-full items-center gap-4 rounded-xl border border-neon-purple/50 bg-gradient-to-r from-neon-purple/15 via-neon-pink/10 to-neon-purple/15 p-3.5 transition-all hover:border-neon-purple disabled:opacity-60"
                  style={{ boxShadow: '0 0 30px -10px rgba(155,92,255,0.5)' }}
                >
                  <span className="transition-transform group-hover:scale-105"><NeonChest rarity="common" size={48} /></span>
                  <span className="flex-1 text-left">
                    <span className="block font-display text-sm font-semibold text-white">3 coffres gratuits t&apos;attendent !</span>
                    <span className="block text-xs text-white/50">Raretés aléatoires, reset à minuit</span>
                  </span>
                  <span className="btn-arena px-4 py-2 text-xs">{busy ? '…' : 'Récupérer'}</span>
                </button>
              )}

              {data.chests.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <span className="opacity-35"><NeonChest rarity="common" size={84} /></span>
                  <p className="text-center text-sm text-white/55">
                    Aucun coffre à ouvrir pour l'instant.<br />
                    <span className="text-white/60">Reviens après minuit</span> pour tes 3 coffres gratuits.
                  </p>
                </div>
              ) : (
                /* Une pile par rareté : clic = ouvre un coffre de la pile */
                <div className="mt-4 flex flex-wrap items-end justify-center gap-4">
                  {(['common', 'rare', 'epic', 'legendary'] as const).map((rar) => {
                    const ids = data.chests.filter((c) => c.rarity === rar).map((c) => c.id)
                    if (ids.length === 0) return null
                    const r = CHEST_LABEL[rar] ?? 'common'
                    return (
                      <button
                        key={rar}
                        onClick={() => setOpening({ id: ids[0], rarity: rar })}
                        className="group relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-transform hover:-translate-y-1.5 hover:scale-[1.04]"
                      >
                        <span className="relative">
                          <NeonChest rarity={rar} size={92} />
                          {ids.length > 1 && (
                            <span className="stat-numeral absolute -right-2.5 -top-2.5 z-20 flex h-7 min-w-7 items-center justify-center rounded-full border border-white/20 bg-bg-primary px-1.5 text-sm text-white shadow-[0_0_10px_rgba(155,92,255,0.5)]">
                              ×{ids.length}
                            </span>
                          )}
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${RARITY[r].text}`}>{RARITY[r].label}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-white/50 transition-colors group-hover:border-neon-purple/50 group-hover:text-white">
                          Ouvrir
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Ouverture du coffre (au-dessus du modal liste) */}
      {opening && (
        <CaseOpeningModal
          chestId={opening.id}
          chestRarity={opening.rarity}
          onClose={() => { setOpening(null); load() }}
          onReward={onReward}
        />
      )}
    </>,
    document.body
  )
}
