'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface Prize {
  id: string
  name: string
  image: string
  value: number
}

const PRIZES: Prize[] = [
  { id: '1', name: 'iPhone 15 Pro', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop', value: 1479 },
  { id: '2', name: 'PS5', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop', value: 549 },
  { id: '3', name: 'MacBook Air', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop', value: 1299 },
  { id: '4', name: 'AirPods Pro', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300&h=300&fit=crop', value: 279 },
  { id: '5', name: 'Apple Watch', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300&h=300&fit=crop', value: 449 },
  { id: '6', name: 'iPad Pro', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop', value: 1099 },
]

export function FloatingPrizes() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Animate prize cards with different delays and movements
      gsap.utils.toArray<HTMLElement>('.prize-float-card').forEach((card, i) => {
        const delay = i * 0.15
        const yMove = 15 + Math.random() * 20
        const duration = 3 + Math.random() * 2
        const rotation = (Math.random() - 0.5) * 10

        // Entry animation
        gsap.from(card, {
          scale: 0,
          opacity: 0,
          rotation: rotation * 3,
          duration: 0.8,
          delay: delay,
          ease: 'back.out(1.7)',
        })

        // Continuous floating
        gsap.to(card, {
          y: yMove,
          rotation: rotation,
          duration: duration,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          delay: delay,
        })
      })

      // Animate geometric shapes
      gsap.utils.toArray<HTMLElement>('.geo-shape').forEach((shape, i) => {
        const duration = 4 + Math.random() * 4
        const rotation = 360 * (i % 2 === 0 ? 1 : -1)

        gsap.to(shape, {
          rotation: rotation,
          duration: duration,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(shape, {
          scale: 1 + Math.random() * 0.3,
          duration: duration / 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
      })

      // Animate connecting lines
      gsap.to('.connect-line', {
        strokeDashoffset: 0,
        duration: 2,
        stagger: 0.3,
        ease: 'power2.inOut',
      })

    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      {/* Geometric shapes background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large rotating hexagon */}
        <div className="geo-shape absolute top-10 right-10 w-32 h-32 border-2 border-neon-purple/30 rotate-45 clip-hexagon" />

        {/* Small squares */}
        <div className="geo-shape absolute top-1/4 left-0 w-16 h-16 border border-neon-blue/40 rotate-12" />
        <div className="geo-shape absolute bottom-1/4 right-1/4 w-12 h-12 bg-neon-pink/10 border border-neon-pink/30" />

        {/* Triangles */}
        <div className="geo-shape absolute top-1/2 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-neon-purple/20" />
        <div className="geo-shape absolute bottom-10 left-1/4 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-neon-blue/20" />

        {/* Circles */}
        <div className="geo-shape absolute top-20 left-1/3 w-24 h-24 rounded-full border border-neon-purple/20" />
        <div className="geo-shape absolute bottom-1/3 right-10 w-16 h-16 rounded-full border-2 border-dashed border-neon-blue/30" />

        {/* Dots grid */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-neon-purple"
              style={{
                left: `${10 + (i % 5) * 20}%`,
                top: `${10 + Math.floor(i / 5) * 25}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3CCBFF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          className="connect-line"
          d="M 50 100 Q 150 50, 250 150 T 450 100"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeDasharray="500"
          strokeDashoffset="500"
        />
        <path
          className="connect-line"
          d="M 100 300 Q 200 250, 300 350 T 500 300"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeDasharray="500"
          strokeDashoffset="500"
        />
      </svg>

      {/* Floating prize cards */}
      <div className="relative z-10 grid grid-cols-3 gap-4 p-4">
        {PRIZES.map((prize, index) => (
          <div
            key={prize.id}
            className={`prize-float-card relative group ${
              index === 0 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            {/* Glow effect */}
            <div className={`
              absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
              ${index % 3 === 0 ? 'bg-neon-purple/30' : index % 3 === 1 ? 'bg-neon-blue/30' : 'bg-neon-pink/30'}
            `} />

            {/* Card */}
            <div className={`
              relative overflow-hidden rounded-2xl border border-white/10
              bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm
              hover:border-white/20 transition-all duration-300
              ${index === 0 ? 'p-6' : 'p-3'}
            `}>
              {/* Corner accent */}
              <div className={`
                absolute top-0 right-0 w-12 h-12
                ${index % 3 === 0 ? 'bg-neon-purple/20' : index % 3 === 1 ? 'bg-neon-blue/20' : 'bg-neon-pink/20'}
              `} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

              {/* Image */}
              <div className={`
                relative bg-black/20 rounded-xl overflow-hidden mb-3
                ${index === 0 ? 'h-40' : 'h-20'}
              `}>
                <Image
                  src={prize.image}
                  alt={prize.name}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-500"
                  sizes={index === 0 ? '300px' : '150px'}
                />
              </div>

              {/* Info */}
              <div className={index === 0 ? '' : 'text-center'}>
                <h4 className={`font-bold truncate ${index === 0 ? 'text-lg' : 'text-xs'}`}>
                  {prize.name}
                </h4>
                <div className={`
                  font-black
                  ${index === 0 ? 'text-2xl text-neon-blue' : 'text-sm text-neon-purple'}
                `}>
                  {prize.value}€
                </div>
              </div>

              {/* Animated border on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent animate-border-spin"
                  style={{
                    background: 'linear-gradient(90deg, #9B5CFF, #3CCBFF, #FF4FD8, #9B5CFF) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating particles - deterministic positions to avoid hydration mismatch */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => {
          // Deterministic pseudo-random based on index
          const left = ((i * 17 + 7) % 100)
          const top = ((i * 23 + 11) % 100)
          const delay = (i * 0.3) % 5
          const duration = 3 + (i % 4)
          return (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-float-particle"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                backgroundColor: i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#3CCBFF' : '#FF4FD8',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
