'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Share2, Link2, Check, Swords } from 'lucide-react'

/**
 * Partage « battu de justesse » : le near-miss est l'émotion la plus
 * partageable du concept « dernier clic ». On capitalise dessus pour la
 * viralité juste après une défaite serrée.
 */
export function ShareNearMissButtons({ itemName, username }: { itemName: string; username?: string }) {
  const [copied, setCopied] = useState(false)

  const url = username ? `https://www.cleekzy.com/joueur/${encodeURIComponent(username)}` : 'https://www.cleekzy.com'
  const text = `Battu au dernier clic sur ${itemName} sur Cleekzy, le dernier qui clique rafle le lot. Tu fais mieux que moi ?`

  const nativeShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Cleekzy', text, url }); return true }
    } catch { /* annulé */ }
    return false
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* indispo */ }
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-center text-sm font-semibold text-white/80">
        Battu de justesse — la revanche t&apos;attend.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={async () => { if (!(await nativeShare())) copy() }} className="btn-arena px-5 py-2.5 text-xs">
          <Share2 className="h-3.5 w-3.5" /> Lance un défi
        </button>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="btn-arena-ghost px-4 py-2.5 text-xs">X</a>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className="btn-arena-ghost px-4 py-2.5 text-xs">WhatsApp</a>
        <button onClick={copy} className="btn-arena-ghost px-4 py-2.5 text-xs" aria-label="Copier le lien">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <Link href="/lobby" className="flex items-center justify-center gap-2 text-xs text-white/50 transition-colors hover:text-neon-pink">
        <Swords className="h-3.5 w-3.5" />
        Retourne dans l&apos;arène prendre ta revanche
      </Link>
    </div>
  )
}
