'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Trophy, Users, CalendarClock, Sparkles } from 'lucide-react'
import { getJackpot, type JackpotState } from '@/actions/jackpot'

function nextEighth(): { days: number; label: string } {
  const paris = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const target = new Date(paris)
  if (paris.getDate() < 8) target.setDate(8)
  else target.setMonth(target.getMonth() + 1, 8)
  target.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.ceil((target.getTime() - paris.getTime()) / 86400000))
  return { days, label: target.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }
}

const trophy = (
  <svg className="text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
)

/** Widget jackpot — variantes : `inline` (au-dessus du mockup LP) ou `pill`
 *  (compact, dans les stats du lobby). Toujours cliquable → modal explicatif. */
export function JackpotWidget({ variant }: { variant: 'inline' | 'pill' | 'stat' }) {
  const [jp, setJp] = useState<JackpotState | null>(null)
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => { getJackpot().then(setJp).catch(() => {}) }, [])

  // Compteur animé : grimpe jusqu'au montant réel (effet « cagnotte qui gonfle »)
  useEffect(() => {
    if (!jp) return
    const target = jp.amount
    const from = Math.max(0, target - 320)
    const dur = 1400
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [jp])

  if (!jp || jp.amount <= 0) return null
  const next = nextEighth()
  const shown = display.toLocaleString('fr-FR')

  const trigger = variant === 'stat' ? (
    <button onClick={() => setOpen(true)} className="pl-8 text-left transition-opacity hover:opacity-90" title="Jackpot communautaire">
      <div className="text-2xl lg:text-3xl stat-numeral text-yellow-300">{shown}</div>
      <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Jackpot · le 8</div>
    </button>
  ) : variant === 'pill' ? (
    <button
      onClick={() => setOpen(true)}
      title="Jackpot communautaire"
      className="panel flex items-center gap-2 px-3.5 py-2 transition-colors hover:border-yellow-400/40"
    >
      <span className="h-4 w-4">{trophy}</span>
      <span className="stat-numeral text-sm text-yellow-300">{shown}</span>
      <span className="text-xs text-white/50">jackpot</span>
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="group inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-gradient-to-r from-yellow-400/[0.12] to-yellow-400/[0.04] px-3.5 py-1.5 transition-transform hover:-translate-y-0.5"
    >
      <span className="h-4 w-4 shrink-0">{trophy}</span>
      <span className="font-display text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">Jackpot</span>
      <span className="stat-numeral text-sm font-bold text-yellow-300">{jp.amount.toLocaleString('fr-FR')}</span>
      <span className="text-[0.7rem] text-white/50">· le 8 (dans {next.days}j)</span>
    </button>
  )

  return (
    <>
      {trigger}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          role="dialog" aria-modal="true" aria-label="Jackpot communautaire"
          className="fixed inset-0 max-sm:min-h-[100lvh] z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-400/25 bg-bg-secondary p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="absolute right-3 top-3 text-white/40 hover:text-white"><X size={20} /></button>
            <div className="mb-4 flex flex-col items-center text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10"><span className="h-7 w-7">{trophy}</span></span>
              <span className="kicker !text-[0.6rem]">Jackpot communautaire</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="stat-numeral text-4xl font-bold text-yellow-300">{shown}</span>
                <span className="text-sm text-white/55">crédits</span>
              </div>
              <p className="mt-1 text-xs text-white/50">Prochaine distribution le {next.label} (dans {next.days} jour{next.days > 1 ? 's' : ''})</p>
            </div>
            <div className="space-y-3 text-sm text-white/70">
              <Row icon={<Sparkles className="h-4 w-4 text-yellow-400" />} text="La cagnotte grossit un peu chaque jour." />
              <Row icon={<CalendarClock className="h-4 w-4 text-neon-blue" />} text="Le 8 de chaque mois, elle est entièrement distribuée." />
              <Row icon={<Users className="h-4 w-4 text-neon-purple" />} text="Un gagnant est tiré au sort parmi tous les joueurs ayant cliqué dans l'arène." />
              <Row icon={<Trophy className="h-4 w-4 text-success" />} text="Plus tu participes, plus tu as de chances d'être tiré." />
            </div>
            {jp.lastWinner && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center text-xs text-white/60">
                Dernier gagnant : <span className="font-semibold text-yellow-300">{jp.lastWinner}</span> — {jp.lastWinnerAmount?.toLocaleString('fr-FR')} crédits
              </div>
            )}
            <Link href="/lobby" onClick={() => setOpen(false)} className="btn-arena mt-5 flex w-full justify-center py-3 text-sm">Jouer pour participer</Link>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 shrink-0">{icon}</span><span>{text}</span></div>
}
