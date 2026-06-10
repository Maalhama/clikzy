'use client'

import { useCallback, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { openChest, type ChestDrop } from '@/actions/collection'
import { RARITY, bonusLabel, type Rarity } from './rarity'

const CHEST_RARITY: Record<string, Rarity> = { common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary' }

// Couleur signature du jet de lumière par rareté de coffre
const BURST: Record<Rarity, string> = {
  common: '#B9C2D8',
  rare: '#3CCBFF',
  epic: '#9B5CFF',
  legendary: '#FFD700',
  mythic: '#FF4FD8',
}

// Couleur de la récompense révélée
function dropColor(d: ChestDrop): string {
  if (d.rewardKind === 'credits') return '#FFD700'
  if (d.rewardKind === 'xp') return '#3CCBFF'
  return BURST[(d.item?.rarity ?? 'common') as Rarity]
}

/**
 * Ouverture de coffre « arcade » : un vrai coffre néon (CSS pur) qui tremble,
 * s'ouvre avec un jet de lumière à la couleur de la rareté, et la récompense
 * jaillit au centre. Le drop reste 100% serveur (open_chest DEFINER).
 */
export function CaseOpeningModal({
  chestId, chestRarity, onClose, onReward,
}: {
  chestId: string
  chestRarity: string
  onClose: () => void
  onReward: (drop: ChestDrop) => void
}) {
  const [phase, setPhase] = useState<'chest' | 'opening' | 'revealed' | 'error'>('chest')
  const [drop, setDrop] = useState<ChestDrop | null>(null)
  const startedRef = useRef(false)

  const cr = CHEST_RARITY[chestRarity] ?? 'common'
  const burst = BURST[cr]
  const rewardColor = drop ? dropColor(drop) : burst

  const open = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    setPhase('opening')
    const res = await openChest(chestId)
    if (!res.success || !res.data) { setPhase('error'); return }
    setDrop(res.data)
    // tremblement (500ms) puis ouverture + burst, puis révélation
    setTimeout(() => {
      onReward(res.data!)
      setPhase('revealed')
    }, 1400)
  }, [chestId, onReward])

  const lidOpen = phase === 'revealed' || (phase === 'opening' && drop !== null)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      {/* Flash plein écran à l'ouverture */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-[101]"
            style={{ background: `radial-gradient(ellipse at center, ${burst}66, transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary p-6">
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-20 text-white/40 hover:text-white">
          <X size={20} />
        </button>

        <p className="mb-1 text-center font-display text-[0.6rem] font-semibold uppercase tracking-[0.3em]" style={{ color: burst }}>
          Coffre {RARITY[cr].label}
        </p>
        <h3 className="mb-6 text-center font-display text-xl font-semibold text-white">
          {phase === 'revealed' ? 'Récompense obtenue !' : 'Ouverture du coffre'}
        </h3>

        {phase === 'error' && (
          <p role="alert" className="py-12 text-center text-danger">Ce coffre n&apos;est plus disponible.</p>
        )}

        {phase !== 'error' && (
          <div className="relative flex min-h-[330px] flex-col items-center justify-end pb-6">

            {/* Récompense révélée — jaillit du coffre vers le centre */}
            <AnimatePresence>
              {phase === 'revealed' && drop && (
                <motion.div
                  key="reward"
                  initial={{ opacity: 0, y: 110, scale: 0.25 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.05 }}
                  className="absolute left-1/2 top-2 z-10 -translate-x-1/2 text-center"
                  style={{ x: '-50%' }}
                >
                  {/* halo tournant derrière la récompense */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
                    style={{ background: `radial-gradient(circle, ${rewardColor}AA, transparent 70%)` }}
                  />
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-2xl border bg-bg-primary/80 px-8 py-5 backdrop-blur-sm"
                    style={{ borderColor: `${rewardColor}88`, boxShadow: `0 0 40px -6px ${rewardColor}` }}
                  >
                    {drop.rewardKind === 'item' && drop.item && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-6xl drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">{drop.item.emoji}</span>
                        <span className="font-display text-lg font-semibold" style={{ color: rewardColor }}>{drop.item.name}</span>
                        <span className="text-xs uppercase tracking-wider text-white/50">
                          {RARITY[drop.item.rarity].label} · {bonusLabel(drop.item.bonusKind, drop.item.bonusValue)}
                        </span>
                      </div>
                    )}
                    {drop.rewardKind === 'credits' && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-6xl">💰</span>
                        <span className="stat-numeral text-2xl text-yellow-300">+{drop.credits} crédits</span>
                      </div>
                    )}
                    {drop.rewardKind === 'xp' && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-6xl">⚡</span>
                        <span className="stat-numeral text-2xl text-cyan-300">+{drop.xp} XP</span>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Jet de lumière qui s'échappe du coffre */}
            <AnimatePresence>
              {lidOpen && (
                <motion.div
                  key="beam"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: phase === 'revealed' ? 0.5 : 1, scaleY: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute bottom-[110px] left-1/2 h-56 w-40 origin-bottom -translate-x-1/2"
                  style={{
                    x: '-50%',
                    clipPath: 'polygon(38% 100%, 62% 100%, 100% 0%, 0% 0%)',
                    background: `linear-gradient(to top, ${burst}E6, ${burst}55 55%, transparent)`,
                    filter: 'blur(6px)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Particules qui s'échappent */}
            <AnimatePresence>
              {lidOpen && (
                <div className="pointer-events-none absolute bottom-[150px] left-1/2 z-10" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i / 12) * Math.PI - Math.PI // -180° → 0° (vers le haut)
                    const dist = 90 + (i % 3) * 45
                    return (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 0, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40, scale: 0.2 }}
                        transition={{ duration: 0.9 + (i % 4) * 0.18, ease: 'easeOut', delay: 0.05 + (i % 5) * 0.04 }}
                        className="absolute h-2 w-2 rounded-full"
                        style={{ background: i % 3 === 0 ? '#fff' : burst, boxShadow: `0 0 10px ${burst}` }}
                      />
                    )
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* LE COFFRE (CSS pur, perspective pour le couvercle) */}
            <motion.div
              animate={
                phase === 'opening' && !drop
                  ? { x: [0, -5, 5, -4, 4, -2, 2, 0], rotate: [0, -1.5, 1.5, -1, 1, 0] }
                  : phase === 'revealed'
                  ? { scale: 0.92, y: 8 }
                  : { y: [0, -7, 0] }
              }
              transition={
                phase === 'opening' && !drop
                  ? { duration: 0.5, repeat: Infinity }
                  : phase === 'revealed'
                  ? { duration: 0.4 }
                  : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
              }
              className="relative"
              style={{ perspective: 600, opacity: phase === 'revealed' ? 0.65 : 1 }}
            >
              {/* lueur sous le coffre */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-full blur-2xl"
                style={{ background: `radial-gradient(ellipse at center 70%, ${burst}55, transparent 70%)` }}
              />

              {/* Couvercle */}
              <motion.div
                animate={lidOpen ? { rotateX: -115 } : { rotateX: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                className="relative z-10 h-12 w-44 origin-bottom rounded-t-2xl border-2 border-b-0"
                style={{
                  transformStyle: 'preserve-3d',
                  borderColor: burst,
                  background: `linear-gradient(180deg, #1E2942, #141B2D)`,
                  boxShadow: `0 0 18px -4px ${burst}, inset 0 2px 0 ${burst}44`,
                }}
              >
                {/* bande centrale du couvercle */}
                <div className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 border-x-2" style={{ borderColor: `${burst}88`, background: `${burst}1A` }} />
              </motion.div>

              {/* Corps du coffre */}
              <div
                className="relative h-[88px] w-44 rounded-b-2xl border-2 border-t-0"
                style={{
                  borderColor: burst,
                  background: `linear-gradient(180deg, #141B2D, #0B0F1A)`,
                  boxShadow: `0 0 24px -6px ${burst}`,
                }}
              >
                {/* intérieur lumineux visible quand ouvert */}
                <div
                  className="absolute inset-x-1 top-0 h-3 rounded-sm transition-opacity duration-300"
                  style={{ background: `linear-gradient(to bottom, ${burst}CC, transparent)`, opacity: lidOpen ? 1 : 0 }}
                />
                {/* bande centrale + serrure */}
                <div className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 border-x-2" style={{ borderColor: `${burst}88`, background: `${burst}14` }} />
                <div
                  className="absolute left-1/2 top-2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 transition-opacity duration-300"
                  style={{ borderColor: burst, background: '#0B0F1A', boxShadow: `0 0 14px -2px ${burst}`, opacity: lidOpen ? 0 : 1 }}
                >
                  <div className="h-3.5 w-2 rounded-full" style={{ background: burst, boxShadow: `0 0 8px ${burst}` }} />
                </div>
                {/* rivets */}
                <div className="absolute bottom-2 left-3 h-1.5 w-1.5 rounded-full" style={{ background: `${burst}99` }} />
                <div className="absolute bottom-2 right-3 h-1.5 w-1.5 rounded-full" style={{ background: `${burst}99` }} />
              </div>
            </motion.div>

            {/* CTA */}
            <div className="mt-7 h-12">
              {phase === 'chest' && (
                <button onClick={open} className="btn-arena px-8 py-3 text-sm">
                  Ouvrir le coffre
                </button>
              )}
              {phase === 'opening' && (
                <p className="animate-pulse text-sm uppercase tracking-[0.25em] text-white/50">Ouverture…</p>
              )}
              {phase === 'revealed' && (
                <button onClick={onClose} className="btn-arena px-8 py-3 text-sm">
                  Continuer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
