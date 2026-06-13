'use client'

import Link from 'next/link'
import Image from 'next/image'
import { type CommentFeedItem } from '@/actions/comments'
import { avatarColor, timeAgo } from '@/components/comments/commentUtils'

export function LobbyCommentsFeed({ comments }: { comments: CommentFeedItem[] }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h4m-8 7l3.5-2.5A2 2 0 0110.7 18H17a3 3 0 003-3V8a3 3 0 00-3-3H7a3 3 0 00-3 3v13z" />
        </svg>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">Derniers messages</h3>
      </div>

      {comments.length === 0 ? (
        <p className="py-3 text-center text-xs leading-relaxed text-white/40">
          Pas encore de message. Lance la discussion depuis une partie&nbsp;!
        </p>
      ) : (
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: `${avatarColor(c.username)}2A`, color: avatarColor(c.username) }}
              aria-hidden
            >
              {c.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-xs font-semibold text-white">{c.username}</span>
                <span className="flex-shrink-0 text-[0.65rem] text-white/35">{timeAgo(c.created_at)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 break-words text-xs leading-snug text-white/70">{c.content}</p>
              <Link
                href={`/game/${c.game_id}`}
                className="group mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md bg-white/[0.04] px-1.5 py-1 transition-colors hover:bg-neon-purple/10"
              >
                <span className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded">
                  <Image src={c.item_image} alt="" fill sizes="16px" className="object-contain" />
                </span>
                <span className="truncate text-[0.65rem] text-white/45 group-hover:text-neon-purple">
                  sous {c.item_name}
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  )
}
