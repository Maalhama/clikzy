'use client'

interface PodiumWinner {
  id: string
  username: string
  item_name: string
  item_value: number
}

interface WinnersPodiumProps {
  winners: PodiumWinner[]
}

const PODIUM = [
  // ordre d'affichage : 2e, 1er, 3e
  { rank: 2, height: 'h-24', color: '#C0C8D8', label: 'Argent' },
  { rank: 1, height: 'h-36', color: '#FFD700', label: 'Or' },
  { rank: 3, height: 'h-16', color: '#CD7F32', label: 'Bronze' },
]

/**
 * Podium des 3 plus grosses victoires récentes — pur affichage,
 * construit depuis la liste de gagnants déjà chargée.
 */
export function WinnersPodium({ winners }: WinnersPodiumProps) {
  const top3 = [...winners].sort((a, b) => b.item_value - a.item_value).slice(0, 3)
  if (top3.length < 3) return null

  return (
    <div className="relative mb-14" aria-label="Podium des plus grosses victoires">
      {/* Projecteur derrière la première place */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[120%] w-[420px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 35%, rgba(255,215,0,0.14), transparent 70%)',
          filter: 'blur(6px)',
        }}
      />

      <div className="relative flex items-end justify-center gap-4 lg:gap-8">
      {PODIUM.map(({ rank, height, color, label }) => {
        const w = top3[rank - 1]
        const first = rank === 1
        return (
          <div key={rank} className={`flex w-44 flex-col items-center lg:w-52 ${first ? '-mt-6' : ''}`}>
            {/* Avatar + couronne */}
            <div className="relative mb-3">
              {first && (
                <svg
                  className="absolute -top-7 left-1/2 h-7 w-7 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              )}
              <div
                className={`flex items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink font-display font-bold text-white ${
                  first ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-lg'
                }`}
                style={{ boxShadow: `0 0 0 3px ${color}66, 0 0 28px -4px ${color}` }}
              >
                {w.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Identité + lot */}
            <div className="mb-3 text-center">
              <div className={`truncate font-bold text-white ${first ? 'text-base' : 'text-sm'}`}>{w.username}</div>
              <div className="truncate text-xs text-white/40">{w.item_name}</div>
              <div className="stat-numeral mt-0.5 text-success" style={{ fontSize: first ? '1.4rem' : '1.1rem' }}>
                {w.item_value.toLocaleString()}€
              </div>
            </div>

            {/* Marche du podium */}
            <div
              className={`relative w-full ${height} rounded-t-xl border border-b-0 overflow-hidden`}
              style={{
                borderColor: `${color}55`,
                background: `linear-gradient(180deg, ${color}26, ${color}08 70%, transparent)`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
              <span
                className="absolute inset-0 flex items-center justify-center title-giant text-4xl opacity-60"
                style={{ color, textShadow: `0 0 18px ${color}99` }}
                aria-hidden="true"
              >
                {rank}
              </span>
              <span className="sr-only">{label}</span>
            </div>
          </div>
        )
      })}
      </div>

      {/* Ligne de scène sous le podium */}
      <div
        aria-hidden="true"
        className="mx-auto h-[2px] w-[min(680px,90%)] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent"
        style={{ boxShadow: '0 0 18px rgba(255,215,0,0.45)' }}
      />
    </div>
  )
}
