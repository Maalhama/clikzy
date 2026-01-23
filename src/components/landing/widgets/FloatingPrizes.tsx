'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { GiftIcon } from '@/components/ui/GamingIcons'
import { getProductSvg } from '@/lib/utils/productImages'

interface Prize {
  id: string
  name: string
  value: number
  color: 'purple' | 'blue' | 'pink'
}

const PRIZES: Prize[] = [
  { id: '1', name: 'iPhone 17 Pro Max', value: 1479, color: 'purple' },
  { id: '2', name: 'PlayStation 5 Pro', value: 799, color: 'blue' },
  { id: '3', name: 'MacBook Pro M5', value: 4499, color: 'pink' },
  { id: '4', name: 'AirPods Pro 3', value: 299, color: 'purple' },
  { id: '5', name: 'Apple Watch Ultra 3', value: 999, color: 'blue' },
  { id: '6', name: 'iPad Pro M4', value: 1499, color: 'pink' },
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
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
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

  const handleImageError = (prizeId: string) => {
    setImageErrors((prev) => ({ ...prev, [prizeId]: true }))
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      {/* Floating prize cards */}
      <div className="relative grid grid-cols-3 gap-4 p-4">
        {PRIZES.map((prize, index) => {
          const colors = getColorStyles(prize.color)
          const isMain = index === 0
          return (
            <div
              key={prize.id}
              className={`prize-float-card relative group ${isMain ? 'col-span-2 row-span-2' : ''}`}
              style={{
                // Disable all animations on mobile for performance
                animation: isVisible && !isMobile ? `float-slow ${3 + (index % 3)}s ease-in-out ${index * 0.2}s infinite` : 'none',
                opacity: isMobile ? 1 : (isVisible ? 1 : 0),
                transform: isMobile ? 'none' : (isVisible ? 'translateY(0)' : 'translateY(20px)'),
                transition: isMobile ? 'none' : `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
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
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colors.hex}15, ${colors.hex}05)` }}
                    >
                      <GiftIcon
                        className={`${isMain ? 'w-20 h-20' : 'w-10 h-10'} transition-transform duration-300 group-hover:scale-110`}
                        style={{ color: colors.hex }}
                      />
                    </div>
                  ) : (
                    <div
                      className="relative w-full h-full"
                      style={{ background: `linear-gradient(135deg, ${colors.hex}10, transparent)` }}
                    >
                      <Image
                        src={getProductSvg(prize.name)}
                        alt={prize.name}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                        onError={() => handleImageError(prize.id)}
                        sizes={isMain ? '(max-width: 768px) 200px, 300px' : '(max-width: 768px) 100px, 150px'}
                        priority={index < 2} // Prioritize first 2 images for LCP
                      />
                    </div>
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
    </div>
  )
}
