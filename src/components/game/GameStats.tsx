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

// Neon SVG Icons
const CreditIcon = () => (
  <svg className="w-12 h-12 text-neon-purple drop-shadow-[0_0_10px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" />
  </svg>
)

const StatsIcon = () => (
  <svg className="w-5 h-5 text-neon-blue drop-shadow-[0_0_6px_rgba(60,203,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 4 4 5-6" />
  </svg>
)

const ClickIcon = () => (
  <svg className="w-5 h-5 text-neon-pink drop-shadow-[0_0_6px_rgba(255,79,216,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M15 15l-2 5L9 9l11 4-5 2z" />
    <path d="M14 14l5 5" />
  </svg>
)

const CrownIcon = () => (
  <svg className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
    <rect x="6" y="16" width="12" height="2" rx="0.5" />
  </svg>
)

const EmptyIcon = () => (
  <svg className="w-10 h-10 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={3} />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={3} />
  </svg>
)

const RulesIcon = () => (
  <svg className="w-5 h-5 text-neon-purple drop-shadow-[0_0_6px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)

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
            <CreditIcon />
          </div>
        </CardContent>
      </Card>

      {/* Game statistics */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <StatsIcon /> Statistiques
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
            <ClickIcon /> Derniers clics
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
                    {index === 0 && <CrownIcon />}
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
              <div className="mb-2 flex justify-center"><EmptyIcon /></div>
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
            <RulesIcon /> Rappel des règles
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
              Phase finale : chaque clic remet 1min30
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
