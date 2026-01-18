'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type RecentClick = {
  id: string
  username: string
  clickedAt: string
}

type GameStatsProps = {
  credits: number
  totalClicks: number
  lastClickUsername: string | null
  isConnected: boolean
  recentClicks: RecentClick[]
}

export function GameStats({
  credits,
  totalClicks,
  lastClickUsername,
  isConnected,
  recentClicks,
}: GameStatsProps) {
  return (
    <div className="space-y-6">
      {/* User credits */}
      <Card variant="neon" glow>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-secondary">Mes crédits</div>
              <div className="text-4xl font-bold text-neon-purple neon-text">
                {credits}
              </div>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </CardContent>
      </Card>

      {/* Game statistics */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>📊</span> Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-bg-tertiary/50 rounded-lg">
            <span className="text-text-secondary">Total clics</span>
            <span className="text-2xl font-bold text-neon-blue">{totalClicks}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary/50 rounded-lg">
            <span className="text-text-secondary">Leader actuel</span>
            <span className="font-semibold text-neon-purple">
              {lastClickUsername || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary/50 rounded-lg">
            <span className="text-text-secondary">Connexion</span>
            <span className={`flex items-center gap-2 ${isConnected ? 'text-success' : 'text-danger'}`}>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-success animate-pulse' : 'bg-danger'
                }`}
              />
              {isConnected ? 'En direct' : 'Déconnecté'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent clicks */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>👆</span> Derniers clics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentClicks.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentClicks.map((click, index) => (
                <div
                  key={click.id}
                  className={`
                    flex justify-between items-center py-2 px-3 rounded-lg
                    transition-all duration-300
                    ${index === 0
                      ? 'bg-neon-purple/20 text-neon-purple font-semibold border border-neon-purple/30'
                      : 'text-text-secondary hover:bg-bg-tertiary/50'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {index === 0 && <span className="animate-pulse">👑</span>}
                    {click.username}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(click.clickedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-center py-8">
              <div className="text-4xl mb-2">🦗</div>
              <p>Aucun clic pour le moment</p>
              <p className="text-sm mt-1">Sois le premier !</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules reminder */}
      <Card variant="gradient">
        <CardContent className="p-4">
          <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span>📜</span> Rappel des règles
          </h4>
          <ul className="text-sm text-text-secondary space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-neon-purple">•</span>
              1 clic = 1 crédit
            </li>
            <li className="flex items-center gap-2">
              <span className="text-neon-blue">•</span>
              Le dernier clic avant 0 gagne
            </li>
            <li className="flex items-center gap-2">
              <span className="text-neon-pink">•</span>
              Phase finale : chaque clic remet 1 min
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
