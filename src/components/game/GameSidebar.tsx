'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'

type RecentClick = {
  id: string
  username: string
  clickedAt: string
}

interface GameSidebarProps {
  credits: number
  totalClicks: number
  lastClickUsername: string | null
  isConnected: boolean
  recentClicks: RecentClick[]
}

export const GameSidebar = memo(function GameSidebar({
  credits,
  totalClicks,
  lastClickUsername,
  isConnected,
  recentClicks,
}: GameSidebarProps) {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Credits card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 border border-neon-purple/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">
              Mes credits
            </div>
            <motion.div
              key={credits}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-neon-purple"
            >
              {credits}
            </motion.div>
          </div>
          <div className="text-5xl">💰</div>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-bg-secondary/30 border border-white/5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>📊</span> Statistiques
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-text-secondary text-sm">Total clics</span>
            <motion.span
              key={totalClicks}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-neon-blue"
            >
              {totalClicks}
            </motion.span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-text-secondary text-sm">Leader</span>
            <span className="font-semibold text-neon-purple truncate ml-2 max-w-[120px]">
              {lastClickUsername || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-text-secondary text-sm">Connexion</span>
            <span className={`flex items-center gap-2 text-sm ${isConnected ? 'text-success' : 'text-danger'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
              {isConnected ? 'Live' : 'Off'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Recent clicks */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl bg-bg-secondary/30 border border-white/5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>👆</span> Derniers clics
        </h3>
        {recentClicks.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentClicks.map((click, index) => (
              <motion.div
                key={click.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex justify-between items-center py-2 px-3 rounded-xl text-sm
                  ${index === 0
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                    : 'text-text-secondary hover:bg-white/5'
                  }
                `}
              >
                <span className="flex items-center gap-2 truncate">
                  {index === 0 && <span>👑</span>}
                  <span className="truncate">{click.username}</span>
                </span>
                <span className="text-xs opacity-75 flex-shrink-0 ml-2">
                  {new Date(click.clickedAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-text-secondary">
            <div className="text-3xl mb-2">🦗</div>
            <p className="text-sm">Aucun clic</p>
            <p className="text-xs mt-1">Sois le premier !</p>
          </div>
        )}
      </motion.div>

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5"
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>📜</span> Regles
        </h3>
        <ul className="text-sm text-text-secondary space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-neon-purple">•</span>
            1 clic = 1 credit
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-blue">•</span>
            Le dernier clic gagne
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-pink">•</span>
            Phase finale : +1min30/clic
          </li>
        </ul>
      </motion.div>
    </div>
  )
})
