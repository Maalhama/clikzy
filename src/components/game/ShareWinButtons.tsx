'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Share2, Link2, Check, UserPlus } from 'lucide-react'

/**
 * Partage de victoire + relais parrainage : le moment le plus chaud pour
 * l'acquisition. Web Share API si dispo, sinon X/WhatsApp + copie de lien.
 */
export function ShareWinButtons({ itemName, itemValue, username }: { itemName: string; itemValue: number; username?: string }) {
  const [copied, setCopied] = useState(false)

  const url = username ? `https://www.cleekzy.com/joueur/${encodeURIComponent(username)}` : 'https://www.cleekzy.com'
  const text = `Je viens de gagner ${itemName} (${itemValue.toLocaleString('fr-FR')}€) sur Cleekzy — le dernier clic gagne !`

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cleekzy', text, url })
        return true
      }
    } catch { /* annulé */ }
    return false
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard indisponible */ }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={async () => { if (!(await nativeShare())) copy() }}
          className="btn-arena px-5 py-2.5 text-xs"
        >
          <Share2 className="h-3.5 w-3.5" /> Partager ma victoire
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-arena-ghost px-4 py-2.5 text-xs"
        >
          X
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-arena-ghost px-4 py-2.5 text-xs"
        >
          WhatsApp
        </a>
        <button onClick={copy} className="btn-arena-ghost px-4 py-2.5 text-xs" aria-label="Copier le lien">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Relais parrainage au moment de l'euphorie */}
      <Link
        href="/profile"
        className="flex items-center justify-center gap-2 text-xs text-white/50 transition-colors hover:text-neon-purple"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Parraine un ami et gagnez des crédits tous les deux
      </Link>
    </div>
  )
}
