'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

// Neon color palette
const NEON_COLORS = {
  purple: '#9B5CFF',
  blue: '#3CCBFF',
  pink: '#FF4FD8',
}

interface BackgroundEffectsProps {
  /** Reduce effects for better performance on secondary pages */
  simplified?: boolean
}

export function BackgroundEffects({ simplified = false }: BackgroundEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useGSAP(() => {
    // Skip all animations on mobile for performance
    if (!containerRef.current || isMobile) return

    const ctx = gsap.context(() => {
      // Animate geometric shapes with rotation and glow pulse
      gsap.utils.toArray<HTMLElement>('.bg-geo-shape').forEach((shape, i) => {
        const duration = 20 + (i % 5) * 5
        const rotation = 360 * (i % 2 === 0 ? 1 : -1)

        gsap.to(shape, {
          rotation: rotation,
          duration: duration,
          ease: 'none',
          repeat: -1,
        })

        // Subtle scale pulsing
        gsap.to(shape, {
          scale: 1 + (i % 3) * 0.05,
          duration: duration / 3,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      // Floating particles animation with glow
      gsap.utils.toArray<HTMLElement>('.bg-particle').forEach((particle, i) => {
        const duration = 8 + (i % 5) * 2
        const yMove = 30 + (i % 4) * 15
        const xMove = 10 + (i % 3) * 10

        gsap.to(particle, {
          y: yMove,
          x: xMove * (i % 2 === 0 ? 1 : -1),
          duration: duration,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.15,
        })

        // Fade in/out with glow intensity
        gsap.to(particle, {
          opacity: 0.4 + (i % 3) * 0.2,
          duration: duration / 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      // Animate connecting lines with draw effect
      gsap.to('.bg-connect-line', {
        strokeDashoffset: 0,
        duration: 3,
        stagger: 0.5,
        ease: 'power2.inOut',
      })

      // Glow orbs movement - smooth floating
      gsap.utils.toArray<HTMLElement>('.bg-glow-orb').forEach((orb, i) => {
        gsap.to(orb, {
          x: 50 * (i % 2 === 0 ? 1 : -1),
          y: 30 * (i % 2 === 0 ? -1 : 1),
          duration: 15 + i * 3,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })

        // Subtle opacity breathing
        gsap.to(orb, {
          opacity: 0.12 + (i % 2) * 0.05,
          duration: 8 + i * 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      // Ambient glow spots pulsing
      gsap.utils.toArray<HTMLElement>('.bg-ambient-glow').forEach((glow, i) => {
        gsap.to(glow, {
          scale: 1.2,
          opacity: 0.8,
          duration: 4 + i,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.5,
        })
      })

      // Diagonal accent lines shimmer
      gsap.utils.toArray<HTMLElement>('.bg-accent-line').forEach((line, i) => {
        gsap.to(line, {
          opacity: 0.6,
          x: 10,
          duration: 8 + i * 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 2,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [isMobile] })

  // No particles on mobile, fewer if simplified
  const particleCount = isMobile ? 0 : (simplified ? 15 : 25)

  // Mobile: render minimal static background with reduced blur
  if (isMobile) {
    return (
      <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Simple gradient background for mobile - minimal blur for performance */}
        <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-neon-purple/8 rounded-full blur-2xl" />
        <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-neon-blue/8 rounded-full blur-2xl" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid pattern with neon glow */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #9B5CFF 1px, transparent 1px),
            linear-gradient(#9B5CFF 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Glow orbs */}
      <div className="bg-glow-orb absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[150px]" />
      <div className="bg-glow-orb absolute bottom-[25%] right-[15%] w-[400px] h-[400px] bg-neon-blue/8 rounded-full blur-[120px]" />

      {/* Geometric shapes - hidden on mobile for performance */}
      <div className="hidden md:block">
        {/* Top area */}
        <div
          className="bg-geo-shape absolute top-[5%] right-[15%] w-24 h-24 border border-neon-purple/30 rotate-45"
          style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.2)' }}
        />
        <div
          className="bg-geo-shape absolute top-[8%] left-[10%] w-16 h-16 rounded-full border border-neon-blue/25"
          style={{ boxShadow: '0 0 12px rgba(60, 203, 255, 0.15)' }}
        />

        {/* Middle */}
        <div
          className="bg-geo-shape absolute top-[30%] right-[8%] w-12 h-12 bg-neon-blue/10 border border-neon-blue/30 rotate-45"
          style={{ boxShadow: '0 0 15px rgba(60, 203, 255, 0.2)' }}
        />
        <div className="bg-geo-shape absolute top-[50%] left-[15%] w-20 h-20 rounded-full border border-neon-blue/20" />
        <div
          className="bg-geo-shape absolute top-[55%] right-[5%] w-24 h-24 border border-neon-purple/20 rotate-[15deg]"
          style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.15)' }}
        />

        {/* Bottom */}
        <div
          className="bg-geo-shape absolute top-[70%] right-[20%] w-28 h-28 rounded-full border-2 border-dashed border-neon-blue/15"
        />
        <div
          className="bg-geo-shape absolute bottom-[10%] right-[35%] w-20 h-20 border border-neon-blue/25 rotate-12"
          style={{ boxShadow: '0 0 12px rgba(60, 203, 255, 0.15)' }}
        />
        <div className="bg-geo-shape absolute bottom-[5%] left-[20%] w-24 h-24 rounded-full border border-neon-pink/20" />

        {/* Triangle */}
        <div
          className="bg-geo-shape absolute top-[20%] right-[25%] w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[40px] border-b-neon-purple/20"
          style={{ filter: 'drop-shadow(0 0 8px rgba(155, 92, 255, 0.3))' }}
        />
      </div>

      {/* Mobile geometric shapes - simplified */}
      <div className="md:hidden">
        <div
          className="bg-geo-shape absolute top-[10%] right-[10%] w-16 h-16 border border-neon-purple/20 rotate-45"
          style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.15)' }}
        />
        <div
          className="bg-geo-shape absolute bottom-[20%] left-[10%] w-12 h-12 rounded-full border border-neon-blue/20"
        />
        <div
          className="bg-geo-shape absolute top-[60%] right-[5%] w-14 h-14 border border-neon-pink/15 rotate-12"
        />
      </div>

      {/* SVG connecting lines with glow filter - hidden on mobile */}
      <svg className="absolute inset-0 w-full h-full hidden md:block" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="bgLineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#3CCBFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="bgLineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4FD8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#9B5CFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF4FD8" stopOpacity="0.15" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Curved lines with draw effect */}
        <path
          className="bg-connect-line"
          d="M 0 300 Q 400 200, 800 350 T 1600 250"
          fill="none"
          stroke="url(#bgLineGradient1)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
        <path
          className="bg-connect-line"
          d="M 0 700 Q 300 600, 700 750 T 1400 650"
          fill="none"
          stroke="url(#bgLineGradient2)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
      </svg>

      {/* Floating particles with glow */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const left = ((i * 17 + 5) % 95)
        const top = ((i * 23 + 7) % 90)
        const size = 1 + (i % 4)
        const color = i % 3 === 0 ? NEON_COLORS.purple : i % 3 === 1 ? NEON_COLORS.blue : NEON_COLORS.pink
        return (
          <div
            key={i}
            className="bg-particle absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              opacity: 0.3 + (i % 4) * 0.1,
            }}
          />
        )
      })}

      {/* Diagonal accent lines */}
      <div
        className="bg-accent-line absolute top-[30%] left-0 w-full h-[1px] transform -skew-y-3"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(155, 92, 255, 0.25), transparent)',
          opacity: 0.3,
        }}
      />
      <div
        className="bg-accent-line absolute top-[70%] left-0 w-full h-[1px] transform skew-y-2"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(60, 203, 255, 0.2), transparent)',
          opacity: 0.3,
        }}
      />

      {/* Ambient glow spots */}
      <div
        className="bg-ambient-glow absolute top-[35%] left-[60%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-neon-purple"
        style={{
          boxShadow: '0 0 20px 10px rgba(155, 92, 255, 0.2)',
          opacity: 0.4,
        }}
      />
      <div
        className="bg-ambient-glow absolute top-[65%] right-[40%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-neon-blue"
        style={{
          boxShadow: '0 0 20px 10px rgba(60, 203, 255, 0.2)',
          opacity: 0.4,
        }}
      />
    </div>
  )
}
