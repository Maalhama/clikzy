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

// Mapping of exact product names from database to SVG files (2026 edition)
const PRODUCT_SVG_MAP: Record<string, string> = {
  // ============ SMARTPHONES (2026) ============
  'iphone 17 pro max': '/products/iphone-15-pro.svg',
  'iphone 17 pro': '/products/iphone-15-pro.svg',
  'iphone 17': '/products/iphone-15-pro.svg',
  'iphone': '/products/iphone-15-pro.svg',
  'samsung galaxy s26 ultra': '/products/samsung-galaxy.svg',
  'samsung galaxy z fold 6': '/products/samsung-galaxy.svg',
  'samsung galaxy z fold': '/products/samsung-galaxy.svg',
  'samsung galaxy': '/products/samsung-galaxy.svg',
  'galaxy s26': '/products/samsung-galaxy.svg',
  'galaxy z fold': '/products/samsung-galaxy.svg',
  'google pixel 10 pro': '/products/google-pixel.svg',
  'google pixel': '/products/google-pixel.svg',
  'pixel': '/products/google-pixel.svg',
  'oneplus 14 pro': '/products/samsung-galaxy.svg',
  'oneplus': '/products/samsung-galaxy.svg',

  // ============ GAMING (2026) ============
  'playstation 5 pro': '/products/ps5.svg',
  'playstation 5 slim': '/products/ps5.svg',
  'playstation 5': '/products/ps5.svg',
  'playstation': '/products/ps5.svg',
  'ps5': '/products/ps5.svg',
  'xbox series x 2tb': '/products/xbox-series-x.svg',
  'xbox series x': '/products/xbox-series-x.svg',
  'xbox series s': '/products/xbox-series-x.svg',
  'xbox': '/products/xbox-series-x.svg',
  'manette xbox': '/products/xbox-series-x.svg',
  'nintendo switch 2': '/products/nintendo-switch.svg',
  'nintendo switch': '/products/nintendo-switch.svg',
  'nintendo': '/products/nintendo-switch.svg',
  'switch': '/products/nintendo-switch.svg',
  'steam deck oled 1tb': '/products/steam-deck.svg',
  'steam deck oled': '/products/steam-deck.svg',
  'steam deck': '/products/steam-deck.svg',
  'asus rog ally x': '/products/steam-deck.svg',
  'rog ally': '/products/steam-deck.svg',
  'meta quest 4': '/products/meta-quest.svg',
  'meta quest': '/products/meta-quest.svg',
  'quest': '/products/meta-quest.svg',
  'oculus': '/products/meta-quest.svg',
  'manette ps5 dualsense edge': '/products/ps5-controller.svg',
  'manette ps5 dualsense': '/products/ps5-controller.svg',
  'manette ps5': '/products/ps5-controller.svg',
  'dualsense': '/products/ps5-controller.svg',

  // ============ ORDINATEURS & TABLETTES (2026) ============
  'macbook pro 16" m5 max': '/products/macbook-pro.svg',
  'macbook pro 14" m5 pro': '/products/macbook-pro.svg',
  'macbook pro 16"': '/products/macbook-pro.svg',
  'macbook pro 14"': '/products/macbook-pro.svg',
  'macbook pro': '/products/macbook-pro.svg',
  'macbook air 15" m4': '/products/macbook-pro.svg',
  'macbook air 15"': '/products/macbook-pro.svg',
  'macbook air': '/products/macbook-pro.svg',
  'macbook': '/products/macbook-pro.svg',
  'ipad pro 13" m4': '/products/ipad-pro.svg',
  'ipad pro 13"': '/products/ipad-pro.svg',
  'ipad pro': '/products/ipad-pro.svg',
  'ipad air m3': '/products/ipad-pro.svg',
  'ipad air': '/products/ipad-pro.svg',
  'ipad': '/products/ipad-pro.svg',
  'imac 24" m4': '/products/imac.svg',
  'imac 24"': '/products/imac.svg',
  'imac': '/products/imac.svg',
  'asus rog strix g18': '/products/gaming-laptop.svg',
  'asus rog strix': '/products/gaming-laptop.svg',
  'asus rog zephyrus': '/products/gaming-laptop.svg',
  'asus rog': '/products/gaming-laptop.svg',
  'rog strix': '/products/gaming-laptop.svg',
  'rog zephyrus': '/products/gaming-laptop.svg',
  'pc portable gaming': '/products/gaming-laptop.svg',
  'pc portable gamer': '/products/gaming-laptop.svg',
  'gaming laptop': '/products/gaming-laptop.svg',

  // ============ AUDIO (2026) ============
  'airpods pro 3': '/products/airpods-pro.svg',
  'airpods pro': '/products/airpods-pro.svg',
  'airpods 4': '/products/airpods-pro.svg',
  'airpods': '/products/airpods-pro.svg',
  'airpods max 2': '/products/airpods-max.svg',
  'airpods max': '/products/airpods-max.svg',
  'sony wh-1000xm6': '/products/sony-headphones.svg',
  'sony wh-1000xm5': '/products/sony-headphones.svg',
  'sony wf-1000xm5': '/products/airpods-pro.svg',
  'sony wh-ch720n': '/products/sony-headphones.svg',
  'sony wh': '/products/sony-headphones.svg',
  'casque sony': '/products/sony-headphones.svg',
  'bose quietcomfort ultra 2': '/products/bose-speaker.svg',
  'bose quietcomfort ultra': '/products/bose-speaker.svg',
  'bose quietcomfort': '/products/bose-speaker.svg',
  'bose soundlink flex': '/products/bose-speaker.svg',
  'bose': '/products/bose-speaker.svg',
  'sonos era 500': '/products/sonos-speaker.svg',
  'sonos era': '/products/sonos-speaker.svg',
  'sonos arc ultra': '/products/soundbar.svg',
  'sonos arc': '/products/soundbar.svg',
  'sonos roam 2': '/products/sonos-speaker.svg',
  'sonos': '/products/sonos-speaker.svg',
  'marshall stanmore iv': '/products/jbl-speaker.svg',
  'marshall stanmore': '/products/jbl-speaker.svg',
  'marshall emberton iii': '/products/jbl-speaker.svg',
  'marshall': '/products/jbl-speaker.svg',
  'jbl flip 7': '/products/jbl-speaker.svg',
  'jbl charge 6': '/products/jbl-speaker.svg',
  'jbl tune 770nc': '/products/sony-headphones.svg',
  'jbl': '/products/jbl-speaker.svg',
  'beats studio buds': '/products/airpods-pro.svg',
  'beats': '/products/airpods-pro.svg',
  'ultimate ears boom 4': '/products/jbl-speaker.svg',
  'ultimate ears': '/products/jbl-speaker.svg',
  'samsung galaxy buds 3': '/products/airpods-pro.svg',
  'galaxy buds': '/products/airpods-pro.svg',
  'barre de son': '/products/soundbar.svg',
  'soundbar': '/products/soundbar.svg',

  // ============ MONTRES & WEARABLES (2026) ============
  'apple watch ultra 3': '/products/apple-watch.svg',
  'apple watch ultra': '/products/apple-watch.svg',
  'apple watch series 11': '/products/apple-watch.svg',
  'apple watch series': '/products/apple-watch.svg',
  'apple watch se 2': '/products/apple-watch.svg',
  'apple watch se': '/products/apple-watch.svg',
  'apple watch': '/products/apple-watch.svg',
  'samsung galaxy watch 8 classic': '/products/garmin-watch.svg',
  'samsung galaxy watch 8': '/products/garmin-watch.svg',
  'samsung galaxy watch fe': '/products/garmin-watch.svg',
  'samsung galaxy watch': '/products/garmin-watch.svg',
  'galaxy watch': '/products/garmin-watch.svg',
  'garmin fenix 8 pro': '/products/garmin-watch.svg',
  'garmin fenix 8': '/products/garmin-watch.svg',
  'garmin fenix': '/products/garmin-watch.svg',
  'garmin venu sq 3': '/products/garmin-watch.svg',
  'garmin': '/products/garmin-watch.svg',
  'amazfit gtr 5': '/products/garmin-watch.svg',
  'amazfit': '/products/garmin-watch.svg',
  'fitbit sense 3': '/products/garmin-watch.svg',
  'fitbit': '/products/garmin-watch.svg',
  'xiaomi smart band 9': '/products/garmin-watch.svg',
  'huawei watch fit 4': '/products/garmin-watch.svg',
  'whoop 5.0': '/products/garmin-watch.svg',
  'whoop': '/products/garmin-watch.svg',
  'montre': '/products/apple-watch.svg',

  // ============ PHOTO & VIDEO (2026) ============
  'sony alpha 7 v': '/products/sony-camera.svg',
  'sony alpha 7': '/products/sony-camera.svg',
  'sony alpha': '/products/sony-camera.svg',
  'canon eos r8': '/products/canon-camera.svg',
  'canon eos': '/products/canon-camera.svg',
  'canon': '/products/canon-camera.svg',
  'gopro hero 14 black': '/products/gopro-hero.svg',
  'gopro hero 14': '/products/gopro-hero.svg',
  'gopro hero': '/products/gopro-hero.svg',
  'gopro': '/products/gopro-hero.svg',
  'dji osmo pocket 4': '/products/sony-camera.svg',
  'dji osmo pocket': '/products/sony-camera.svg',
  'dji pocket': '/products/sony-camera.svg',
  'appareil photo': '/products/sony-camera.svg',

  // ============ DRONES (2026) ============
  'dji mavic 4 pro': '/products/dji-drone.svg',
  'dji mavic 4': '/products/dji-drone.svg',
  'dji mavic': '/products/dji-drone.svg',
  'dji mini 5 pro': '/products/dji-drone.svg',
  'dji mini 5': '/products/dji-drone.svg',
  'dji mini': '/products/dji-drone.svg',
  'dji avata 3': '/products/dji-drone.svg',
  'dji avata': '/products/dji-drone.svg',
  'dji': '/products/dji-drone.svg',
  'drone': '/products/dji-drone.svg',

  // ============ TV & HOME CINEMA (2026) ============
  'lg oled g4 65"': '/products/lg-tv.svg',
  'lg oled g4': '/products/lg-tv.svg',
  'lg oled': '/products/lg-tv.svg',
  'lg tv': '/products/lg-tv.svg',
  'tv lg': '/products/lg-tv.svg',
  'samsung qn95d 55"': '/products/samsung-tv.svg',
  'samsung qn95d': '/products/samsung-tv.svg',
  'samsung tv': '/products/samsung-tv.svg',
  'tv samsung': '/products/samsung-tv.svg',
  'sony bravia 9 55"': '/products/lg-tv.svg',
  'sony bravia 9': '/products/lg-tv.svg',
  'sony bravia': '/products/lg-tv.svg',
  'bravia': '/products/lg-tv.svg',
  'tv': '/products/lg-tv.svg',

  // ============ MOBILITE ELECTRIQUE (2026) ============
  'xiaomi electric scooter 5 pro': '/products/electric-scooter.svg',
  'xiaomi electric scooter': '/products/electric-scooter.svg',
  'xiaomi scooter': '/products/electric-scooter.svg',
  'segway ninebot max g3': '/products/electric-scooter.svg',
  'segway ninebot max': '/products/electric-scooter.svg',
  'segway ninebot': '/products/electric-scooter.svg',
  'segway': '/products/electric-scooter.svg',
  'ninebot': '/products/electric-scooter.svg',
  'trottinette': '/products/electric-scooter.svg',
  'scooter électrique': '/products/electric-scooter.svg',
  'vanmoof s6': '/products/electric-bike.svg',
  'vanmoof': '/products/electric-bike.svg',
  'cowboy 5': '/products/electric-bike.svg',
  'cowboy': '/products/electric-bike.svg',
  'vélo électrique': '/products/electric-bike.svg',
  'velo electrique': '/products/electric-bike.svg',
  'vélo': '/products/electric-bike.svg',
  'velo': '/products/electric-bike.svg',

  // ============ MOTOS & SCOOTERS ============
  'vespa elettrica': '/products/vespa.svg',
  'vespa': '/products/vespa.svg',
  'bmw ce 04': '/products/electric-moto.svg',
  'bmw ce': '/products/electric-moto.svg',
  'bmw moto': '/products/electric-moto.svg',
  'zero sr/f': '/products/electric-moto.svg',
  'zero sr': '/products/electric-moto.svg',
  'zero moto': '/products/electric-moto.svg',
  'moto électrique': '/products/electric-moto.svg',
  'moto electrique': '/products/electric-moto.svg',
  'moto': '/products/electric-moto.svg',
  'scooter': '/products/vespa.svg',

  // ============ ELECTROMENAGER PREMIUM (2026) ============
  'dyson v20 detect': '/products/dyson-vacuum.svg',
  'dyson v20': '/products/dyson-vacuum.svg',
  'dyson v15': '/products/dyson-vacuum.svg',
  'dyson pure cool me': '/products/dyson-vacuum.svg',
  'aspirateur dyson': '/products/dyson-vacuum.svg',
  'aspirateur': '/products/dyson-vacuum.svg',
  'thermomix tm7': '/products/thermomix.svg',
  'thermomix': '/products/thermomix.svg',
  'dyson airwrap complete long': '/products/dyson-airwrap.svg',
  'dyson airwrap': '/products/dyson-airwrap.svg',
  'dyson airstrait': '/products/dyson-airwrap.svg',
  'airwrap': '/products/dyson-airwrap.svg',
  'dyson': '/products/dyson-vacuum.svg',
  'nespresso vertuo pop': '/products/thermomix.svg',
  'nespresso': '/products/thermomix.svg',
  'ninja creami': '/products/thermomix.svg',
  'irobot roomba': '/products/dyson-vacuum.svg',
  'roomba': '/products/dyson-vacuum.svg',

  // ============ HOME SMART (2026) ============
  'amazon echo show 10': '/products/sonos-speaker.svg',
  'echo show': '/products/sonos-speaker.svg',
  'google nest hub max': '/products/sonos-speaker.svg',
  'nest hub': '/products/sonos-speaker.svg',
  'philips hue starter kit': '/products/sonos-speaker.svg',
  'philips hue': '/products/sonos-speaker.svg',
  'nanoleaf shapes hexagons': '/products/sonos-speaker.svg',
  'nanoleaf': '/products/sonos-speaker.svg',
  'ring video doorbell 4': '/products/sonos-speaker.svg',
  'ring': '/products/sonos-speaker.svg',
  'eufy security': '/products/sonos-speaker.svg',

  // ============ GAMING ACCESSORIES (2026) ============
  'razer blackshark v2 pro': '/products/sony-headphones.svg',
  'steelseries arctis nova 7': '/products/sony-headphones.svg',
  'logitech g pro x superlight 2': '/products/gaming-mouse.svg',
  'logitech g915 tkl': '/products/gaming-keyboard.svg',
  'razer deathadder v3': '/products/gaming-mouse.svg',
  'seagate game drive': '/products/gaming-keyboard.svg',
  'elgato stream deck': '/products/gaming-keyboard.svg',

  // ============ TECH ACCESSORIES (2026) ============
  'apple airtag': '/products/airpods-pro.svg',
  'airtag': '/products/airpods-pro.svg',
  'samsung smarttag': '/products/airpods-pro.svg',
  'smarttag': '/products/airpods-pro.svg',
  'anker 737 power bank': '/products/airpods-pro.svg',
  'anker power bank': '/products/airpods-pro.svg',
  'magsafe battery pack': '/products/airpods-pro.svg',
  'belkin boostcharge': '/products/airpods-pro.svg',
  'apple magic keyboard': '/products/gaming-keyboard.svg',
  'apple pencil pro': '/products/ipad-pro.svg',
  'apple pencil': '/products/ipad-pro.svg',
  'kindle paperwhite': '/products/ipad-pro.svg',
  'kindle': '/products/ipad-pro.svg',
  'kobo libra': '/products/ipad-pro.svg',
  'kobo': '/products/ipad-pro.svg',
  'ray-ban meta smart glasses': '/products/rayban-smart.svg',

  // ============ AUTRES ============
  'carte cadeau': '/products/gift-card.svg',
  'gift card': '/products/gift-card.svg',
  'louis vuitton': '/products/louis-vuitton-bag.svg',
  'sac': '/products/louis-vuitton-bag.svg',
  'nike': '/products/nike-jordan.svg',
  'jordan': '/products/nike-jordan.svg',
  'ray-ban': '/products/rayban-smart.svg',
  'rayban': '/products/rayban-smart.svg',
  'rolex': '/products/rolex-watch.svg',
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
    name: 'iPhone 17 Pro Max',
    image_url: '/products/iphone-15-pro.svg',
    value: 1479,
    status: 'ending_soon'
  },
  {
    id: '2',
    name: 'PlayStation 5 Pro',
    image_url: '/products/ps5.svg',
    value: 799,
    status: 'available'
  },
  {
    id: '3',
    name: 'MacBook Pro M5 Max',
    image_url: '/products/macbook-pro.svg',
    value: 4499,
    status: 'available'
  },
  {
    id: '4',
    name: 'AirPods Pro 3',
    image_url: '/products/airpods-pro.svg',
    value: 299,
    status: 'available'
  },
  {
    id: '5',
    name: 'Apple Watch Ultra 3',
    image_url: '/products/apple-watch.svg',
    value: 999,
    status: 'ending_soon'
  },
  {
    id: '6',
    name: 'iPad Pro M4',
    image_url: '/products/ipad-pro.svg',
    value: 1499,
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
