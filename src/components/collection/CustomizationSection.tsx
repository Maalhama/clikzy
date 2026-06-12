'use client'

import { useEffect, useState } from 'react'
import { Loader2, Lock, Check, Palette } from 'lucide-react'
import { getCosmetics, equipCosmetic, type CosmeticsState, type Cosmetic } from '@/actions/cosmetics'
import { CURSOR_CSS, TRAIL_COLORS, RARITY_HEX } from '@/lib/cosmetics'
import { Avatar } from '@/components/ui/Avatar'

const TYPE_LABEL: Record<string, string> = { cursor: 'Curseur', trail: 'Traînée de clic', frame: 'Cadre d’avatar' }
const TYPE_ORDER = ['cursor', 'trail', 'frame'] as const

function Preview({ c }: { c: Cosmetic }) {
  if (c.type === 'cursor') {
    const css = CURSOR_CSS[c.id]
    const fill = c.id === 'cursor_default' ? '#C7D0E4' : (css?.match(/fill='([^']+)'/)?.[1] ?? '#C7D0E4')
    return (
      <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 9-7 2-3 7-4-18z" fill={fill} stroke="white" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    )
  }
  if (c.type === 'trail') {
    const cols = TRAIL_COLORS[c.id] ?? []
    if (cols.length === 0) return <span className="text-[0.6rem] text-white/40">Aucune</span>
    return (
      <span className="flex gap-1">
        {cols.map((col, i) => <span key={i} className="h-3 w-3 rounded-sm" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />)}
      </span>
    )
  }
  return <Avatar username="A" frame={c.id} size={40} />
}

export function CustomizationSection() {
  const [state, setState] = useState<CosmeticsState | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { getCosmetics().then((r) => { if (r.success && r.data) setState(r.data) }) }, [])

  if (!state) {
    return (
      <section className="panel reveal reveal-4 p-5">
        <div className="flex items-center justify-center py-8 text-white/40"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </section>
    )
  }

  const equip = async (c: Cosmetic) => {
    if (busy) return
    setBusy(c.id)
    const res = await equipCosmetic(c.id)
    if (res.success) {
      setState((s) => s ? { ...s, equipped: { ...s.equipped, [c.type]: c.id } } : s)
    }
    setBusy(null)
  }

  return (
    <section className="panel reveal reveal-4 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="h-5 w-5 text-neon-pink" />
        <h2 className="font-display text-lg font-semibold text-white">Personnalisation</h2>
      </div>
      <p className="mb-5 text-xs text-white/50">Débloque des styles en montant de niveau. Niveau actuel : <span className="font-semibold text-white">{state.level}</span></p>

      <div className="space-y-5">
        {TYPE_ORDER.map((type) => {
          const items = state.catalog.filter((c) => c.type === type)
          return (
            <div key={type}>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">{TYPE_LABEL[type]}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {items.map((c) => {
                  const equipped = state.equipped[type] === c.id
                  const unlocked = c.isPremium ? state.ownedPremium.includes(c.id) : state.level >= c.unlockLevel
                  const rcolor = RARITY_HEX[c.rarity] ?? RARITY_HEX.common
                  return (
                    <button
                      key={c.id}
                      onClick={() => unlocked && equip(c)}
                      disabled={!unlocked || busy === c.id}
                      title={c.name}
                      className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all ${
                        equipped ? 'border-2' : 'border-white/10'
                      } ${unlocked ? 'hover:border-white/30' : 'opacity-50'}`}
                      style={equipped ? { borderColor: rcolor, boxShadow: `0 0 14px -4px ${rcolor}` } : undefined}
                    >
                      {busy === c.id ? <Loader2 className="h-5 w-5 animate-spin text-white/60" /> : <Preview c={c} />}
                      {equipped && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      {!unlocked && (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-xl bg-black/55 text-white/70">
                          <Lock className="h-3.5 w-3.5" />
                          <span className="text-[0.55rem] font-semibold">Niv. {c.unlockLevel}</span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-[0.65rem] text-white/35">Le curseur et la traînée s&apos;appliquent partout après rechargement.</p>
    </section>
  )
}
