'use client'

import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  href?: string
}

export function Logo({ size = 'md', animated = true, href = '/' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  const cursorSizes = {
    sm: { width: 14, height: 14, trail: 20 },
    md: { width: 18, height: 18, trail: 26 },
    lg: { width: 24, height: 24, trail: 34 },
  }

  const cursorSize = cursorSizes[size]

  const logoContent = (
    <div className="relative inline-flex items-center">
      {/* Logo text */}
      <span className={`${sizeClasses[size]} font-black tracking-tighter relative`}>
        {/* Glow layer */}
        <span className="absolute inset-0 blur-sm opacity-70">
          <span className="text-neon-purple">CLIK</span>
          <span className="text-neon-pink">ZY</span>
        </span>
        {/* Main text */}
        <span className="relative">
          <span className="text-neon-purple neon-text">CLIK</span>
          <span className="text-neon-pink neon-text-pink">ZY</span>
        </span>
      </span>

      {/* Fixed neon cursor clicking on the logo */}
      {animated && (
        <div
          className="absolute left-[70%] top-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: cursorSize.width,
            height: cursorSize.height,
          }}
        >
          {/* Trail effect - neon glow behind cursor */}
          <div
            className="absolute animate-pulse"
            style={{
              width: cursorSize.trail,
              height: cursorSize.trail,
              top: -4,
              left: -6,
              background: 'linear-gradient(135deg, rgba(155, 92, 255, 0.6), rgba(255, 79, 216, 0.4))',
              filter: 'blur(8px)',
              borderRadius: '50%',
            }}
          />
          {/* Secondary trail - longer fade */}
          <div
            className="absolute"
            style={{
              width: cursorSize.trail * 1.5,
              height: cursorSize.trail * 0.6,
              top: -8,
              left: -14,
              background: 'linear-gradient(90deg, rgba(155, 92, 255, 0.3), transparent)',
              filter: 'blur(6px)',
              borderRadius: '50%',
              transform: 'rotate(-45deg)',
            }}
          />
          {/* Neon cursor icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(255,79,216,0.8)]"
          >
            <path
              d="M5 3l14 9-7 2-3 7-4-18z"
              fill="url(#logoCursorGradient)"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logoCursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9B5CFF" />
                <stop offset="100%" stopColor="#FF4FD8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Click ripple effect */}
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: 6,
              height: 6,
              bottom: 2,
              left: 2,
              background: 'rgba(255, 79, 216, 0.6)',
            }}
          />
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
