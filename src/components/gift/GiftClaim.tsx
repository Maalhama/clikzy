'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getGiftInfo, redeemGift, type GiftDetails } from '@/actions/gift'

function rewardLabel(kind?: 'credits' | 'vip', credits?: number, vipDays?: number): string {
  if (kind === 'vip') return `${vipDays ?? 0} jours de VIP`
  return `${credits ?? 0} crédits`
}

export function GiftClaim({ initialCode, initialInfo }: { initialCode: string; initialInfo: GiftDetails | null }) {
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [info, setInfo] = useState<GiftDetails | null>(initialInfo)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ kind: 'credits' | 'vip'; credits?: number; vipDays?: number } | null>(null)
  const [needLogin, setNeedLogin] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Aperçu du cadeau quand le code change (déduit du partage de lien ou saisi).
  useEffect(() => {
    if (done) return
    const c = code.trim()
    if (c.length < 6) {
      setInfo(null)
      return
    }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      getGiftInfo(c).then(setInfo).catch(() => setInfo(null))
    }, 400)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [code, done])

  const claim = async () => {
    setClaiming(true)
    setError(null)
    setNeedLogin(false)
    try {
      const r = await redeemGift(code)
      if (r.success && r.data) {
        setDone(r.data)
      } else {
        setError(r.error || 'Code invalide.')
        if (r.error?.toLowerCase().includes('connecte')) setNeedLogin(true)
      }
    } catch {
      setError('Erreur, réessaie.')
    } finally {
      setClaiming(false)
    }
  }

  // Écran de succès
  if (done) {
    return (
      <div className="panel relative overflow-hidden p-8 text-center">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-success/20 blur-[80px]" />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Cadeau réclamé !</h1>
        <p className="mt-2 text-white/65">
          Tu as reçu <span className="font-semibold text-neon-pink">{rewardLabel(done.kind, done.credits, done.vipDays)}</span>.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/lobby" className="btn-arena px-6 py-3 text-sm">Foncer dans l&apos;arène</Link>
          <Link href="/profile" className="btn-arena-outline px-5 py-3 text-sm">Voir mon profil</Link>
        </div>
      </div>
    )
  }

  const preview =
    info?.found && !info.redeemed && !info.expired ? (
      <div className="mt-4 rounded-xl border border-neon-pink/30 bg-neon-pink/[0.06] px-4 py-3 text-sm">
        <span className="font-semibold text-white">{rewardLabel(info.kind, info.credits, info.vipDays)}</span>
        {info.gifterUsername && <span className="text-white/60"> offert{info.kind === 'vip' ? '' : 's'} par {info.gifterUsername}</span>}
      </div>
    ) : info?.found && info.redeemed ? (
      <p className="mt-4 text-sm text-white/50">Ce cadeau a déjà été réclamé.</p>
    ) : info?.found && info.expired ? (
      <p className="mt-4 text-sm text-white/50">Ce cadeau a expiré.</p>
    ) : info && !info.found && code.trim().length >= 6 ? (
      <p className="mt-4 text-sm text-white/50">Aucun cadeau pour ce code.</p>
    ) : null

  const canClaim = !!info?.found && !info.redeemed && !info.expired

  return (
    <div className="panel p-8">
      <h1 className="text-center font-display text-2xl font-bold text-white">Réclamer un cadeau</h1>
      <p className="mt-1.5 text-center text-sm text-white/55">Entre le code cadeau qu&apos;on t&apos;a offert.</p>

      <div className="mt-6">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE CADEAU"
          maxLength={14}
          className="stat-numeral w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-center text-lg tracking-[0.3em] text-white placeholder:tracking-normal placeholder:text-white/30 focus:border-neon-pink/50 focus:outline-none"
        />
        {preview}
        {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
        {needLogin && (
          <Link
            href={`/login?next=${encodeURIComponent(`/cadeau?code=${encodeURIComponent(code.trim())}`)}`}
            className="mt-2 block text-center text-sm font-semibold text-neon-pink hover:underline"
          >
            Se connecter pour réclamer →
          </Link>
        )}

        <button
          onClick={claim}
          disabled={claiming || !canClaim}
          className="btn-arena mt-5 w-full py-3.5 text-sm disabled:opacity-40"
        >
          {claiming ? 'Réclamation…' : 'Réclamer mon cadeau'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Tu veux faire plaisir à quelqu&apos;un ?{' '}
        <Link href="/cadeau/offrir" className="text-neon-pink hover:underline">Offrir un cadeau</Link>
      </p>
    </div>
  )
}
