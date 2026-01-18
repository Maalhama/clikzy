'use client'

import Link from 'next/link'
import { FloatingPrize } from '../components/FloatingPrize'
import { PlayerCounter } from '../components/PlayerCounter'
import { ScrollIndicator } from '../components/ScrollProgressBar'

interface HeroSectionProps {
  isLoggedIn: boolean
  playerCount: number
  featuredItem?: {
    name: string
    image_url: string
    retail_value: number
  }
}

export function HeroSection({
  isLoggedIn,
  playerCount,
  featuredItem,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 md:pt-32 md:pb-24"
    >
      {/* Player count badge */}
      <div className="absolute top-20 md:top-24 right-4 md:right-8">
        <PlayerCounter count={playerCount} size="sm" />
      </div>

      {/* Badge */}
      <div className="mb-6 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-sm text-neon-purple backdrop-blur-sm">
        Le jeu qui rend accro
      </div>

      {/* Main headline - Simple & Impactful */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-tight">
        <span className="block">
          <span className="text-white">TU </span>
          <span className="text-neon-purple neon-text">CLIQUES</span>
          <span className="text-white">.</span>
        </span>
        <span className="block mt-2">
          <span className="text-white">TU </span>
          <span className="text-neon-pink neon-text-pink">GAGNES</span>
          <span className="text-white">.</span>
        </span>
      </h1>

      {/* Tagline */}
      <p className="text-lg md:text-xl text-text-secondary max-w-xl mb-8">
        Le dernier clic avant la fin du timer remporte le lot.
        <br />
        <span className="text-neon-blue font-semibold">
          iPhone, PS5, MacBook... a toi de jouer.
        </span>
      </p>

      {/* Featured prize */}
      {featuredItem && (
        <div className="mb-10">
          <FloatingPrize
            imageUrl={featuredItem.image_url}
            itemName={featuredItem.name}
            value={featuredItem.retail_value}
            size="lg"
          />
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Link
          href={isLoggedIn ? '/lobby' : '/register'}
          className="group relative px-8 py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-neon-purple"
        >
          <span className="relative z-10">
            {isLoggedIn ? 'Rejoindre une partie' : 'Commencer a jouer'}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <Link
          href="#how-it-works"
          className="px-8 py-4 border border-text-secondary/30 text-text-secondary font-semibold text-lg rounded-xl hover:border-neon-purple/50 hover:text-neon-purple transition-all duration-300"
        >
          Comment ca marche ?
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <ScrollIndicator targetId="prize-showcase" />
      </div>
    </section>
  )
}
