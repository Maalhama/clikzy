'use client'

import { useState } from 'react'
import Link from 'next/link'

export function GiftCodeReveal({ code, reward }: { code: string; reward: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const claimPath = `/cadeau?code=${encodeURIComponent(code)}`
  const claimUrl = () => (typeof window !== 'undefined' ? window.location.origin + claimPath : `https://www.cleekzy.com${claimPath}`)

  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : claimUrl())
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* clipboard indisponible */
    }
  }

  const share = async () => {
    const text = `Je t'offre ${reward} sur Cleekzy ! Réclame ton cadeau avec le code ${code}.`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Un cadeau Cleekzy pour toi', text, url: claimUrl() })
      } catch {
        /* annulé */
      }
    } else {
      copy('link')
    }
  }

  return (
    <div className="panel relative overflow-hidden p-8 text-center">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-neon-pink/20 blur-[80px]" />

      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-pink/15">
        <svg className="h-8 w-8 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2M5 8l2-4h10l2 4M12 8v13" />
        </svg>
      </div>

      <h1 className="font-display text-2xl font-bold text-white">Ton cadeau est prêt !</h1>
      <p className="mt-2 text-sm text-white/60">
        Envoie ce code à qui tu veux — il recevra <span className="font-semibold text-neon-pink">{reward}</span>.
      </p>

      {/* Code */}
      <button
        onClick={() => copy('code')}
        className="group mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neon-pink/30 bg-neon-pink/[0.06] px-4 py-4 transition-colors hover:border-neon-pink/50"
      >
        <span className="stat-numeral text-2xl font-black tracking-[0.3em] text-white">{code}</span>
        <span className="text-xs font-semibold text-neon-pink">{copied === 'code' ? 'Copié !' : 'Copier'}</span>
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button onClick={share} className="btn-arena px-5 py-2.5 text-sm">Partager le cadeau</button>
        <button onClick={() => copy('link')} className="btn-arena-outline px-4 py-2.5 text-sm">
          {copied === 'link' ? 'Lien copié !' : 'Copier le lien'}
        </button>
      </div>

      <p className="mt-6 text-xs text-white/40">
        Le code reste valable 90 jours.{' '}
        <Link href="/lobby" className="text-neon-pink hover:underline">Retour à l&apos;arène</Link>
      </p>
    </div>
  )
}
