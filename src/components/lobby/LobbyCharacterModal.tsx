'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RARITY_HEX, RARITY_LABEL } from '@/lib/cosmetics'
import { createPortal } from 'react-dom'
import { X, Zap, Coins, Sparkles, Dices } from 'lucide-react'
import { motion } from 'framer-motion'
import { useModalA11y } from '@/hooks/useModalA11y'
import { CharacterAvatar } from '@/components/collection/CharacterAvatar'
import { ItemIcon } from '@/components/collection/ItemIcon'
import type { Collection } from '@/actions/collection'

const SLOTS = [
  { key: 'casque', label: 'Casque' },
  { key: 'armure', label: 'Armure' },
  { key: 'anneau', label: 'Anneau' },
  { key: 'artefact', label: 'Artefact' },
] as const


/** Modal personnage du lobby : aperçu du héros équipé + slots + bonus actifs. */
export function LobbyCharacterModal({
  equipment,
  bonuses,
  onClose,
}: {
  equipment: Collection['equipment']
  bonuses?: Collection['bonuses']
  onClose: () => void
}) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  useModalA11y(true, onClose, panelRef)
  const count = SLOTS.filter((s) => equipment[s.key]).length

  if (typeof window === 'undefined') return null
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mon personnage"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm max-sm:min-h-[100lvh]"
    >
      <motion.div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative max-h-[94vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 surface-3 p-4 sm:p-6"
      >
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-10 text-white/55 hover:text-white">
          <X size={20} />
        </button>

        <span className="kicker !text-[0.6rem]">Mon personnage</span>
        <h3 className="mt-1.5 mb-1 font-display text-xl font-semibold text-white sm:text-2xl">Ton héros</h3>
        <p className="mb-3 text-xs text-white/50">
          {count > 0
            ? `${count}/4 emplacement${count > 1 ? 's' : ''} équipé${count > 1 ? 's' : ''}.`
            : 'Aucun équipement — ouvre des coffres pour t\'équiper.'}
        </p>

        {/* Héros */}
        <div className="mb-4 flex justify-center">
          <CharacterAvatar equipment={equipment} size={150} />
        </div>

        {/* Emplacements */}
        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((s) => {
            const eq = equipment[s.key]
            const rarity = eq?.item.rarity ?? null
            const color = rarity ? RARITY_HEX[rarity] : '#ffffff'
            return (
              <div
                key={s.key}
                className="flex items-center gap-2.5 rounded-xl border bg-white/[0.03] px-3 py-2"
                style={{ borderColor: rarity ? `${color}40` : 'rgba(255,255,255,0.08)' }}
              >
                <div className="shrink-0">
                  {eq ? (
                    <ItemIcon itemId={eq.item.id} slot={s.key} rarity={eq.item.rarity} size={30} />
                  ) : (
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-dashed border-white/15 text-white/25 text-xs">+</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[0.6rem] uppercase tracking-wider text-white/55">{s.label}</div>
                  {eq ? (
                    <>
                      <div className="truncate text-xs font-semibold text-white">{eq.item.name}</div>
                      <div className="text-[0.6rem] font-medium" style={{ color }}>{RARITY_LABEL[eq.item.rarity]}</div>
                    </>
                  ) : (
                    <div className="text-xs text-white/35">Vide</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bonus actifs */}
        {bonuses && (bonuses.xpPct > 0 || bonuses.creditPct > 0 || bonuses.dailyClicks > 0 || bonuses.chestLuck > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {bonuses.xpPct > 0 && (
              <span className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-300">
                <Zap className="h-3.5 w-3.5" /> +{bonuses.xpPct}% XP
              </span>
            )}
            {bonuses.creditPct > 0 && (
              <span className="flex items-center gap-1.5 rounded-lg border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-1.5 text-xs text-yellow-300">
                <Coins className="h-3.5 w-3.5" /> +{bonuses.creditPct}% crédits
              </span>
            )}
            {bonuses.dailyClicks > 0 && (
              <span className="flex items-center gap-1.5 rounded-lg border border-neon-pink/25 bg-neon-pink/10 px-2.5 py-1.5 text-xs text-neon-pink">
                <Sparkles className="h-3.5 w-3.5" /> +{bonuses.dailyClicks} clics/j
              </span>
            )}
            {bonuses.chestLuck > 0 && (
              <span className="flex items-center gap-1.5 rounded-lg border border-neon-purple/25 bg-neon-purple/10 px-2.5 py-1.5 text-xs text-neon-purple">
                <Dices className="h-3.5 w-3.5" /> +{bonuses.chestLuck}% chance coffre
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => { onClose(); router.push('/collection') }}
          className="btn-arena mt-5 w-full py-2.5 text-sm"
        >
          Gérer ma collection
        </button>
      </motion.div>
    </div>,
    document.body
  )
}
