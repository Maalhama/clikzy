'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getProductSvg } from '@/lib/utils/productImages'
import type { GameHistoryItem } from '@/actions/gameHistory'

interface GameHistorySectionProps {
  history: GameHistoryItem[]
  stats: {
    totalGames: number
    totalClicks: number
    wins: number
    winRate: number
  }
}

export function GameHistorySection({ history, stats }: GameHistorySectionProps) {
  const [showAll, setShowAll] = useState(false)
  const displayedHistory = showAll ? history : history.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historique des parties
        </h2>
        {history.length > 0 && (
          <span className="px-2 py-1 rounded-lg bg-neon-pink/10 text-neon-pink text-xs font-medium">
            {stats.totalGames} partie{stats.totalGames > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {history.length > 0 ? (
        <>
          {/* History List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedHistory.map((game, index) => (
                <HistoryCard key={game.id} game={game} index={index} />
              ))}
            </AnimatePresence>
          </div>

          {/* Show more button */}
          {history.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {showAll ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Voir moins
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Voir tout ({history.length - 5} de plus)
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <EmptyHistoryState />
      )}
    </motion.div>
  )
}

function HistoryCard({ game, index }: { game: GameHistoryItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        game.won
          ? 'bg-success/5 border-success/30 hover:border-success/50'
          : 'bg-bg-secondary/50 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Product Image */}
      <div className="relative w-12 h-12 rounded-lg bg-bg-primary/50 flex-shrink-0 overflow-hidden">
        <Image
          src={getProductSvg(game.itemName)}
          alt={game.itemName}
          fill
          className="object-contain p-1"
        />
        {game.won && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white text-sm truncate">{game.itemName}</h3>
          {game.won && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success uppercase">
              Gagné
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>{new Date(game.playedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          <span>•</span>
          <span>{game.clickCount} clic{game.clickCount > 1 ? 's' : ''}</span>
          {!game.won && game.winnerUsername && (
            <>
              <span>•</span>
              <span className="text-neon-purple">
                Gagnant: {game.winnerUsername}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Value */}
      {game.itemValue && (
        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
          game.won
            ? 'bg-success/20 text-success'
            : 'bg-white/10 text-white/60'
        }`}>
          {game.itemValue.toFixed(0)}€
        </span>
      )}
    </motion.div>
  )
}

function EmptyHistoryState() {
  return (
    <div className="rounded-2xl bg-bg-secondary/30 border border-white/10 p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-white mb-1">Aucune partie jouée</h3>
      <p className="text-white/50 text-sm">
        Ton historique apparaîtra ici après ta première partie.
      </p>
    </div>
  )
}
