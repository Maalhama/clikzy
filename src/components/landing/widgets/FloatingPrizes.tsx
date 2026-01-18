'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Prize {
  id: string
  name: string
  image: string
  value: number
  color: 'purple' | 'blue' | 'pink'
}

const PRIZES: Prize[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=95&fit=crop',
    value: 1479,
    color: 'purple'
  },
  {
    id: '2',
    name: 'PlayStation 5',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&q=95&fit=crop',
    value: 549,
    color: 'blue'
  },
  {
    id: '3',
    name: 'MacBook Pro',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1200&q=95&fit=crop',
    value: 2499,
    color: 'pink'
  },
  {
    id: '4',
    name: 'AirPods Pro',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&q=95&fit=crop',
    value: 279,
    color: 'purple'
  },
  {
    id: '5',
    name: 'Apple Watch',
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1200&q=95&fit=crop',
    value: 449,
    color: 'blue'
  },
  {
    id: '6',
    name: 'iPad Pro',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1200&q=95&fit=crop',
    value: 1099,
    color: 'pink'
  },
]

const getColorStyles = (color: Prize['color']) => {
  switch (color) {
    case 'purple':
      return {
        glow: 'bg-neon-purple/40',
        border: 'group-hover:border-neon-purple/50',
        text: 'text-neon-purple',
        shadow: '0 0 30px rgba(155, 92, 255, 0.4)',
        hex: '#9B5CFF',
      }
    case 'blue':
      return {
        glow: 'bg-neon-blue/40',
        border: 'group-hover:border-neon-blue/50',
        text: 'text-neon-blue',
        shadow: '0 0 30px rgba(60, 203, 255, 0.4)',
        hex: '#3CCBFF',
      }
    case 'pink':
      return {
        glow: 'bg-neon-pink/40',
        border: 'group-hover:border-neon-pink/50',
        text: 'text-neon-pink',
        shadow: '0 0 30px rgba(255, 79, 216, 0.4)',
        hex: '#FF4FD8',
      }
  }
}

export function FloatingPrizes() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = useCallback((prizeId: string) => {
    setImageErrors(prev => ({ ...prev, [prizeId]: true }))
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      {/* Geometric shapes background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large rotating shape with glow */}
        <div
          className="absolute top-10 right-10 w-32 h-32 border-2 border-neon-purple/40 rounded-lg"
          style={{
            animation: 'spin 20s linear infinite',
            boxShadow: '0 0 20px rgba(155, 92, 255, 0.2)',
          }}
        />

        {/* Small squares with glow */}
        <div
          className="absolute top-1/4 left-0 w-16 h-16 border border-neon-blue/50 rotate-12"
          style={{
            animation: 'spin 15s linear infinite reverse',
            boxShadow: '0 0 15px rgba(60, 203, 255, 0.2)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-neon-pink/10 border border-neon-pink/40"
          style={{
            animation: 'pulse 3s ease-in-out infinite',
            boxShadow: '0 0 15px rgba(255, 79, 216, 0.2)',
          }}
        />

        {/* Circles with glow */}
        <div
          className="absolute top-20 left-1/3 w-24 h-24 rounded-full border border-neon-purple/30"
          style={{
            animation: 'pulse 4s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(155, 92, 255, 0.15)',
          }}
        />
        <div
          className="absolute bottom-1/3 right-10 w-16 h-16 rounded-full border-2 border-dashed border-neon-blue/40"
          style={{
            animation: 'spin 25s linear infinite',
            boxShadow: '0 0 15px rgba(60, 203, 255, 0.15)',
          }}
        />

        {/* Glowing dots */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${10 + (i % 4) * 25}%`,
                top: `${10 + Math.floor(i / 4) * 30}%`,
                backgroundColor: i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#3CCBFF' : '#FF4FD8',
                boxShadow: `0 0 8px ${i % 3 === 0 ? '#9B5CFF' : i % 3 === 1 ? '#3CCBFF' : '#FF4FD8'}`,
                animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
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
        {PRIZES.map((prize, index) => {
          const colors = getColorStyles(prize.color)
          const isMain = index === 0
          return (
            <div
              key={prize.id}
              className={`prize-float-card relative group ${isMain ? 'col-span-2 row-span-2' : ''}`}
              style={{
                animation: isVisible ? `float-slow ${3 + (index % 3)}s ease-in-out infinite` : 'none',
                animationDelay: `${index * 0.2}s`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
              }}
            >
              {/* Glow effect behind card */}
              <div
                className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.glow}`}
              />

              {/* Card */}
              <div className={`
                relative overflow-hidden rounded-2xl border border-white/10 ${colors.border}
                bg-bg-secondary/50 backdrop-blur-sm
                transition-all duration-500
                group-hover:bg-bg-secondary/70
                ${isMain ? 'p-6' : 'p-3'}
              `}>
                {/* Hover glow overlay */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 30px ${colors.hex}15`,
                  }}
                />

                {/* Corner accent with glow */}
                <div
                  className={`absolute top-0 right-0 ${isMain ? 'w-16 h-16' : 'w-12 h-12'}`}
                  style={{
                    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                    background: `linear-gradient(135deg, ${colors.hex}40, transparent)`,
                  }}
                />

                {/* Image container */}
                <div className={`
                  relative rounded-xl overflow-hidden mb-3 group/image
                  ${isMain ? 'h-40' : 'h-20'}
                `}>
                  {/* Image glow */}
                  <div className={`absolute inset-0 ${colors.glow} blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />

                  {imageErrors[prize.id] ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-blue/20">
                      <span className={`${isMain ? 'text-4xl' : 'text-2xl'}`}>🎁</span>
                    </div>
                  ) : (
                    <Image
                      src={prize.image}
                      alt={prize.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                      sizes={isMain ? '400px' : '200px'}
                      quality={90}
                      onError={() => handleImageError(prize.id)}
                    />
                  )}

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </div>

                {/* Info */}
                <div className={isMain ? '' : 'text-center'}>
                  <h4 className={`font-bold truncate ${isMain ? 'text-lg' : 'text-xs'}`}>
                    {prize.name}
                  </h4>
                  <div
                    className={`font-black ${colors.text} ${isMain ? 'text-2xl' : 'text-sm'}`}
                    style={{
                      textShadow: `0 0 15px ${colors.hex}60`,
                    }}
                  >
                    {prize.value}€
                  </div>
                </div>

                {/* Animated bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-2xl">
                  <div
                    className="h-full w-0 group-hover:w-full transition-all duration-700"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${colors.hex}, transparent)`,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => {
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
