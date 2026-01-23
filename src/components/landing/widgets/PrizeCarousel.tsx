'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GiftIcon } from '@/components/ui/GamingIcons'
import { useIsMobile } from '@/hooks/useIsMobile'

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

// Mapping of product names to SVG files
const PRODUCT_SVG_MAP: Record<string, string> = {
  // Apple
  'iphone': '/products/iphone-15-pro.svg',
  'iphone 15': '/products/iphone-15-pro.svg',
  'iphone 15 pro': '/products/iphone-15-pro.svg',
  'iphone 16': '/products/iphone-15-pro.svg',
  'iphone 16 pro': '/products/iphone-15-pro.svg',
  'macbook': '/products/macbook-pro.svg',
  'macbook pro': '/products/macbook-pro.svg',
  'macbook air': '/products/macbook-pro.svg',
  'ipad': '/products/ipad-pro.svg',
  'ipad pro': '/products/ipad-pro.svg',
  'ipad air': '/products/ipad-pro.svg',
  'airpods': '/products/airpods-pro.svg',
  'airpods pro': '/products/airpods-pro.svg',
  'airpods max': '/products/airpods-max.svg',
  'apple watch': '/products/apple-watch.svg',
  'imac': '/products/imac.svg',
  // Gaming
  'playstation': '/products/ps5.svg',
  'playstation 5': '/products/ps5.svg',
  'ps5': '/products/ps5.svg',
  'ps5 slim': '/products/ps5.svg',
  'manette ps5': '/products/ps5-controller.svg',
  'xbox': '/products/xbox-series-x.svg',
  'xbox series x': '/products/xbox-series-x.svg',
  'xbox series s': '/products/xbox-series-x.svg',
  'nintendo': '/products/nintendo-switch.svg',
  'nintendo switch': '/products/nintendo-switch.svg',
  'switch': '/products/nintendo-switch.svg',
  'steam deck': '/products/steam-deck.svg',
  'meta quest': '/products/meta-quest.svg',
  'quest 3': '/products/meta-quest.svg',
  'oculus': '/products/meta-quest.svg',
  // Gaming accessories
  'gaming laptop': '/products/gaming-laptop.svg',
  'pc portable gamer': '/products/gaming-laptop.svg',
  'gaming chair': '/products/gaming-chair.svg',
  'chaise gamer': '/products/gaming-chair.svg',
  'gaming monitor': '/products/gaming-monitor.svg',
  'écran gamer': '/products/gaming-monitor.svg',
  'gaming keyboard': '/products/gaming-keyboard.svg',
  'clavier gamer': '/products/gaming-keyboard.svg',
  'gaming mouse': '/products/gaming-mouse.svg',
  'souris gamer': '/products/gaming-mouse.svg',
  // Samsung
  'samsung galaxy': '/products/samsung-galaxy.svg',
  'galaxy s24': '/products/samsung-galaxy.svg',
  'galaxy s23': '/products/samsung-galaxy.svg',
  'samsung tv': '/products/samsung-tv.svg',
  // Audio
  'sony wh': '/products/sony-headphones.svg',
  'sony headphones': '/products/sony-headphones.svg',
  'casque sony': '/products/sony-headphones.svg',
  'bose': '/products/bose-speaker.svg',
  'jbl': '/products/jbl-speaker.svg',
  'sonos': '/products/sonos-speaker.svg',
  'soundbar': '/products/soundbar.svg',
  'barre de son': '/products/soundbar.svg',
  // TV
  'lg tv': '/products/lg-tv.svg',
  'tv lg': '/products/lg-tv.svg',
  'tv samsung': '/products/samsung-tv.svg',
  // Cameras
  'gopro': '/products/gopro-hero.svg',
  'canon': '/products/canon-camera.svg',
  'sony camera': '/products/sony-camera.svg',
  'appareil photo': '/products/sony-camera.svg',
  // Drones & mobility
  'dji': '/products/dji-drone.svg',
  'drone': '/products/dji-drone.svg',
  'trottinette': '/products/electric-scooter.svg',
  'scooter': '/products/electric-scooter.svg',
  'vélo électrique': '/products/electric-bike.svg',
  'vélo': '/products/electric-bike.svg',
  'moto': '/products/electric-moto.svg',
  'vespa': '/products/vespa.svg',
  'tesla': '/products/tesla-model.svg',
  // Watches
  'garmin': '/products/garmin-watch.svg',
  'rolex': '/products/rolex-watch.svg',
  'montre': '/products/apple-watch.svg',
  // Home
  'dyson': '/products/dyson-vacuum.svg',
  'aspirateur': '/products/dyson-vacuum.svg',
  'dyson airwrap': '/products/dyson-airwrap.svg',
  'thermomix': '/products/thermomix.svg',
  // Fashion
  'louis vuitton': '/products/louis-vuitton-bag.svg',
  'sac': '/products/louis-vuitton-bag.svg',
  'nike': '/products/nike-jordan.svg',
  'jordan': '/products/nike-jordan.svg',
  'ray-ban': '/products/rayban-smart.svg',
  'rayban': '/products/rayban-smart.svg',
  'lunettes': '/products/rayban-smart.svg',
  // Other
  'google pixel': '/products/google-pixel.svg',
  'pixel': '/products/google-pixel.svg',
  'carte cadeau': '/products/gift-card.svg',
  'gift card': '/products/gift-card.svg',
}

// Get SVG path from product name
function getProductSvg(name: string): string {
  const normalizedName = name.toLowerCase().trim()

  // Direct match
  if (PRODUCT_SVG_MAP[normalizedName]) {
    return PRODUCT_SVG_MAP[normalizedName]
  }

  // Partial match
  for (const [key, value] of Object.entries(PRODUCT_SVG_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value
    }
  }

  // Default fallback
  return '/products/gift-card.svg'
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
  const isMobile = useIsMobile()

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
            initial={isMobile ? false : { opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={isMobile ? { opacity: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: isMobile ? 0.1 : 0.3 }}
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
                    src={getProductSvg(currentPrize.name)}
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
