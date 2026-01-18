'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/gsapConfig'
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
  const sectionRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const prizeRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Badge animation
        if (badgeRef.current) {
          tl.fromTo(
            badgeRef.current,
            { opacity: 0, y: -20, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6 }
          )
        }

        // Logo letter by letter animation
        if (logoRef.current) {
          const letters = logoRef.current.querySelectorAll('.logo-letter')
          tl.fromTo(
            letters,
            { opacity: 0, y: 50, rotateX: -90 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: 'elastic.out(1, 0.5)',
            },
            '-=0.3'
          )
        }

        // Tagline typewriter effect
        if (taglineRef.current) {
          tl.fromTo(
            taglineRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            '-=0.4'
          )
        }

        // CTA buttons
        if (ctaRef.current) {
          const buttons = ctaRef.current.querySelectorAll('a')
          tl.fromTo(
            buttons,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.15 },
            '-=0.2'
          )
        }

        // Prize reveal
        if (prizeRef.current) {
          tl.fromTo(
            prizeRef.current,
            { opacity: 0, scale: 0.8, rotateY: -30 },
            { opacity: 1, scale: 1, rotateY: 0, duration: 1, ease: 'back.out(1.7)' },
            '-=0.5'
          )
        }

        // Pin section on scroll (optional - disabled on mobile)
        if (window.innerWidth >= 768) {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=50%',
            pin: false,
          })
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 md:pt-32 md:pb-24"
    >
      {/* Player count badge */}
      <div className="absolute top-20 md:top-24 right-4 md:right-8">
        <PlayerCounter count={playerCount} size="sm" />
      </div>

      {/* Badge */}
      <div
        ref={badgeRef}
        className="mb-6 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-sm text-neon-purple backdrop-blur-sm"
      >
        Le dernier clic gagne tout
      </div>

      {/* Logo with letter animation */}
      <h1
        ref={logoRef}
        className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6"
        style={{ perspective: '1000px' }}
      >
        <span className="logo-letter inline-block text-neon-purple neon-text">C</span>
        <span className="logo-letter inline-block text-neon-purple neon-text">L</span>
        <span className="logo-letter inline-block text-neon-purple neon-text">I</span>
        <span className="logo-letter inline-block text-neon-purple neon-text">K</span>
        <span className="logo-letter inline-block text-neon-pink neon-text-pink">Z</span>
        <span className="logo-letter inline-block text-neon-pink neon-text-pink">Y</span>
      </h1>

      {/* Tagline */}
      <p
        ref={taglineRef}
        className="text-xl md:text-2xl text-text-secondary max-w-2xl mb-8"
      >
        Clique au bon moment. Remporte des objets incroyables.
        <br />
        <span className="text-neon-blue font-medium">
          Le dernier a cliquer avant la fin du timer gagne.
        </span>
      </p>

      {/* Featured prize */}
      {featuredItem && (
        <div ref={prizeRef} className="mb-10">
          <FloatingPrize
            imageUrl={featuredItem.image_url}
            itemName={featuredItem.name}
            value={featuredItem.retail_value}
            size="lg"
          />
        </div>
      )}

      {/* CTA Buttons */}
      <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 mb-12">
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
