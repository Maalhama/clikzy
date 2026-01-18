'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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
  { id: '1', name: 'iPhone 15 Pro Max', image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop', value: 1479, status: 'ending_soon' },
  { id: '2', name: 'PlayStation 5', image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop', value: 549, status: 'available' },
  { id: '3', name: 'MacBook Air M3', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop', value: 1299, status: 'available' },
  { id: '4', name: 'AirPods Max', image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=400&h=400&fit=crop', value: 579, status: 'available' },
  { id: '5', name: 'Apple Watch Ultra', image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop', value: 899, status: 'ending_soon' },
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
      className={`relative bg-bg-secondary/30 border border-white/10 clip-angle-lg overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <h3 className="text-xl font-black uppercase tracking-wider">A GAGNER</h3>
          </div>
          <Link
            href="/lobby"
            className="text-sm text-neon-purple hover:text-neon-pink transition-colors font-medium"
          >
            Voir tout →
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
            <div className="relative w-48 h-48 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 rounded-2xl blur-xl" />
              <div className="relative w-full h-full bg-bg-primary/50 rounded-2xl overflow-hidden border border-white/10">
                {imageErrors[currentPrize.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-blue/20">
                    <span className="text-6xl">🎁</span>
                  </div>
                ) : (
                  <Image
                    src={currentPrize.image_url}
                    alt={currentPrize.name}
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                    onError={() => handleImageError(currentPrize.id)}
                  />
                )}
              </div>
              {currentPrize.status === 'ending_soon' && (
                <div className="absolute -top-2 -right-2 px-3 py-1 bg-neon-pink text-white text-xs font-bold rounded animate-pulse">
                  BIENTOT FINI!
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-2xl font-bold mb-2">{currentPrize.name}</h4>
              <div className="flex items-baseline gap-2 justify-center md:justify-start mb-4">
                <span className="text-4xl font-black text-neon-blue">{currentPrize.value}€</span>
                <span className="text-white/40 text-sm">valeur</span>
              </div>
              <Link
                href={`/game/${currentPrize.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold clip-angle-sm hover:shadow-[0_0_30px_rgba(155,92,255,0.5)] transition-shadow"
              >
                PARTICIPER
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
        {prizes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex
                ? 'w-8 bg-neon-purple'
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
