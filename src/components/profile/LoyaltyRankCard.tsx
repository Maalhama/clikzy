import { getLoyaltyRank, LOYALTY_RANKS } from '@/lib/loyalty'

/**
 * Carte « Rang de fidélité » (Lot H). Affiche le rang courant (Bronze→Diamant),
 * la progression vers le suivant et l'échelle complète. Statut gratuit, distinct
 * du niveau (XP) ; basé sur les clics cumulés. Présentationnel (pas d'état).
 */
export function LoyaltyRankCard({ totalClicks }: { totalClicks: number }) {
  const { current, next, clicksToNext, progress } = getLoyaltyRank(totalClicks)

  return (
    <section className="panel mt-8 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-white">Rang de fidélité</h2>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${current.ring} ${current.color}`}>
          <span aria-hidden>{current.emoji}</span> {current.name}
        </span>
      </div>

      <p className="mt-1 text-sm text-white/60">
        Ta fidélité te fait grimper les rangs au fil de tes clics. C&apos;est un statut, en plus
        de ton niveau — gratuit, pour tout le monde.
      </p>

      {next ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{current.name}</span>
            <span>
              Plus que <span className="font-semibold text-white">{clicksToNext.toLocaleString('fr-FR')}</span> clics → {next.emoji} {next.name}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-neon-blue transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-neon-blue">Rang maximum atteint — tu fais partie des plus fidèles. 💎</p>
      )}

      {/* Échelle complète */}
      <div className="mt-4 flex flex-wrap gap-2">
        {LOYALTY_RANKS.map((r) => {
          const reached = totalClicks >= r.min
          const isCurrent = r.key === current.key
          return (
            <span
              key={r.key}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                isCurrent ? `${r.ring} ${r.color} font-bold` : reached ? 'border-white/15 bg-white/[0.04] text-white/70' : 'border-white/10 bg-transparent text-white/35'
              }`}
              title={`${r.name} — ${r.min.toLocaleString('fr-FR')} clics`}
            >
              <span aria-hidden>{r.emoji}</span> {r.name}
            </span>
          )
        })}
      </div>
    </section>
  )
}
