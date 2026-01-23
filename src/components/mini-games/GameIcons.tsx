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
          <linearGradient id="pachinkoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3CCBFF" />
            <stop offset="100%" stopColor="#1DA1D1" />
          </linearGradient>
          <radialGradient id="ballGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#3CCBFF" />
            <stop offset="100%" stopColor="#0066FF" />
          </radialGradient>
          <filter id="pachinkoGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Board frame */}
        <rect x="15" y="10" width="70" height="80" rx="8" fill="none" stroke="url(#pachinkoGrad)" strokeWidth="3" filter="url(#pachinkoGlow)" />

        {/* Pegs - pyramid pattern */}
        {[
          [50, 25],
          [35, 40], [65, 40],
          [25, 55], [50, 55], [75, 55],
          [35, 70], [65, 70],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#9B5CFF" filter="url(#pachinkoGlow)" />
        ))}

        {/* Ball */}
        <motion.circle
          cx="50"
          cy="20"
          r="6"
          fill="url(#ballGrad)"
          filter="url(#pachinkoGlow)"
          animate={animate ? {
            y: [0, 60, 0],
            x: [0, 15, -10, 5, 0],
          } : {}}
          transition={animate ? {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        />

        {/* Slots at bottom */}
        {[-1, 0, 1].map((i) => (
          <rect key={i} x={42 + i * 15} y="82" width="12" height="6" rx="1" fill={i === 0 ? '#FFB800' : '#1E2942'} />
        ))}
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
