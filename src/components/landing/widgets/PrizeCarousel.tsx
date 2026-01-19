'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GiftIcon } from '@/components/ui/GamingIcons'

interface Prize {
  id: string
  name: string
  image_url: string
  value: number
  status: 'available' | 'ending_soon' | 'ended'
}

interface PrizeCarouselProps {
  prizes?: Prize[]
  autoPlayInterval?: number
  className?: string
}

const MOCK_PRIZES: Prize[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    image_url: '/products/iphone-15-pro.svg',
    value: 1479,
    status: 'ending_soon'
  },
  {
    id: '2',
    name: 'PlayStation 5',
    image_url: '/products/ps5.svg',
    value: 549,
    status: 'available'
  },
  {
    id: '3',
    name: 'MacBook Pro',
    image_url: '/products/macbook-pro.svg',
    value: 2499,
    status: 'available'
  },
  {
    id: '4',
    name: 'AirPods Pro',
    image_url: '/products/airpods-pro.svg',
    value: 279,
    status: 'available'
  },
  {
    id: '5',
    name: 'Apple Watch',
    image_url: '/products/apple-watch.svg',
    value: 449,
    status: 'ending_soon'
  },
  {
    id: '6',
    name: 'iPad Pro',
    image_url: '/products/ipad-pro.svg',
    value: 1099,
    status: 'available'
  },
]

export function PrizeCarousel({
  prizes = MOCK_PRIZES,
  autoPlayInterval = 4000,
  className = '',
}: PrizeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleImageError = useCallback((prizeId: string) => {
    setImageErrors(prev => ({ ...prev, [prizeId]: true }))
  }, [])

  useEffect(() => {
    if (isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prizes.length)
    }, autoPlayInterval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [prizes.length, autoPlayInterval, isHovered])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % prizes.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + prizes.length) % prizes.length)
  }

  const currentPrize = prizes[currentIndex]

  return (
    <div
      className={`relative bg-bg-secondary/50 backdrop-blur-sm rounded-xl overflow-hidden group/carousel ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover/carousel:border-neon-purple/30 transition-colors duration-500" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(155, 92, 255, 0.2), inset 0 0 40px rgba(155, 92, 255, 0.05)',
        }}
      />

      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-neon-purple/30 blur-lg rounded-full" />
              <GiftIcon className="w-7 h-7 text-neon-purple relative z-10" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider">À REMPORTER</h3>
          </div>
          <Link
            href="/lobby"
            className="text-sm text-neon-purple hover:text-neon-pink transition-colors font-medium hover:drop-shadow-[0_0_8px_rgba(255,79,216,0.5)]"
          >
            Tout voir →
          </Link>
        </div>
      </div>

      {/* Carousel content */}
      <div className="relative p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row gap-6 items-center"
          >
            {/* Image */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 group/image">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 rounded-2xl blur-2xl group-hover/image:blur-3xl transition-all duration-500" />

              <div className="relative w-full h-full bg-bg-primary/50 rounded-2xl overflow-hidden border border-white/10 group-hover/image:border-neon-purple/30 transition-colors">
                {imageErrors[currentPrize.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-blue/20">
                    <GiftIcon className="w-16 h-16 text-neon-purple" />
                  </div>
                ) : (
                  <Image
                    src={currentPrize.image_url}
                    alt={currentPrize.name}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover/image:scale-105"
                    sizes="(max-width: 768px) 200px, 300px"
                    quality={90}
                    onError={() => handleImageError(currentPrize.id)}
                  />
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/image:translate-x-full transition-transform duration-1000 ease-in-out" />
              </div>

              {/* Badge "BIENTÔT FINI" with glow */}
              {currentPrize.status === 'ending_soon' && (
                <div className="absolute -top-2 -right-2 px-3 py-1 bg-neon-pink text-white text-xs font-bold rounded shadow-[0_0_15px_rgba(255,79,216,0.6)] animate-pulse">
                  BIENTÔT FINI!
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-2xl md:text-3xl font-bold mb-3">{currentPrize.name}</h4>
              <div className="flex items-baseline gap-2 justify-center md:justify-start mb-6">
                <span
                  className="text-4xl md:text-5xl font-black text-neon-blue"
                  style={{ textShadow: '0 0 20px rgba(60, 203, 255, 0.5)' }}
                >
                  {currentPrize.value}€
                </span>
                <span className="text-white/40 text-sm">à gagner</span>
              </div>
              <Link
                href={`/game/${currentPrize.id}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold rounded-lg shadow-[0_0_20px_rgba(155,92,255,0.3)] hover:shadow-[0_0_40px_rgba(155,92,255,0.5)] hover:scale-105 transition-all duration-300"
              >
                PARTICIPER
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(155,92,255,0.3)] group"
        >
          <svg className="w-5 h-5 text-white/60 group-hover:text-neon-purple transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(155,92,255,0.3)] group"
        >
          <svg className="w-5 h-5 text-white/60 group-hover:text-neon-purple transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots with neon effect */}
      <div className="flex justify-center gap-3 pb-6">
        {prizes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              h-2 rounded-full transition-all duration-300
              ${index === currentIndex
                ? 'w-10 bg-gradient-to-r from-neon-purple to-neon-pink shadow-[0_0_10px_rgba(155,92,255,0.5)]'
                : 'w-2 bg-white/20 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
