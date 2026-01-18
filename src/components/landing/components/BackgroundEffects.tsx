'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

// Neon color palette
const NEON_COLORS = {
  purple: '#9B5CFF',
  blue: '#3CCBFF',
  pink: '#FF4FD8',
}

export function BackgroundEffects() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

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
  }, { scope: containerRef })

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

      {/* Glow orbs with enhanced colors */}
      <div className="bg-glow-orb absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[180px]" />
      <div className="bg-glow-orb absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[150px]" />
      <div className="bg-glow-orb absolute bottom-[20%] left-[30%] w-[400px] h-[400px] bg-neon-pink/8 rounded-full blur-[120px]" />
      <div className="bg-glow-orb absolute bottom-[10%] right-[25%] w-[350px] h-[350px] bg-neon-purple/6 rounded-full blur-[100px]" />

      {/* Geometric shapes with enhanced glow */}
      {/* Top area */}
      <div
        className="bg-geo-shape absolute top-[5%] right-[15%] w-24 h-24 border border-neon-purple/30 rotate-45"
        style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.2)' }}
      />
      <div
        className="bg-geo-shape absolute top-[8%] left-[10%] w-16 h-16 rounded-full border border-neon-blue/25"
        style={{ boxShadow: '0 0 12px rgba(60, 203, 255, 0.15)' }}
      />
      <div
        className="bg-geo-shape absolute top-[15%] right-[40%] w-20 h-20 border-2 border-dashed border-neon-pink/20 rotate-12"
        style={{ boxShadow: '0 0 10px rgba(255, 79, 216, 0.15)' }}
      />

      {/* Upper middle */}
      <div
        className="bg-geo-shape absolute top-[25%] left-[5%] w-32 h-32 border border-neon-purple/25 rotate-[30deg]"
        style={{ boxShadow: '0 0 18px rgba(155, 92, 255, 0.2)' }}
      />
      <div
        className="bg-geo-shape absolute top-[30%] right-[8%] w-12 h-12 bg-neon-blue/10 border border-neon-blue/30 rotate-45"
        style={{ boxShadow: '0 0 15px rgba(60, 203, 255, 0.2)' }}
      />
      <div className="bg-geo-shape absolute top-[35%] left-[45%] w-28 h-28 rounded-full border border-dashed border-neon-purple/15" />

      {/* Middle */}
      <div
        className="bg-geo-shape absolute top-[45%] right-[30%] w-14 h-14 border-2 border-neon-pink/25 rotate-[60deg]"
        style={{ boxShadow: '0 0 12px rgba(255, 79, 216, 0.2)' }}
      />
      <div className="bg-geo-shape absolute top-[50%] left-[15%] w-20 h-20 rounded-full border border-neon-blue/20" />
      <div
        className="bg-geo-shape absolute top-[55%] right-[5%] w-24 h-24 border border-neon-purple/20 rotate-[15deg]"
        style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.15)' }}
      />

      {/* Lower middle */}
      <div
        className="bg-geo-shape absolute top-[65%] left-[8%] w-16 h-16 border border-neon-pink/25 rotate-45"
        style={{ boxShadow: '0 0 12px rgba(255, 79, 216, 0.2)' }}
      />
      <div className="bg-geo-shape absolute top-[70%] right-[20%] w-28 h-28 rounded-full border-2 border-dashed border-neon-blue/15" />
      <div
        className="bg-geo-shape absolute top-[75%] left-[35%] w-12 h-12 bg-neon-purple/10 border border-neon-purple/25 rotate-[30deg]"
        style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.2)' }}
      />

      {/* Bottom */}
      <div
        className="bg-geo-shape absolute bottom-[10%] right-[35%] w-20 h-20 border border-neon-blue/25 rotate-12"
        style={{ boxShadow: '0 0 12px rgba(60, 203, 255, 0.15)' }}
      />
      <div className="bg-geo-shape absolute bottom-[5%] left-[20%] w-24 h-24 rounded-full border border-neon-pink/20" />
      <div
        className="bg-geo-shape absolute bottom-[15%] right-[10%] w-16 h-16 border-2 border-neon-purple/20 rotate-45"
        style={{ boxShadow: '0 0 12px rgba(155, 92, 255, 0.15)' }}
      />

      {/* Triangles with drop shadow */}
      <div
        className="bg-geo-shape absolute top-[20%] right-[25%] w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[40px] border-b-neon-purple/20"
        style={{ filter: 'drop-shadow(0 0 8px rgba(155, 92, 255, 0.3))' }}
      />
      <div
        className="bg-geo-shape absolute top-[60%] left-[25%] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-neon-blue/20"
        style={{ filter: 'drop-shadow(0 0 8px rgba(60, 203, 255, 0.3))' }}
      />
      <div
        className="bg-geo-shape absolute bottom-[30%] right-[45%] w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-neon-pink/20"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255, 79, 216, 0.3))' }}
      />

      {/* SVG connecting lines with glow filter */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
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
          d="M 0 200 Q 400 100, 800 250 T 1600 150"
          fill="none"
          stroke="url(#bgLineGradient1)"
          strokeWidth="1.5"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
        <path
          className="bg-connect-line"
          d="M 0 500 Q 300 400, 700 550 T 1400 450"
          fill="none"
          stroke="url(#bgLineGradient2)"
          strokeWidth="1.5"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
        <path
          className="bg-connect-line"
          d="M 100 800 Q 500 700, 900 850 T 1600 750"
          fill="none"
          stroke="url(#bgLineGradient1)"
          strokeWidth="1.5"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
        <path
          className="bg-connect-line"
          d="M 0 1100 Q 400 1000, 800 1150 T 1600 1050"
          fill="none"
          stroke="url(#bgLineGradient2)"
          strokeWidth="1.5"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          filter="url(#lineGlow)"
        />
      </svg>

      {/* Floating particles with glow */}
      {Array.from({ length: 50 }).map((_, i) => {
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

      {/* Diagonal accent lines with glow */}
      <div
        className="bg-accent-line absolute top-[20%] left-0 w-full h-[2px] transform -skew-y-3"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(155, 92, 255, 0.3), transparent)',
          boxShadow: '0 0 10px rgba(155, 92, 255, 0.2)',
          opacity: 0.4,
        }}
      />
      <div
        className="bg-accent-line absolute top-[50%] left-0 w-full h-[2px] transform skew-y-2"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(60, 203, 255, 0.25), transparent)',
          boxShadow: '0 0 10px rgba(60, 203, 255, 0.15)',
          opacity: 0.4,
        }}
      />
      <div
        className="bg-accent-line absolute top-[80%] left-0 w-full h-[2px] transform -skew-y-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 79, 216, 0.2), transparent)',
          boxShadow: '0 0 10px rgba(255, 79, 216, 0.1)',
          opacity: 0.4,
        }}
      />

      {/* Ambient glow spots */}
      <div
        className="bg-ambient-glow absolute top-[30%] left-[60%] w-4 h-4 rounded-full bg-neon-purple"
        style={{
          boxShadow: '0 0 30px 15px rgba(155, 92, 255, 0.3)',
          opacity: 0.6,
        }}
      />
      <div
        className="bg-ambient-glow absolute top-[70%] right-[40%] w-3 h-3 rounded-full bg-neon-blue"
        style={{
          boxShadow: '0 0 25px 12px rgba(60, 203, 255, 0.3)',
          opacity: 0.5,
        }}
      />
      <div
        className="bg-ambient-glow absolute bottom-[40%] left-[70%] w-3 h-3 rounded-full bg-neon-pink"
        style={{
          boxShadow: '0 0 25px 12px rgba(255, 79, 216, 0.3)',
          opacity: 0.5,
        }}
      />
    </div>
  )
}
