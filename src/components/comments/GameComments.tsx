'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { postComment, getGameComments, type GameComment } from '@/actions/comments'
import { avatarColor, timeAgo } from '@/components/comments/commentUtils'
import { seedGameComments } from '@/lib/bots/commentGenerator'

export function GameComments({ gameId, userId, itemName }: { gameId: string; userId: string | null; itemName?: string }) {
  const [comments, setComments] = useState<GameComment[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const seeded = seedGameComments(gameId, itemName ?? '', 9, Date.now())
    getGameComments(gameId).then((c) => {
      if (!active) return
      const seen = new Set(c.map((x) => x.id))
      const merged = [...c, ...seeded.filter((s) => !seen.has(s.id))].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1
      )
      setComments(merged)
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    return () => {
      active = false
    }
  }, [gameId, itemName])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    const res = await postComment(gameId, text)
    if (res.success && res.data) {
      setComments((prev) => [res.data!, ...prev])
      setContent('')
    } else {
      setError(res.error ?? 'Une erreur est survenue.')
    }
    setSending(false)
  }

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6l3.5-2.5A2 2 0 0110.7 17H17a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v13z" />
        </svg>
        <h2 className="font-display text-lg font-bold text-white">Discussion</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">{comments.length}</span>
      </div>

      {/* Zone d'écriture */}
      {userId ? (
        <form onSubmit={submit} className="mb-5">
          <div className="rounded-xl border border-white/10 bg-bg-secondary/50 focus-within:border-neon-purple/40">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={280}
              rows={2}
              aria-label="Écrire un message dans le chat de la partie"
              placeholder="Lâche un message… (il faut avoir cliqué au moins une fois)"
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/55 focus:outline-none"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-[0.7rem] text-white/30">{content.length}/280</span>
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="btn-arena px-5 py-2 text-sm disabled:opacity-40"
              >
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
        </form>
      ) : (
        <a
          href="/register"
          className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-neon-purple/30 bg-neon-purple/10 px-4 py-3 text-sm font-medium text-neon-purple transition-colors hover:bg-neon-purple/15"
        >
          Crée ton compte pour rejoindre la discussion
        </a>
      )}

      {/* Liste */}
      {loading ? (
        <p className="py-4 text-center text-sm text-white/55">Chargement…</p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">
          Aucun message pour l’instant. Sois le premier à lancer la discussion !
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `${avatarColor(c.username)}2A`, color: avatarColor(c.username) }}
                aria-hidden
              >
                {c.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-white">{c.username}</span>
                  <span className="flex-shrink-0 text-[0.7rem] text-white/35">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-0.5 break-words text-sm leading-relaxed text-white/70">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
