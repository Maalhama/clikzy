'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

export function BackgroundEffects() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Animate geometric shapes with rotation
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

      // Floating particles animation
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
          delay: i * 0.2,
        })

        // Fade in/out
        gsap.to(particle, {
          opacity: 0.3 + (i % 3) * 0.2,
          duration: duration / 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      // Animate connecting lines
      gsap.to('.bg-connect-line', {
        strokeDashoffset: 0,
        duration: 3,
        stagger: 0.5,
        ease: 'power2.inOut',
      })

      // Glow orbs movement
      gsap.utils.toArray<HTMLElement>('.bg-glow-orb').forEach((orb, i) => {
        gsap.to(orb, {
          x: 50 * (i % 2 === 0 ? 1 : -1),
          y: 30 * (i % 2 === 0 ? -1 : 1),
          duration: 15 + i * 3,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #9B5CFF 1px, transparent 1px),
            linear-gradient(#9B5CFF 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Glow orbs */}
      <div className="bg-glow-orb absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-neon-purple/8 rounded-full blur-[180px]" />
      <div className="bg-glow-orb absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-neon-blue/8 rounded-full blur-[150px]" />
      <div className="bg-glow-orb absolute bottom-[20%] left-[30%] w-[400px] h-[400px] bg-neon-pink/6 rounded-full blur-[120px]" />
      <div className="bg-glow-orb absolute bottom-[10%] right-[25%] w-[350px] h-[350px] bg-neon-purple/5 rounded-full blur-[100px]" />

      {/* Geometric shapes spread across the page */}
      {/* Top area */}
      <div className="bg-geo-shape absolute top-[5%] right-[15%] w-24 h-24 border border-neon-purple/20 rotate-45" />
      <div className="bg-geo-shape absolute top-[8%] left-[10%] w-16 h-16 rounded-full border border-neon-blue/15" />
      <div className="bg-geo-shape absolute top-[15%] right-[40%] w-20 h-20 border-2 border-dashed border-neon-pink/10 rotate-12" />

      {/* Upper middle */}
      <div className="bg-geo-shape absolute top-[25%] left-[5%] w-32 h-32 border border-neon-purple/15 rotate-[30deg]" />
      <div className="bg-geo-shape absolute top-[30%] right-[8%] w-12 h-12 bg-neon-blue/5 border border-neon-blue/20 rotate-45" />
      <div className="bg-geo-shape absolute top-[35%] left-[45%] w-28 h-28 rounded-full border border-dashed border-neon-purple/10" />

      {/* Middle */}
      <div className="bg-geo-shape absolute top-[45%] right-[30%] w-14 h-14 border-2 border-neon-pink/15 rotate-[60deg]" />
      <div className="bg-geo-shape absolute top-[50%] left-[15%] w-20 h-20 rounded-full border border-neon-blue/10" />
      <div className="bg-geo-shape absolute top-[55%] right-[5%] w-24 h-24 border border-neon-purple/10 rotate-[15deg]" />

      {/* Lower middle */}
      <div className="bg-geo-shape absolute top-[65%] left-[8%] w-16 h-16 border border-neon-pink/15 rotate-45" />
      <div className="bg-geo-shape absolute top-[70%] right-[20%] w-28 h-28 rounded-full border-2 border-dashed border-neon-blue/8" />
      <div className="bg-geo-shape absolute top-[75%] left-[35%] w-12 h-12 bg-neon-purple/5 border border-neon-purple/15 rotate-[30deg]" />

      {/* Bottom */}
      <div className="bg-geo-shape absolute bottom-[10%] right-[35%] w-20 h-20 border border-neon-blue/15 rotate-12" />
      <div className="bg-geo-shape absolute bottom-[5%] left-[20%] w-24 h-24 rounded-full border border-neon-pink/10" />
      <div className="bg-geo-shape absolute bottom-[15%] right-[10%] w-16 h-16 border-2 border-neon-purple/10 rotate-45" />

      {/* Triangles */}
      <div className="bg-geo-shape absolute top-[20%] right-[25%] w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[40px] border-b-neon-purple/10" />
      <div className="bg-geo-shape absolute top-[60%] left-[25%] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-neon-blue/10" />
      <div className="bg-geo-shape absolute bottom-[30%] right-[45%] w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-neon-pink/10" />

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="bgLineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3CCBFF" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="bgLineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4FD8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Curved lines across the page */}
        <path
          className="bg-connect-line"
          d="M 0 200 Q 400 100, 800 250 T 1600 150"
          fill="none"
          stroke="url(#bgLineGradient1)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
        <path
          className="bg-connect-line"
          d="M 0 500 Q 300 400, 700 550 T 1400 450"
          fill="none"
          stroke="url(#bgLineGradient2)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
        <path
          className="bg-connect-line"
          d="M 100 800 Q 500 700, 900 850 T 1600 750"
          fill="none"
          stroke="url(#bgLineGradient1)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
        <path
          className="bg-connect-line"
          d="M 0 1100 Q 400 1000, 800 1150 T 1600 1050"
          fill="none"
          stroke="url(#bgLineGradient2)"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 40 }).map((_, i) => {
        const left = ((i * 17 + 5) % 95)
        const top = ((i * 23 + 7) % 90)
        const size = 1 + (i % 3)
        return (
          <div
            key={i}
            className="bg-particle absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#3CCBFF' : '#FF4FD8',
              opacity: 0.2 + (i % 4) * 0.1,
            }}
          />
        )
      })}

      {/* Diagonal accent lines */}
      <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-purple/20 to-transparent transform -skew-y-3" />
      <div className="absolute top-[50%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/15 to-transparent transform skew-y-2" />
      <div className="absolute top-[80%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-pink/10 to-transparent transform -skew-y-1" />
    </div>
  )
}
