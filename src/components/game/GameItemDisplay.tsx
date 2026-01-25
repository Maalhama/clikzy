'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Item } from '@/types/database'

// Neon SVG Icon for fallback
const GiftIcon = () => (
  <svg className="w-8 h-8 text-neon-purple drop-shadow-[0_0_10px_rgba(155,92,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <rect x="3" y="8" width="18" height="14" rx="2" />
    <path d="M12 8v14" />
    <path d="M3 12h18" />
    <path d="M12 8c-2-2-4-3-6-2s-2 3 0 4 4 0 6-2z" />
    <path d="M12 8c2-2 4-3 6-2s2 3 0 4-4 0-6-2z" />
  </svg>
)

interface GameItemDisplayProps {
  item: Item
  isUrgent: boolean
  isCritical: boolean
}

export const GameItemDisplay = memo(function GameItemDisplay({
  item,
  isUrgent,
  isCritical,
}: GameItemDisplayProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      className={`
        relative rounded-2xl overflow-hidden
        bg-bg-secondary/30 backdrop-blur-sm
        border transition-all duration-300
        ${isCritical
          ? 'border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          : isUrgent
          ? 'border-neon-pink/30 shadow-[0_0_15px_rgba(255,79,216,0.1)]'
          : 'border-white/5'
        }
      `}
      animate={isCritical ? { scale: [1, 1.01, 1] } : {}}
      transition={isCritical ? { repeat: Infinity, duration: 0.8 } : {}}
    >
      <div className="flex items-center gap-4 p-3 sm:p-4">
        {/* Item image */}
        <div className="relative flex-shrink-0">
          <div className={`
            absolute inset-0 rounded-xl blur-xl transition-opacity
            ${isCritical
              ? 'bg-danger/30 opacity-100'
              : isUrgent
              ? 'bg-neon-pink/20 opacity-100'
              : 'bg-neon-purple/20 opacity-50'
            }
          `} />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-bg-tertiary/50 border border-white/10 flex items-center justify-center overflow-hidden">
            {imgError ? (
              <div className="flex flex-col items-center justify-center">
                <GiftIcon />
              </div>
            ) : (
              <motion.img
                src={item.image_url}
                alt={item.name}
                className="max-w-[90%] max-h-[90%] object-contain"
                animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                transition={isUrgent ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg sm:text-xl truncate">
            {item.name}
          </h2>
          {item.description && (
            <p className="text-text-secondary text-sm mt-0.5 line-clamp-1 hidden sm:block">
              {item.description}
            </p>
          )}
          {item.retail_value && (
            <motion.div
              className="mt-1"
              animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
              transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
            >
              <span className={`
                text-xl sm:text-2xl font-bold
                ${isCritical
                  ? 'text-danger'
                  : isUrgent
                  ? 'text-neon-pink'
                  : 'text-success'
                }
              `}>
                {item.retail_value.toFixed(0)}€
              </span>
            </motion.div>
          )}
        </div>

        {/* Urgency badge - mobile only */}
        {(isUrgent || isCritical) && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className={`
              sm:hidden flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold
              ${isCritical
                ? 'bg-danger/20 text-danger border border-danger/30'
                : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
              }
            `}
          >
{isCritical ? '!!!' : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})
