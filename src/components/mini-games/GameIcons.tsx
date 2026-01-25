'use client'

import { motion } from 'framer-motion'

interface IconProps {
  className?: string
  animate?: boolean
}

export function WheelIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={animate ? { rotate: 360 } : {}}
      transition={animate ? { duration: 8, repeat: Infinity, ease: 'linear' } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="wheelGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B5CFF" />
            <stop offset="100%" stopColor="#6E36FF" />
          </linearGradient>
          <linearGradient id="wheelGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4FD8" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
          <filter id="wheelGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="url(#wheelGrad1)" strokeWidth="4" filter="url(#wheelGlow)" />

        {/* Segments */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * 45) * (Math.PI / 180)
          const x1 = 50 + 20 * Math.cos(angle)
          const y1 = 50 + 20 * Math.sin(angle)
          const x2 = 50 + 42 * Math.cos(angle)
          const y2 = 50 + 42 * Math.sin(angle)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i % 2 === 0 ? '#9B5CFF' : '#FF4FD8'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}

        {/* Center */}
        <circle cx="50" cy="50" r="18" fill="url(#wheelGrad2)" />
        <circle cx="50" cy="50" r="12" fill="#0B0F1A" />
        <circle cx="50" cy="50" r="6" fill="url(#wheelGrad1)" />

        {/* Pointer */}
        <polygon points="50,8 45,18 55,18" fill="#FFB800" filter="url(#wheelGlow)" />
      </svg>
    </motion.div>
  )
}

export function ScratchIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={animate ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="scratchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4FD8" />
            <stop offset="100%" stopColor="#D434B1" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C0C0C0" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C0C0C0" />
          </linearGradient>
          <filter id="scratchGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Card background */}
        <rect x="15" y="20" width="70" height="50" rx="6" fill="url(#scratchGrad)" filter="url(#scratchGlow)" />

        {/* Scratch overlay */}
        <rect x="20" y="25" width="60" height="40" rx="4" fill="url(#cardGrad)" />

        {/* Scratch marks */}
        <path d="M25 35 Q35 30 45 40 T65 35" stroke="#FF4FD8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M30 50 Q40 45 50 55 T70 50" stroke="#9B5CFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Star reward hint */}
        <polygon points="50,32 52,38 58,38 53,42 55,48 50,45 45,48 47,42 42,38 48,38" fill="#FFB800" opacity="0.5" />

        {/* Coin icon */}
        <circle cx="75" cy="75" r="12" fill="#FFB800" filter="url(#scratchGlow)" />
        <text x="75" y="79" textAnchor="middle" fill="#0B0F1A" fontSize="12" fontWeight="bold">$</text>
      </svg>
    </motion.div>
  )
}

export function PachinkoIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* Frame gradient with metallic effect */}
          <linearGradient id="pachinkoFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3CCBFF" />
            <stop offset="50%" stopColor="#1DA1D1" />
            <stop offset="100%" stopColor="#3CCBFF" />
          </linearGradient>
          {/* Inner board dark gradient */}
          <linearGradient id="pachinkoBoard" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0F1A" />
            <stop offset="100%" stopColor="#141B2D" />
          </linearGradient>
          {/* Shiny metallic ball */}
          <radialGradient id="ballGrad" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E8E8E8" />
            <stop offset="60%" stopColor="#B8B8B8" />
            <stop offset="100%" stopColor="#808080" />
          </radialGradient>
          {/* Ball shine highlight */}
          <radialGradient id="ballShine" cx="30%" cy="30%" r="30%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          {/* Peg gradients */}
          <radialGradient id="pegGrad" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#FF4FD8" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </radialGradient>
          {/* Glow filters */}
          <filter id="pachinkoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="ballShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Outer frame with 3D effect */}
        <rect x="12" y="5" width="76" height="90" rx="10" fill="#1E2942" />
        <rect x="14" y="7" width="72" height="86" rx="8" fill="url(#pachinkoBoard)" stroke="url(#pachinkoFrame)" strokeWidth="2" />

        {/* Inner neon border accent */}
        <rect x="18" y="11" width="64" height="78" rx="6" fill="none" stroke="#3CCBFF" strokeWidth="0.5" opacity="0.4" />

        {/* Top launcher area */}
        <rect x="70" y="14" width="8" height="20" rx="2" fill="#1E2942" stroke="#3CCBFF" strokeWidth="0.5" />
        <circle cx="74" cy="18" r="2" fill="#3CCBFF" filter="url(#pachinkoGlow)" />

        {/* Pegs - denser grid pattern */}
        {[
          // Row 1
          [35, 28], [50, 28], [65, 28],
          // Row 2
          [28, 38], [42, 38], [58, 38], [72, 38],
          // Row 3
          [35, 48], [50, 48], [65, 48],
          // Row 4
          [28, 58], [42, 58], [58, 58], [72, 58],
          // Row 5
          [35, 68], [50, 68], [65, 68],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3.5" fill="url(#pegGrad)" filter="url(#pachinkoGlow)" />
            <circle cx={cx - 0.8} cy={cy - 0.8} r="1" fill="white" opacity="0.6" />
          </g>
        ))}

        {/* Prize slots at bottom */}
        <g>
          {/* Slot dividers */}
          {[24, 38, 50, 62, 76].map((x, i) => (
            <rect key={i} x={x} y="76" width="2" height="12" fill="#1E2942" />
          ))}
          {/* Slot backgrounds with values */}
          {[
            { x: 26, color: '#1E2942', glow: false },
            { x: 40, color: '#9B5CFF', glow: true },
            { x: 52, color: '#FFB800', glow: true },
            { x: 64, color: '#9B5CFF', glow: true },
            { x: 76, color: '#1E2942', glow: false },
          ].map((slot, i) => (
            <rect
              key={i}
              x={slot.x - 2}
              y="78"
              width="10"
              height="8"
              rx="1"
              fill={slot.color}
              filter={slot.glow ? 'url(#pachinkoGlow)' : undefined}
              opacity={slot.glow ? 1 : 0.5}
            />
          ))}
        </g>

        {/* Animated ball */}
        <motion.g
          animate={animate ? {
            y: [0, 15, 25, 40, 55, 50],
            x: [0, -8, 12, -5, 8, 2],
          } : {}}
          transition={animate ? {
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          } : {}}
        >
          {/* Ball shadow */}
          <ellipse cx="50" cy="24" rx="4" ry="1.5" fill="#000" opacity="0.3" />
          {/* Main ball */}
          <circle cx="50" cy="20" r="5" fill="url(#ballGrad)" filter="url(#ballShadow)" />
          {/* Ball shine */}
          <circle cx="48" cy="18" r="2" fill="url(#ballShine)" />
          {/* Ball edge highlight */}
          <circle cx="50" cy="20" r="4.5" fill="none" stroke="#FFF" strokeWidth="0.3" opacity="0.5" />
        </motion.g>

        {/* Decorative corner accents */}
        <circle cx="20" cy="12" r="1.5" fill="#3CCBFF" opacity="0.6" />
        <circle cx="80" cy="12" r="1.5" fill="#3CCBFF" opacity="0.6" />
      </svg>
    </motion.div>
  )
}

export function CreditIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="creditGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#creditGrad)" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#0B0F1A" strokeWidth="1" opacity="0.3" />
      <text x="12" y="16" textAnchor="middle" fill="#0B0F1A" fontSize="10" fontWeight="bold">C</text>
    </svg>
  )
}

export function SlotsIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={animate ? { scale: [1, 1.02, 1] } : {}}
      transition={animate ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="slotsFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="50%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
          <linearGradient id="slotsInner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0F1A" />
            <stop offset="100%" stopColor="#141B2D" />
          </linearGradient>
          <filter id="slotsGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Machine frame */}
        <rect x="10" y="15" width="80" height="70" rx="8" fill="#1E2942" />
        <rect x="12" y="17" width="76" height="66" rx="6" fill="url(#slotsInner)" stroke="url(#slotsFrame)" strokeWidth="2" />

        {/* Title bar */}
        <rect x="20" y="22" width="60" height="10" rx="3" fill="#FFB800" filter="url(#slotsGlow)" />
        <text x="50" y="30" textAnchor="middle" fill="#0B0F1A" fontSize="7" fontWeight="bold">JACKPOT</text>

        {/* Reels */}
        {[25, 45, 65].map((x, i) => (
          <g key={i}>
            <rect x={x - 8} y="38" width="16" height="28" rx="2" fill="#0B0F1A" stroke="#3CCBFF" strokeWidth="0.5" />
            <motion.g
              animate={animate ? { y: [0, -3, 0, 3, 0] } : {}}
              transition={animate ? { duration: 0.3, repeat: Infinity, delay: i * 0.1 } : {}}
            >
              <text x={x} y="56" textAnchor="middle" fontSize="16">
                {['🍒', '💎', '7️⃣'][i]}
              </text>
            </motion.g>
          </g>
        ))}

        {/* Lever */}
        <rect x="85" y="35" width="5" height="30" rx="2" fill="#9B5CFF" filter="url(#slotsGlow)" />
        <circle cx="87.5" cy="32" r="5" fill="#FF4FD8" filter="url(#slotsGlow)" />

        {/* Bottom lights */}
        {[25, 40, 55, 70].map((x, i) => (
          <motion.circle
            key={i}
            cx={x}
            cy="75"
            r="3"
            fill={['#9B5CFF', '#FF4FD8', '#3CCBFF', '#FFB800'][i]}
            animate={animate ? { opacity: [0.4, 1, 0.4] } : {}}
            transition={animate ? { duration: 0.5, repeat: Infinity, delay: i * 0.15 } : {}}
            filter="url(#slotsGlow)"
          />
        ))}
      </svg>
    </motion.div>
  )
}

export function CoinFlipIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={animate ? { rotateY: [0, 180, 360] } : {}}
      transition={animate ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{ perspective: 1000 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="30%" stopColor="#FFB800" />
            <stop offset="70%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
          <linearGradient id="coinShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="coinGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="coinShadow">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Shadow ellipse */}
        <ellipse cx="50" cy="85" rx="25" ry="6" fill="#000" opacity="0.3" />

        {/* Main coin */}
        <ellipse cx="50" cy="50" rx="35" ry="35" fill="url(#coinGold)" filter="url(#coinShadow)" />

        {/* Coin edge (3D effect) */}
        <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="#B8860B" strokeWidth="3" />
        <ellipse cx="50" cy="52" rx="33" ry="33" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.5" />

        {/* Inner ring */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="#0B0F1A" strokeWidth="1.5" opacity="0.3" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#0B0F1A" strokeWidth="0.5" opacity="0.2" />

        {/* Crown symbol */}
        <g fill="#0B0F1A" opacity="0.8">
          <path d="M35 55 L40 40 L45 50 L50 35 L55 50 L60 40 L65 55 Z" />
          <rect x="35" y="55" width="30" height="5" rx="1" />
        </g>

        {/* Shine effect */}
        <ellipse cx="50" cy="50" rx="32" ry="32" fill="url(#coinShine)" />

        {/* Highlight */}
        <ellipse cx="38" cy="38" rx="8" ry="6" fill="#FFF" opacity="0.3" transform="rotate(-30 38 38)" />

        {/* Glow effect */}
        <circle cx="50" cy="50" r="36" fill="none" stroke="#FFB800" strokeWidth="1" opacity="0.5" filter="url(#coinGlow)" />
      </svg>
    </motion.div>
  )
}

export function DiceIcon({ className = '', animate = false }: IconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={animate ? { rotate: [0, 10, -10, 5, 0] } : {}}
      transition={animate ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="diceGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B5CFF" />
            <stop offset="100%" stopColor="#6E36FF" />
          </linearGradient>
          <linearGradient id="diceGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4FD8" />
            <stop offset="100%" stopColor="#D434B1" />
          </linearGradient>
          <filter id="diceGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="diceShadow">
            <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Dice 1 (purple) - tilted left */}
        <g transform="translate(15, 25) rotate(-15)">
          <rect x="0" y="0" width="35" height="35" rx="6" fill="url(#diceGrad1)" filter="url(#diceShadow)" />
          <rect x="0" y="0" width="35" height="35" rx="6" fill="none" stroke="#FFF" strokeWidth="0.5" opacity="0.3" />
          {/* Dots for 6 */}
          {[[8, 8], [8, 17.5], [8, 27], [27, 8], [27, 17.5], [27, 27]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="#FFF" />
          ))}
        </g>

        {/* Dice 2 (pink) - tilted right */}
        <g transform="translate(50, 35) rotate(15)">
          <rect x="0" y="0" width="35" height="35" rx="6" fill="url(#diceGrad2)" filter="url(#diceShadow)" />
          <rect x="0" y="0" width="35" height="35" rx="6" fill="none" stroke="#FFF" strokeWidth="0.5" opacity="0.3" />
          {/* Dots for 5 */}
          {[[8, 8], [8, 27], [17.5, 17.5], [27, 8], [27, 27]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="#FFF" />
          ))}
        </g>

        {/* Glow circles */}
        <circle cx="32" cy="42" r="20" fill="none" stroke="#9B5CFF" strokeWidth="1" opacity="0.3" filter="url(#diceGlow)" />
        <circle cx="68" cy="52" r="20" fill="none" stroke="#FF4FD8" strokeWidth="1" opacity="0.3" filter="url(#diceGlow)" />

        {/* Sparkles */}
        <motion.g
          animate={animate ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={animate ? { duration: 0.8, repeat: Infinity } : {}}
        >
          <polygon points="20,15 22,18 25,15 22,12" fill="#FFB800" />
          <polygon points="80,65 82,68 85,65 82,62" fill="#FFB800" />
          <polygon points="45,75 47,78 50,75 47,72" fill="#3CCBFF" />
        </motion.g>
      </svg>
    </motion.div>
  )
}
