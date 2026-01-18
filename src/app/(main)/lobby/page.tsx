import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { checkAndResetDailyCredits } from '@/actions/credits'
import type { Game, Item } from '@/types/database'

type GameWithItem = Game & {
  item: Item
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Credits display */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="glass rounded-xl px-6 py-3">
            <span className="text-text-secondary text-sm">Crédits disponibles</span>
            <div className="text-2xl font-bold text-neon-purple neon-text">{credits}</div>
          </div>
          {wasReset && (
            <div className="glass rounded-lg px-4 py-2 border-success/30 text-success text-sm">
              Crédits réinitialisés pour aujourd&apos;hui
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Parties en cours
        </h1>
        <p className="text-text-secondary">
          Choisis une partie et tente ta chance. Le dernier clic gagne !
        </p>
      </div>

      {/* Games grid */}
      {games && games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Aucune partie en cours
            </h3>
            <p className="text-text-secondary mb-4">
              Reviens plus tard pour participer à une partie !
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          icon="⏱️"
          title="Timer 24h"
          description="Chaque partie dure 24 heures. Quand il reste moins d'1 minute, chaque clic remet le timer à 1 minute."
        />
        <InfoCard
          icon="🎯"
          title="1 clic = 1 crédit"
          description="Chaque clic coûte 1 crédit. Utilise-les stratégiquement pour maximiser tes chances."
        />
        <InfoCard
          icon="🏆"
          title="Le dernier gagne"
          description="Le dernier joueur à avoir cliqué quand le timer atteint zéro remporte l'objet."
        />
      </div>
    </div>
  )
}

function GameCard({ game }: { game: GameWithItem }) {
  const timeLeft = game.end_time ? calculateTimeLeft(game.end_time) : 0
  const isUrgent = timeLeft > 0 && timeLeft <= 60000 // Less than 1 minute

  return (
    <Card
      variant={isUrgent ? 'neon' : 'gradient'}
      hover
      className={`overflow-hidden group ${isUrgent ? 'border-danger/50 shadow-danger/20' : ''}`}
    >
      {/* Item image */}
      <div className="relative aspect-square bg-bg-tertiary flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        <img
          src={game.item.image_url}
          alt={game.item.name}
          className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
        />
        {isUrgent && (
          <div className="absolute top-3 right-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-20">
            Phase finale !
          </div>
        )}
      </div>

      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{game.item.name}</CardTitle>
          {game.item.retail_value && (
            <span className="text-success font-bold neon-text-success">
              {game.item.retail_value.toFixed(0)}€
            </span>
          )}
        </div>
        {game.item.description && (
          <CardDescription className="line-clamp-2">
            {game.item.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Timer */}
        <div className={`text-center p-4 rounded-xl ${isUrgent ? 'bg-danger/20 border border-danger/30' : 'bg-bg-tertiary/50'}`}>
          <div className="text-xs text-text-secondary mb-1 uppercase tracking-wider">
            {game.status === 'waiting' ? 'Commence bientôt' : isUrgent ? '⚡ Phase finale' : 'Temps restant'}
          </div>
          <div className={`text-3xl font-mono font-bold ${isUrgent ? 'text-danger neon-text-danger animate-pulse' : 'text-neon-blue neon-text-blue'}`}>
            {game.status === 'waiting' ? '--:--:--' : formatTime(timeLeft)}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm bg-bg-tertiary/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span className="text-text-primary font-medium">
              {game.last_click_username || '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-secondary">Clics :</span>
            <span className="text-neon-purple font-bold">{game.total_clicks}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/game/${game.id}`} className="block">
          <Button
            className="w-full"
            variant={isUrgent ? 'neon-pink' : 'neon'}
            size="lg"
            glow={isUrgent}
          >
            {isUrgent ? '🔥 Rejoindre maintenant' : 'Rejoindre la partie'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card variant="glass" className="text-center">
      <CardContent className="pt-6">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </CardContent>
    </Card>
  )
}
