'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { openChest, type ChestDrop } from '@/actions/collection'
import { RARITY, REEL_EMOJIS, bonusLabel, type Rarity } from './rarity'

type ReelTile = { emoji: string; rarity: Rarity }
const TILE = 112 // largeur d'une tuile (px) incl. marge

const CHEST_RARITY: Record<string, Rarity> = { common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary' }

function randomTile(): ReelTile {
  const pool: Rarity[] = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary', 'mythic']
  return { emoji: REEL_EMOJIS[Math.floor(Math.random() * REEL_EMOJIS.length)], rarity: pool[Math.floor(Math.random() * pool.length)] }
}

export function CaseOpeningModal({
  chestId, chestRarity, onClose, onReward,
}: {
  chestId: string
  chestRarity: string
  onClose: () => void
  onReward: (drop: ChestDrop) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed' | 'error'>('idle')
  const [reel, setReel] = useState<ReelTile[]>([])
  const [offset, setOffset] = useState(0)
  const [drop, setDrop] = useState<ChestDrop | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  const WIN_INDEX = 48

  const dropTile = useCallback((d: ChestDrop): ReelTile => {
    if (d.rewardKind === 'item' && d.item) return { emoji: d.item.emoji, rarity: d.item.rarity }
    if (d.rewardKind === 'credits') return { emoji: '💰', rarity: 'rare' }
    return { emoji: '⚡', rarity: 'epic' } // xp
  }, [])

  const start = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    setPhase('spinning')
    const res = await openChest(chestId)
    if (!res.success || !res.data) { setPhase('error'); return }
    const d = res.data
    setDrop(d)

    // Construire le reel : tuiles aléatoires + la vraie récompense à WIN_INDEX
    const tiles: ReelTile[] = Array.from({ length: 60 }, () => randomTile())
    tiles[WIN_INDEX] = dropTile(d)
    setReel(tiles)

    // Lancer l'animation au tick suivant (depuis offset 0)
    requestAnimationFrame(() => {
      const w = windowRef.current?.clientWidth ?? 600
      const jitter = (Math.random() - 0.5) * (TILE * 0.5)
      const target = -(WIN_INDEX * TILE) + (w / 2 - TILE / 2) + jitter
      setOffset(target)
    })

    setTimeout(() => {
      onReward(d)
      setPhase('revealed')
    }, 5200)
  }, [chestId, dropTile, onReward])

  useEffect(() => { start() }, [start])

  const cr = CHEST_RARITY[chestRarity] ?? 'common'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary p-6">
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-10 text-white/40 hover:text-white">
          <X size={20} />
        </button>

        <p className="mb-1 text-center text-xs uppercase tracking-widest text-white/40">Coffre {RARITY[cr].label}</p>
        <h3 className="mb-5 text-center text-xl font-black text-white">Ouverture du coffre</h3>

        {phase === 'error' && (
          <p role="alert" className="py-12 text-center text-danger">Ce coffre n&apos;est plus disponible.</p>
        )}

        {phase !== 'error' && (
          <>
            {/* Reel */}
            <div ref={windowRef} className="relative h-32 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {/* marqueur central */}
              <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-neon-purple to-transparent" />
              <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 text-neon-purple">▼</div>
              {/* dégradés latéraux */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-secondary to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-secondary to-transparent" />

              <div
                className="flex h-full items-center"
                style={{ transform: `translateX(${offset}px)`, transition: phase === 'spinning' ? 'transform 5s cubic-bezier(0.12, 0.78, 0.2, 1)' : 'none' }}
              >
                {reel.map((t, i) => (
                  <div key={i} className="shrink-0" style={{ width: TILE }}>
                    <div className={`mx-1 flex h-24 items-center justify-center rounded-lg border bg-gradient-to-b ${RARITY[t.rarity].border} ${RARITY[t.rarity].bg}`}>
                      <span className="text-4xl">{t.emoji}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Révélation */}
            <div className="mt-5 min-h-[90px]">
              {phase === 'revealed' && drop && (
                <div className="animate-in fade-in zoom-in duration-300 text-center">
                  {drop.rewardKind === 'item' && drop.item && (
                    <div className={`inline-flex flex-col items-center gap-1 rounded-2xl border ${RARITY[drop.item.rarity].border} bg-gradient-to-b ${RARITY[drop.item.rarity].bg} ${RARITY[drop.item.rarity].glow} px-8 py-4`}>
                      <span className="text-5xl">{drop.item.emoji}</span>
                      <span className={`text-lg font-black ${RARITY[drop.item.rarity].text}`}>{drop.item.name}</span>
                      <span className="text-xs uppercase tracking-wider text-white/50">{RARITY[drop.item.rarity].label} · {bonusLabel(drop.item.bonusKind, drop.item.bonusValue)}</span>
                    </div>
                  )}
                  {drop.rewardKind === 'credits' && (
                    <div className="inline-flex flex-col items-center gap-1 rounded-2xl border border-yellow-400/50 bg-yellow-400/10 px-8 py-4">
                      <span className="text-5xl">💰</span>
                      <span className="text-2xl font-black text-yellow-300">+{drop.credits} crédits</span>
                    </div>
                  )}
                  {drop.rewardKind === 'xp' && (
                    <div className="inline-flex flex-col items-center gap-1 rounded-2xl border border-cyan-400/50 bg-cyan-400/10 px-8 py-4">
                      <span className="text-5xl">⚡</span>
                      <span className="text-2xl font-black text-cyan-300">+{drop.xp} XP</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <button onClick={onClose} className="rounded-xl bg-gradient-to-r from-neon-purple to-cyan-500 px-6 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105">
                      Continuer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
