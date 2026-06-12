'use client'

import { useMemo, useState } from 'react'
import { RARITY_LABEL } from '@/lib/cosmetics'
import { createPortal } from 'react-dom'
import { X, Zap, Coins, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { claimCalendarDay, type CalendarDay } from '@/actions/calendar'
import { NeonChest, CHEST_THEME, type ChestRarityKey } from '@/components/collection/NeonChest'
import { BattlePassRail } from '@/components/progression/BattlePassRail'

const DOW_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']


/**
 * Calendrier mensuel des récompenses : une case par jour, réclamable le jour
 * même (minuit Europe/Paris). Les samedis sont des coffres dont la rareté
 * monte au fil du mois — le serveur est seul maître des récompenses.
 */
export function RewardsCalendarModal({
  days, onClose, onClaimed,
}: {
  days: CalendarDay[]
  onClose: () => void
  onClaimed?: (kind: string, amount: number, rarity: string | null) => void
}) {
  const [claiming, setClaiming] = useState(false)
  const [localDays, setLocalDays] = useState(days)
  const [result, setResult] = useState<{ kind: string; amount: number; rarity: string | null } | null>(null)

  const today = localDays.find((d) => d.claimable)
  const monthTitle = useMemo(() => {
    const first = localDays[0]?.day
    if (!first) return ''
    const date = new Date(`${first}T12:00:00`)
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [localDays])

  // décalage du 1er jour (semaine qui commence lundi)
  const offset = useMemo(() => {
    const first = localDays[0]?.day
    if (!first) return 0
    return (new Date(`${first}T12:00:00`).getDay() + 6) % 7
  }, [localDays])

  const claim = async () => {
    if (claiming || !today) return
    setClaiming(true)
    const res = await claimCalendarDay()
    if (res.success && res.data && !res.data.already) {
      setResult(res.data)
      setLocalDays((prev) => prev.map((d) => (d.day === today.day ? { ...d, claimed: true, claimable: false } : d)))
      onClaimed?.(res.data.kind, res.data.amount, res.data.rarity)
    }
    setClaiming(false)
  }

  const cellIcon = (d: CalendarDay) => {
    if (d.kind === 'chest') return <NeonChest rarity={d.rarity ?? 'common'} size={26} />
    if (d.kind === 'credits') return <Coins className="h-4 w-4 text-yellow-400" />
    return <Zap className="h-4 w-4 text-cyan-400" />
  }

  if (typeof window === 'undefined') return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Récompenses du mois" className="fixed inset-0 max-sm:min-h-[100lvh] z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-bg-secondary p-4 sm:p-6"
      >
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-10 text-white/40 hover:text-white">
          <X size={20} />
        </button>

        <span className="kicker !text-[0.6rem]">Récompenses du mois</span>
        <h3 className="mt-1.5 mb-1 font-display text-xl font-semibold text-white sm:text-2xl">{monthTitle}</h3>
        <p className="mb-3 text-xs text-white/50 sm:mb-5">
          Reviens chaque jour réclamer ta récompense. Les <span className="font-semibold text-white/80">samedis</span> = coffres,
          de plus en plus rares au fil du mois !
        </p>

        {/* Grille */}
        <div className="mb-1 grid grid-cols-7 gap-1 text-center sm:gap-1.5">
          {DOW_LABELS.map((l, i) => (
            <span key={i} className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-white/55">{l}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: offset }).map((_, i) => <span key={`o-${i}`} />)}
          {localDays.map((d) => {
            const n = Number(d.day.slice(-2))
            const chestColor = d.kind === 'chest' ? CHEST_THEME[(d.rarity ?? 'common') as ChestRarityKey].frame : null
            return (
              <div
                key={d.day}
                title={d.kind === 'chest' ? `Coffre ${RARITY_LABEL[d.rarity ?? 'common'].toLocaleLowerCase('fr-FR')}` : d.kind === 'credits' ? `+${d.amount} crédit${d.amount > 1 ? 's' : ''}` : `+${d.amount} XP`}
                className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border transition-all ${
                  d.claimable
                    ? 'border-neon-purple bg-neon-purple/15 shadow-[0_0_16px_-4px_rgba(155,92,255,0.8)] animate-pulse'
                    : d.claimed
                    ? 'border-success/40 bg-success/10'
                    : 'border-white/10 bg-white/[0.03]'
                } ${!d.claimed && !d.claimable ? 'opacity-55' : ''}`}
                style={d.kind === 'chest' && !d.claimed ? { borderColor: `${chestColor}66` } : undefined}
              >
                <span className="stat-numeral absolute left-1 top-0.5 text-[0.65rem] text-white/60">{n}</span>
                {d.claimed ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <>
                    {cellIcon(d)}
                    {d.kind !== 'chest' && (
                      <span className="stat-numeral text-[0.65rem] leading-none text-white/55">{d.amount}</span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA du jour */}
        <div className="mt-4 text-center">
          {result ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-success">
                {result.kind === 'chest'
                  ? `Coffre ${RARITY_LABEL[result.rarity ?? 'common'].toLocaleLowerCase('fr-FR')} ajouté à ta collection !`
                  : result.kind === 'credits'
                  ? `+${result.amount} crédit${result.amount > 1 ? 's' : ''} !`
                  : `+${result.amount} XP !`}
              </p>
              <button onClick={onClose} className="btn-arena px-7 py-2.5 text-xs">Continuer</button>
            </div>
          ) : today ? (
            <button onClick={claim} disabled={claiming} className="btn-arena px-6 py-2.5 text-xs disabled:opacity-60 sm:px-8 sm:py-3 sm:text-sm">
              {claiming ? 'Récupération…' : 'Réclamer la récompense du jour'}
            </button>
          ) : (
            <p className="text-xs text-white/40">Récompense du jour déjà réclamée — reviens demain !</p>
          )}
        </div>

        {/* Passe d'Arène premium */}
        <BattlePassRail />

      </motion.div>
    </div>,
    document.body
  )
}
