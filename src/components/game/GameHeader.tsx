'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface GameHeaderProps {
  credits: number
  isConnected: boolean
}

export function GameHeader({ credits, isConnected }: GameHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-lg border-b border-white/5"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Back button */}
        <Link
          href="/lobby"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
        >
          <motion.div
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
          <span className="hidden sm:inline text-sm font-medium">Lobby</span>
        </Link>

        {/* Connection status - center on mobile */}
        <div className="flex items-center gap-2">
          <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${isConnected
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-danger/10 text-danger border border-danger/20'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="hidden sm:inline">{isConnected ? 'En direct' : 'Déconnecté'}</span>
          </div>
        </div>

        {/* Credits */}
        <motion.div
          key={credits}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neon-purple/10 border border-neon-purple/20"
        >
          <span className="text-lg">💰</span>
          <span className="font-bold text-neon-purple">{credits}</span>
        </motion.div>
      </div>
    </motion.header>
  )
}
