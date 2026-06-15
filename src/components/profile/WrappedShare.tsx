'use client'

import { useState } from 'react'

/** Boutons de partage du Cleekzy Wrapped : natif (mobile), X, copie de lien. */
export function WrappedShare({ username, title }: { username: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const path = `/wrapped/${encodeURIComponent(username)}`
  const getUrl = () =>
    typeof window !== 'undefined' ? window.location.origin + path : `https://www.cleekzy.com${path}`
  const shareText = `Mon bilan Cleekzy — ${title}. Le dernier clic gagne.`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard indisponible */
    }
  }

  const nativeShare = async () => {
    const url = getUrl()
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Cleekzy Wrapped', text: shareText, url })
      } catch {
        /* annulé */
      }
    } else {
      copy()
    }
  }

  const shareX = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getUrl())}`
    window.open(intent, '_blank', 'noopener')
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button onClick={nativeShare} className="btn-arena px-5 py-2.5 text-sm">
        Partager mon bilan
      </button>
      <button onClick={shareX} className="btn-arena-outline px-4 py-2.5 text-sm" aria-label="Partager sur X">
        X
      </button>
      <button onClick={copy} className="btn-arena-ghost px-4 py-2.5 text-sm">
        {copied ? 'Lien copié !' : 'Copier le lien'}
      </button>
    </div>
  )
}
