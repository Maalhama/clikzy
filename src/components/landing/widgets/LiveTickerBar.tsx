'use client'

interface TickerWinner {
  id: string
  username: string
  item_name: string
  item_value: number
}

interface LiveTickerBarProps {
  winners: TickerWinner[]
}

/**
 * Bandeau ticker façon salle de marché : flux continu des dernières victoires.
 * Pur CSS (marquee-content existant), aucun coût JS.
 */
export function LiveTickerBar({ winners }: LiveTickerBarProps) {
  const items = winners.length > 0 ? winners.slice(0, 8) : [
    { id: 't1', username: 'Alex42', item_name: 'iPhone 17 Pro', item_value: 1229 },
    { id: 't2', username: 'GamerPro', item_name: 'PS5', item_value: 549 },
    { id: 't3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279 },
    { id: 't4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329 },
  ]

  const Track = () => (
    <div className="marquee-content !gap-0">
      {items.map((w) => (
        <span key={w.id} className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
          <svg className="h-3.5 w-3.5 text-success" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
          <span className="font-semibold text-white/85 text-xs">{w.username}</span>
          <span className="text-white/35 text-xs">a remporté</span>
          <span className="text-white/70 text-xs">{w.item_name}</span>
          <span className="stat-numeral text-xs text-success">{w.item_value.toLocaleString()}€</span>
          <span className="ml-6 h-1 w-1 rounded-full bg-neon-purple/60" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="relative border-y border-white/[0.07] bg-bg-secondary/40 py-2.5 overflow-hidden" aria-label="Dernières victoires">
      {/* Étiquette LIVE fixe à gauche */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 bg-bg-primary pl-4 pr-5 md:pl-6"
        style={{ boxShadow: '24px 0 24px -12px rgba(11,15,26,1)' }}
      >
        <span className="live-dot" aria-hidden="true" />
        <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-success">Live</span>
      </div>

      <div className="marquee-container pl-24">
        <div className="flex w-max animate-[marquee_30s_linear_infinite]">
          <Track />
          <Track />
        </div>
      </div>
    </div>
  )
}
