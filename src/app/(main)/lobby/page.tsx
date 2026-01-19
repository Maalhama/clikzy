import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { checkAndResetDailyCredits } from '@/actions/credits'
import type { Game, Item } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

// SVG products disponibles localement
const LOCAL_PRODUCTS = [
  '/products/iphone-15-pro.svg',
  '/products/ps5.svg',
  '/products/macbook-pro.svg',
  '/products/airpods-pro.svg',
  '/products/apple-watch.svg',
  '/products/ipad-pro.svg',
]

// Retourne un SVG local basé sur le nom de l'item ou un aléatoire stable
function getProductImage(itemName: string, itemId: string): string {
  const nameLower = itemName.toLowerCase()

  if (nameLower.includes('iphone')) return '/products/iphone-15-pro.svg'
  if (nameLower.includes('playstation') || nameLower.includes('ps5')) return '/products/ps5.svg'
  if (nameLower.includes('macbook')) return '/products/macbook-pro.svg'
  if (nameLower.includes('airpods')) return '/products/airpods-pro.svg'
  if (nameLower.includes('watch')) return '/products/apple-watch.svg'
  if (nameLower.includes('ipad')) return '/products/ipad-pro.svg'

  // Fallback: utilise l'ID pour un choix stable
  const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return LOCAL_PRODUCTS[hash % LOCAL_PRODUCTS.length]
}

export default async function LobbyPage() {
  const supabase = await createClient()

  // Check and reset daily credits if needed
  const creditsResult = await checkAndResetDailyCredits()
  const credits = creditsResult.success ? (creditsResult.data?.credits ?? 0) : 0
  const wasReset = creditsResult.success ? (creditsResult.data?.wasReset ?? false) : false

  // Get active games with their items
  const { data } = await supabase
    .from('games')
    .select(`
      *,
      item:items(*)
    `)
    .in('status', ['active', 'final_phase', 'waiting'])
    .order('created_at', { ascending: false })

  const games = data as GameWithItem[] | null

  // Count games by status
  const activeCount = games?.filter(g => g.status === 'active' || g.status === 'final_phase').length || 0
  const urgentCount = games?.filter(g => {
    const timeLeft = g.end_time ? calculateTimeLeft(g.end_time) : 0
    return timeLeft > 0 && timeLeft <= 60000
  }).length || 0

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Credits reset notification */}
          {wasReset && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/30 max-w-fit animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-success text-sm">+10 crédits offerts !</div>
                <div className="text-xs text-white/50">Tes crédits quotidiens ont été rechargés</div>
              </div>
            </div>
          )}

          {/* Header with stats */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-xs font-medium mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple" />
                </span>
                {activeCount} parties en cours
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                CHOISIS TON <span className="text-neon-pink">LOT</span>
              </h1>
              <p className="text-white/60 max-w-md">
                Le dernier clic avant la fin du timer remporte l&apos;objet. Utilise tes crédits stratégiquement.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3">
              <div className="px-4 py-3 rounded-xl bg-bg-secondary/50 border border-neon-purple/20">
                <div className="text-2xl font-black text-neon-purple">{credits}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Crédits</div>
              </div>
              {urgentCount > 0 && (
                <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/30 animate-pulse">
                  <div className="text-2xl font-black text-danger">{urgentCount}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Phase finale</div>
                </div>
              )}
            </div>
          </div>

          {/* How it works - Compact */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="p-3 md:p-4 rounded-xl bg-bg-secondary/30 border border-neon-purple/20 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div className="font-bold text-white text-xs md:text-sm">1 clic = 1 crédit</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-0.5">10 gratuits/jour</div>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-bg-secondary/30 border border-neon-blue/20 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-white text-xs md:text-sm">Timer &lt; 1 min</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-0.5">Reset à 1 min</div>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-bg-secondary/30 border border-success/20 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="font-bold text-white text-xs md:text-sm">Dernier = Gagnant</div>
              <div className="text-[10px] md:text-xs text-white/40 mt-0.5">Timer à 0</div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {games && games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucune partie en cours</h3>
              <p className="text-white/50 max-w-sm mx-auto">
                De nouvelles parties arrivent bientôt. Reviens dans quelques instants !
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function GameCard({ game }: { game: GameWithItem }) {
  const timeLeft = game.end_time ? calculateTimeLeft(game.end_time) : 0
  const isUrgent = timeLeft > 0 && timeLeft <= 60000
  const isCritical = timeLeft > 0 && timeLeft <= 10000

  return (
    <Link
      href={`/game/${game.id}`}
      className={`
        group relative block rounded-2xl overflow-hidden
        bg-bg-secondary/50 backdrop-blur-sm
        border transition-all duration-300
        ${isUrgent
          ? 'border-danger/50 hover:border-danger shadow-[0_0_30px_rgba(255,68,68,0.2)]'
          : 'border-white/10 hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(155,92,255,0.2)]'
        }
        hover:-translate-y-1
      `}
    >
      {/* Urgent badge */}
      {isUrgent && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger text-white text-xs font-bold animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {isCritical ? 'DERNIÈRES SECONDES' : 'PHASE FINALE'}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden">
        {/* Glow effect on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          isUrgent ? 'bg-danger/10' : 'bg-neon-purple/10'
        }`} />

        {/* SVG Product avec rotation lente */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-32 h-32 md:w-40 md:h-40 animate-spin-slow group-hover:animate-none group-hover:scale-110 transition-transform duration-500"
          >
            <Image
              src={getProductImage(game.item.name, game.item.id)}
              alt={game.item.name}
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(155,92,255,0.3)]"
              sizes="160px"
            />
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Price tag */}
        {game.item.retail_value && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-success/90 backdrop-blur-sm">
            <span className="font-black text-white">{game.item.retail_value.toFixed(0)}€</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-white text-lg mb-1 truncate group-hover:text-neon-purple transition-colors">
          {game.item.name}
        </h3>
        {game.item.description && (
          <p className="text-white/50 text-sm line-clamp-1 mb-4">{game.item.description}</p>
        )}

        {/* Timer */}
        <div className={`p-3 rounded-xl mb-4 ${
          isUrgent
            ? 'bg-danger/20 border border-danger/30'
            : 'bg-bg-tertiary/50 border border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 uppercase tracking-wider">
              {game.status === 'waiting' ? 'Bientôt' : isUrgent ? '⚡ Vite !' : 'Timer'}
            </span>
            <span className={`font-mono font-bold text-xl ${
              isCritical
                ? 'text-danger animate-pulse'
                : isUrgent
                  ? 'text-danger'
                  : 'text-neon-blue'
            }`}>
              {game.status === 'waiting' ? '--:--' : formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neon-pink/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <div className="text-white/40 text-[10px] uppercase">Leader</div>
              <div className="font-medium text-white text-xs truncate max-w-[100px]">
                {game.last_click_username || '-'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/40 text-[10px] uppercase">Clics</div>
            <div className="font-bold text-neon-purple">{game.total_clicks}</div>
          </div>
        </div>

        {/* CTA */}
        <div className={`mt-4 py-3 rounded-xl text-center font-bold text-sm transition-all ${
          isUrgent
            ? 'bg-danger text-white group-hover:bg-danger/90'
            : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white group-hover:opacity-90'
        }`}
          style={{ boxShadow: isUrgent ? '0 0 20px rgba(255, 68, 68, 0.4)' : '0 0 20px rgba(155, 92, 255, 0.3)' }}
        >
          {isUrgent ? '🔥 CLIQUE MAINTENANT' : 'PARTICIPER'}
        </div>
      </div>
    </Link>
  )
}
