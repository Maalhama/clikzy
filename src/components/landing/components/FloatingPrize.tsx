'use client'

import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import Image from 'next/image'

interface FloatingPrizeProps {
  imageUrl: string
  itemName: string
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  enableRotation?: boolean
  enableFloat?: boolean
  showShine?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64',
  xl: 'w-80 h-80',
}

export function FloatingPrize({
  imageUrl,
  itemName,
  value,
  size = 'lg',
  enableRotation = true,
  enableFloat = true,
  showShine = true,
  className = '',
}: FloatingPrizeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current) return

      const ctx = gsap.context(() => {
        // Floating animation
        if (enableFloat) {
          gsap.to(containerRef.current, {
            y: -20,
            duration: 2.5,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }

        // Subtle rotation
        if (enableRotation && imageRef.current) {
          gsap.to(imageRef.current, {
            rotateY: 15,
            rotateX: -5,
            duration: 4,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }

        // Shine effect
        if (showShine && shineRef.current) {
          gsap.to(shineRef.current, {
            x: '200%',
            duration: 2,
            ease: 'power2.inOut',
            repeat: -1,
            repeatDelay: 3,
          })
        }
      }, containerRef)

      return () => ctx.revert()
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className={`relative ${sizeMap[size]} ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* Glow effect behind */}
      <div className="absolute inset-0 bg-neon-purple/20 rounded-full blur-3xl animate-pulse-slow" />

      {/* Main image container */}
      <div
        ref={imageRef}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Image */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-bg-secondary/50 border border-neon-purple/30">
          <Image
            src={imageUrl}
            alt={itemName}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, 33vw"
          />

          {/* Shine overlay */}
          {showShine && (
            <div
              ref={shineRef}
              className="absolute inset-0 -translate-x-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
              }}
            />
          )}
        </div>

        {/* Neon border glow */}
        <div className="absolute inset-0 rounded-2xl border-2 border-neon-purple/50 animate-glow" />
      </div>

      {/* Price tag */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-bg-secondary border border-neon-pink/50 rounded-full shadow-neon-pink">
        <span className="text-neon-pink font-bold text-lg">{value.toLocaleString()} EUR</span>
      </div>
    </div>
  )
}
