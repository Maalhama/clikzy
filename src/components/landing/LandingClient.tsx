'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { useLandingRealtime } from '@/hooks/landing/useLandingRealtime'

// Widgets
import {
  LiveActivityToast,
  FloatingTimer,
  Leaderboard,
  ClickPulse,
  TrustBadges,
  Testimonials,
  FloatingPrizes,
} from './widgets'

// Gaming Icons
import { TargetIcon, CursorClickIcon, TrophyIcon, GiftIcon } from '@/components/ui/GamingIcons'

// Widgets - PrizeCarousel
import { PrizeCarousel } from './widgets/PrizeCarousel'

// Background Effects
import { BackgroundEffects } from './components/BackgroundEffects'

// Components
import { PlayerCounter } from './components/PlayerCounter'
import { ScrollProgressBar, ScrollIndicator } from './components/ScrollProgressBar'

// Logo
import { Logo } from '@/components/ui/Logo'


interface Winner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
  avatar_url?: string
}

interface FeaturedGame {
  id: string
  item_name: string
  item_image_url: string
  item_value: number
  end_time: number
  total_clicks: number
  last_click_username: string | null
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

interface FeaturedItem {
  name: string
  image_url: string
  retail_value: number
  description?: string
}

interface LandingClientProps {
  isLoggedIn: boolean
  initialWinners: Winner[]
  initialFeaturedGame: FeaturedGame | null
  featuredItem: FeaturedItem | null
  stats: {
    totalWinningsValue: number
    totalGames: number
  }
}

// Predefined random times for variety (< 24h)
const RANDOM_TIMES = [
  'À l\'instant',
  'Il y a 2 min',
  'Il y a 14h',
  'Il y a 47 min',
  'Il y a 3h',
  'Il y a 8 min',
  'Il y a 22h',
  'Il y a 1h',
  'Il y a 5 min',
  'Il y a 19h',
  'Il y a 33 min',
  'Il y a 6h',
  'Il y a 12 min',
  'Il y a 11h',
  'Il y a 4h',
  'Il y a 58 min',
]

// Get time label from predefined random list
function getRandomTimeLabel(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return RANDOM_TIMES[hash % RANDOM_TIMES.length]
}

// Winner Card Component for marquee
function WinnerCard({ winner }: { winner: Winner }) {
  const timeLabel = getRandomTimeLabel(winner.id)
  const isRecent = timeLabel === 'À l\'instant' || timeLabel.includes('min')

  return (
    <div className="w-[280px] min-h-[180px] p-5 rounded-2xl bg-bg-secondary/80 border border-white/10 hover:border-success/50 transition-colors">
      {/* Time badge */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 mb-3 text-xs">
        {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
        <span className="text-white/50">{timeLabel}</span>
      </div>

      {/* Avatar & Username */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {winner.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{winner.username}</div>
          <div className="text-xs text-success font-medium">vient de remporter</div>
        </div>
      </div>

      {/* Item won */}
      <div>
        <div className="font-bold text-white text-base mb-1 truncate">{winner.item_name}</div>
        <div className="font-black text-2xl text-success">{winner.item_value.toLocaleString()}€</div>
      </div>
    </div>
  )
}

export function LandingClient({
  isLoggedIn,
  initialWinners,
  initialFeaturedGame,
  featuredItem,
  stats,
}: LandingClientProps) {
  const mainRef = useRef<HTMLElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { playerCount, recentWinners } = useLandingRealtime(
    initialWinners,
    initialFeaturedGame
  )

  // GSAP Animations
  useGSAP(
    () => {
      if (!mainRef.current) return

      const ctx = gsap.context(() => {
        // Hero animations
        const heroTl = gsap.timeline()

        heroTl
          .from('.hero-badge', {
            y: -50,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
          })
          .from('.hero-title span', {
            y: 100,
            opacity: 0,
            rotationX: -90,
            stagger: 0.1,
            duration: 0.8,
            ease: 'back.out(1.7)',
          }, '-=0.3')
          .from('.hero-subtitle', {
            y: 30,
            opacity: 0,
            duration: 0.6,
          }, '-=0.4')
          .from('.hero-cta', {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(2)',
          }, '-=0.2')
          .from('.hero-stats > div', {
            y: 40,
            opacity: 0,
            stagger: 0.15,
            duration: 0.5,
          }, '-=0.3')
          .from('.hero-prize', {
            x: 100,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          }, '-=0.6')

        // How it works - stagger from sides
        gsap.from('.step-card:nth-child(odd)', {
          scrollTrigger: {
            trigger: '.how-section',
            start: 'top 70%',
          },
          x: -100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
        })

        gsap.from('.step-card:nth-child(even)', {
          scrollTrigger: {
            trigger: '.how-section',
            start: 'top 70%',
          },
          x: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
        })

        // Winners feed
        gsap.from('.winner-item', {
          scrollTrigger: {
            trigger: '.winners-section',
            start: 'top 70%',
          },
          x: -50,
          opacity: 0,
          stagger: 0.1,
          duration: 0.5,
        })

        // Final CTA
        gsap.from('.final-cta-content', {
          scrollTrigger: {
            trigger: '.final-cta',
            start: 'top 70%',
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
        })

      }, mainRef)

      return () => ctx.revert()
    },
    { scope: mainRef }
  )

  return (
    <main ref={mainRef} className="relative bg-bg-primary text-white overflow-hidden">
      {/* SCROLL PROGRESS BAR */}
      <ScrollProgressBar color="gradient" height={3} position="top" />

      {/* GLOBAL ANIMATED BACKGROUND */}
      <BackgroundEffects />

      {/* FLOATING WIDGETS */}
      <LiveActivityToast enabled={true} maxVisible={3} />
      <FloatingTimer
        enabled={true}
        gameId={initialFeaturedGame?.id}
        initialEndTime={initialFeaturedGame?.end_time}
        itemName={featuredItem?.name}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 group/header">
        {/* Background with glassmorphism */}
        <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-xl" />

        {/* Animated gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-purple to-transparent animate-border-scan" />
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 via-neon-pink/40 to-neon-purple/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" animated={true} href="/" />

          {/* Navigation centrale - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#lots" className="nav-link-neon text-sm font-medium text-white/70 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 rounded">
              Lots
            </a>
            <a href="#how-it-works" className="nav-link-neon text-sm font-medium text-white/70 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 rounded">
              Comment ça marche
            </a>
            <a href="#winners" className="nav-link-neon text-sm font-medium text-white/70 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 rounded">
              Gagnants
            </a>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Live player counter */}
            <div className="hidden sm:block">
              <PlayerCounter count={playerCount} label="en ligne" size="sm" />
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/lobby"
                  className="neon-btn-primary px-6 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                >
                  PARTICIPER
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="neon-btn-ghost px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="neon-btn-primary px-6 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                  >
                    S'INSCRIRE
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 hover:border-neon-purple/50 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-bg-primary/95 backdrop-blur-xl border-t border-white/10">
            <nav className="flex flex-col p-6 gap-4">
              <a
                href="#lots"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-neon-purple transition-colors py-2"
              >
                Lots
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-neon-purple transition-colors py-2"
              >
                Comment ça marche
              </a>
              <a
                href="#winners"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-neon-purple transition-colors py-2"
              >
                Gagnants
              </a>
              <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link
                    href="/lobby"
                    onClick={() => setMobileMenuOpen(false)}
                    className="neon-btn-primary px-6 py-3 text-center text-sm font-bold"
                  >
                    PARTICIPER
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="neon-btn-ghost px-6 py-3 text-center text-sm font-medium"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="neon-btn-primary px-6 py-3 text-center text-sm font-bold"
                    >
                      S'INSCRIRE
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Click Pulse Effect */}
        <ClickPulse enabled={true} intensity="medium" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Live badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded mb-6 clip-angle-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-white text-sm font-bold uppercase tracking-wider">
                <span className="text-green-400">{playerCount}</span> participants en ligne
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-black leading-[0.9] mb-6" style={{ perspective: '1000px' }}>
              <span className="block">
                <span className="text-white">TU </span>
                <span className="text-neon-purple neon-text">CLIQUES</span>
                <span className="text-white">.</span>
              </span>
              <span className="block glitch-text" data-text="TU GAGNES.">
                <span className="text-white">TU </span>
                <span className="text-neon-pink neon-text-pink">GAGNES</span>
                <span className="text-white">.</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-sm md:text-base text-white/70 max-w-lg mb-8">
              Sois le dernier a cliquer avant la fin du timer et remporte le lot.
              <span className="block text-neon-blue font-semibold mt-1">iPhone, PS5, MacBook... a toi de cliquer.</span>
            </p>

            {/* CTA */}
            <div className="hero-cta flex flex-wrap gap-4 mb-12">
              <Link
                href={isLoggedIn ? '/lobby' : '/register'}
                className="gaming-btn-large group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoggedIn ? 'VOIR LES LOTS' : 'COMMENCER GRATUITEMENT'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 border-2 border-white/20 text-white font-bold hover:border-neon-blue/50 hover:text-neon-blue transition-all clip-angle focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              >
                COMMENT CA MARCHE
              </a>
            </div>

            {/* Stats */}
            <div className="hero-stats flex gap-6">
              <div
                className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-blue/20 backdrop-blur-sm"
                style={{ boxShadow: '0 0 20px rgba(60, 203, 255, 0.1)' }}
              >
                <div
                  className="text-3xl font-black text-neon-blue"
                  style={{ textShadow: '0 0 20px rgba(60, 203, 255, 0.5)' }}
                >
                  {stats.totalWinningsValue.toLocaleString()}€
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">De gains distribues</div>
              </div>
              <div
                className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-purple/20 backdrop-blur-sm"
                style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.1)' }}
              >
                <div
                  className="text-3xl font-black text-neon-purple"
                  style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }}
                >
                  {stats.totalGames}+
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Lots remportes</div>
              </div>
              <div
                className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-pink/20 backdrop-blur-sm"
                style={{ boxShadow: '0 0 20px rgba(255, 79, 216, 0.1)' }}
              >
                <div
                  className="text-3xl font-black text-neon-pink"
                  style={{ textShadow: '0 0 20px rgba(255, 79, 216, 0.5)' }}
                >
                  10
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Credits offerts</div>
              </div>
            </div>
          </div>

          {/* Right - Floating prizes with 3D models */}
          <div className="hero-prize relative">
            <FloatingPrizes />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ScrollIndicator targetId="how-it-works" />
        </div>
      </section>

      {/* TRUST BADGES */}
      <TrustBadges variant="horizontal" />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-section relative py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-20">
            <h2 className="section-title text-4xl md:text-6xl font-black mb-4">
              COMMENT <span className="text-neon-purple neon-text">ÇA MARCHE</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Un système simple et transparent en 3 étapes
            </p>
          </div>

          {/* Steps container with progress line */}
          <div className="relative">
            {/* Progress line - desktop only */}
            <div className="hidden md:block absolute top-24 left-[16.666%] right-[16.666%] h-[2px]">
              <div className="absolute inset-0 bg-white/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink animate-gradient-x" />
              {/* Animated glow on line */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink blur-sm opacity-50" />
            </div>

            {/* Steps grid */}
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  num: '1',
                  title: 'CHOISIS',
                  desc: 'Parcours les lots disponibles et sélectionne celui qui te fait envie.',
                  Icon: TargetIcon,
                  color: 'neon-purple',
                  hex: '#9B5CFF',
                  shadow: 'shadow-[0_0_30px_rgba(155,92,255,0.3)]',
                  hoverShadow: 'group-hover:shadow-[0_0_50px_rgba(155,92,255,0.5)]',
                },
                {
                  num: '2',
                  title: 'CLIQUE',
                  desc: 'Chaque clic coûte 1 crédit et relance le timer. Sois stratégique.',
                  Icon: CursorClickIcon,
                  color: 'neon-blue',
                  hex: '#3CCBFF',
                  shadow: 'shadow-[0_0_30px_rgba(60,203,255,0.3)]',
                  hoverShadow: 'group-hover:shadow-[0_0_50px_rgba(60,203,255,0.5)]',
                },
                {
                  num: '3',
                  title: 'GAGNE',
                  desc: 'Sois le dernier à cliquer quand le timer atteint zéro et remporte le lot.',
                  Icon: TrophyIcon,
                  color: 'neon-pink',
                  hex: '#FF4FD8',
                  shadow: 'shadow-[0_0_30px_rgba(255,79,216,0.3)]',
                  hoverShadow: 'group-hover:shadow-[0_0_50px_rgba(255,79,216,0.5)]',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="step-card group relative"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {/* Neon badge number - positioned above card */}
                  <div className="relative z-10 flex justify-center mb-6">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        font-black text-xl text-white
                        border-2 transition-all duration-300
                        ${step.shadow} ${step.hoverShadow}
                      `}
                      style={{
                        backgroundColor: `${step.hex}20`,
                        borderColor: step.hex,
                      }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className={`
                      relative p-8 rounded-lg
                      bg-bg-secondary/50 backdrop-blur-sm
                      border border-white/10
                      transition-all duration-300
                      group-hover:border-opacity-50
                      ${step.hoverShadow}
                    `}
                    style={{
                      ['--hover-border-color' as string]: step.hex,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = step.hex
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                  >
                    {/* Icon with glow */}
                    <div className="mb-6 relative">
                      {/* Glow behind icon */}
                      <div
                        className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                        style={{ backgroundColor: step.hex }}
                      />
                      <step.Icon
                        className="w-14 h-14 relative z-10 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: step.hex }}
                      />
                    </div>

                    {/* Title */}
                    <h3
                      className="text-2xl font-black mb-3 transition-all duration-300"
                      style={{ color: step.hex }}
                    >
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/70 leading-relaxed">
                      {step.desc}
                    </p>

                    {/* Bottom line accent */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${step.hex}, transparent)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRIZES SHOWCASE */}
      <section id="lots" className="relative py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-pink/10 border border-neon-pink/30 rounded-full text-neon-pink text-sm font-medium mb-4"
              style={{ boxShadow: '0 0 20px rgba(255, 79, 216, 0.2)' }}
            >
              <GiftIcon className="w-5 h-5" />
              Premium
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              LOTS{' '}
              <span
                className="text-neon-pink"
                style={{ textShadow: '0 0 40px rgba(255, 79, 216, 0.5)' }}
              >
                À REMPORTER
              </span>
            </h2>
            <p className="text-white/70 text-lg">Des produits premium à remporter quotidiennement</p>
          </div>
          <PrizeCarousel />
        </div>
      </section>

      {/* LEADERBOARD & TESTIMONIALS */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Leaderboard />
            <Testimonials />
          </div>
        </div>
      </section>

      {/* WINNERS SECTION - Modern Design */}
      <section id="winners" className="winners-section relative py-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-success/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full text-success text-sm font-medium mb-4"
                style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black">
                DERNIERS{' '}
                <span
                  className="text-success"
                  style={{ textShadow: '0 0 40px rgba(0, 255, 136, 0.5)' }}
                >
                  GAGNANTS
                </span>
              </h2>
              <p className="text-white/70 mt-3 max-w-md">
                Des gagnants remportent des objets chaque jour. Consulte les gains en temps réel.
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex gap-4">
              <div
                className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-neon-purple/30 backdrop-blur-sm"
                style={{ boxShadow: '0 0 25px rgba(155, 92, 255, 0.15)' }}
              >
                <span
                  className="text-2xl md:text-3xl font-black text-neon-purple"
                  style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }}
                >
                  {stats.totalWinningsValue.toLocaleString()}€
                </span>
                <span className="text-xs text-white/40 uppercase tracking-wider mt-1">Total distribué</span>
              </div>
              <div
                className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-success/30 backdrop-blur-sm"
                style={{ boxShadow: '0 0 25px rgba(0, 255, 136, 0.15)' }}
              >
                <span
                  className="text-2xl md:text-3xl font-black text-success"
                  style={{ textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
                >
                  {stats.totalGames}+
                </span>
                <span className="text-xs text-white/40 uppercase tracking-wider mt-1">Gagnants</span>
              </div>
            </div>
          </div>

          {/* Winners Marquee - Infinite scrolling */}
          <div className="relative">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />

            {/* Scrolling container */}
            <div className="overflow-hidden">
              <div className="winners-marquee-track">
                {/* First set */}
                <div className="winners-marquee-content">
                  {(recentWinners.length > 0 ? recentWinners : [
                    { id: '1', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
                    { id: '2', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
                    { id: '3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
                    { id: '4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
                    { id: '5', username: 'ProPlayer', item_name: 'MacBook Air', item_value: 1199, won_at: new Date().toISOString() },
                    { id: '6', username: 'Champion99', item_name: 'iPad Pro', item_value: 999, won_at: new Date().toISOString() },
                    { id: '7', username: 'Lucky777', item_name: 'Apple Watch', item_value: 449, won_at: new Date().toISOString() },
                    { id: '8', username: 'TopGamer', item_name: 'Sony WH-1000XM5', item_value: 379, won_at: new Date().toISOString() },
                  ]).map((winner) => (
                    <WinnerCard key={winner.id} winner={winner} />
                  ))}
                </div>
                {/* Duplicate set */}
                <div className="winners-marquee-content">
                  {(recentWinners.length > 0 ? recentWinners : [
                    { id: '1', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
                    { id: '2', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
                    { id: '3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
                    { id: '4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
                    { id: '5', username: 'ProPlayer', item_name: 'MacBook Air', item_value: 1199, won_at: new Date().toISOString() },
                    { id: '6', username: 'Champion99', item_name: 'iPad Pro', item_value: 999, won_at: new Date().toISOString() },
                    { id: '7', username: 'Lucky777', item_name: 'Apple Watch', item_value: 449, won_at: new Date().toISOString() },
                    { id: '8', username: 'TopGamer', item_name: 'Sony WH-1000XM5', item_value: 379, won_at: new Date().toISOString() },
                  ]).map((winner) => (
                    <WinnerCard key={`dup-${winner.id}`} winner={winner} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/lobby"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-success border border-success/30 rounded-full hover:bg-success/10 hover:border-success/50 transition-all duration-300"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)' }}
            >
              Voir tous les gagnants
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta relative py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/20 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-neon-blue/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center final-cta-content">
          {/* Badge OFFRE DE BIENVENUE */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/40 rounded-full mb-8 animate-pulse"
            style={{ boxShadow: '0 0 25px rgba(155, 92, 255, 0.3)' }}
          >
            <GiftIcon className="w-5 h-5 text-neon-pink" />
            <span className="text-white text-sm font-bold tracking-wide">OFFRE DE BIENVENUE</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            PRET A{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-purple animate-gradient-x"
              style={{
                textShadow: '0 0 80px rgba(155, 92, 255, 0.8), 0 0 120px rgba(255, 79, 216, 0.4)',
                filter: 'drop-shadow(0 0 30px rgba(155, 92, 255, 0.5))'
              }}
            >
              GAGNER
            </span>{' '}
            ?
          </h2>

          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Inscris-toi maintenant et reçois{' '}
            <span
              className="text-neon-pink font-black text-2xl"
              style={{ textShadow: '0 0 20px rgba(255, 79, 216, 0.6)' }}
            >
              10 crédits offerts
            </span>{' '}
            pour tenter ta chance.
          </p>

          {/* CTA Button avec pulsation */}
          <div className="relative inline-block">
            {/* Glow pulsant derrière le bouton */}
            <div
              className="absolute inset-0 bg-neon-purple rounded-full blur-xl animate-pulse opacity-60"
              style={{ transform: 'scale(1.1)' }}
            />
            <Link
              href={isLoggedIn ? '/lobby' : '/register'}
              className="relative gaming-btn-large inline-flex items-center gap-3 group"
              style={{ boxShadow: '0 0 40px rgba(155, 92, 255, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)' }}
            >
              <span className="relative z-10 font-black tracking-wide">
                {isLoggedIn ? 'VOIR LES LOTS' : 'CRÉER MON COMPTE'}
              </span>
              <svg
                className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Badges améliorés */}
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            {/* Badge 0€ */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-success/10 border border-success/30"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-success font-bold text-sm">0€ pour s'inscrire</div>
                <div className="text-white/40 text-xs">100% gratuit</div>
              </div>
            </div>

            {/* Badge 100% légal */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neon-blue/10 border border-neon-blue/30"
              style={{ boxShadow: '0 0 20px rgba(60, 203, 255, 0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-neon-blue font-bold text-sm">100% légal</div>
                <div className="text-white/40 text-xs">Conforme CNIL</div>
              </div>
            </div>

            {/* Badge Livraison */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neon-pink/10 border border-neon-pink/30"
              style={{ boxShadow: '0 0 20px rgba(255, 79, 216, 0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-neon-pink/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-neon-pink font-bold text-sm">Livraison offerte</div>
                <div className="text-white/40 text-xs">Partout en France</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10">
        {/* Subtle glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent"
          style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.3)' }}
        />

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Logo & Description */}
            <div className="lg:col-span-1">
              <div className="text-3xl font-black mb-4">
                <span className="text-neon-purple" style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.4)' }}>CLIK</span>
                <span className="text-neon-pink" style={{ textShadow: '0 0 20px rgba(255, 79, 216, 0.4)' }}>ZY</span>
              </div>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                La plateforme de jeu où le dernier clic gagne. Tente ta chance et repars avec des lots incroyables.
              </p>
              {/* Social Links */}
              <nav className="flex gap-3" aria-label="Réseaux sociaux">
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-purple/50 hover:bg-neon-purple/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-purple transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-pink/50 hover:bg-neon-pink/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-pink transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-blue/50 hover:bg-neon-blue/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-blue transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-success/50 hover:bg-success/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-success/50"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-success transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </nav>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/lobby" className="text-white/50 hover:text-neon-purple transition-colors duration-300 text-sm">
                    Voir les lots
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="text-white/50 hover:text-neon-purple transition-colors duration-300 text-sm">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href="#winners" className="text-white/50 hover:text-neon-purple transition-colors duration-300 text-sm">
                    Derniers gagnants
                  </a>
                </li>
                <li>
                  <Link href="/register" className="text-white/50 hover:text-neon-purple transition-colors duration-300 text-sm">
                    Créer un compte
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white/50 hover:text-neon-blue transition-colors duration-300 text-sm">
                    Conditions générales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 hover:text-neon-blue transition-colors duration-300 text-sm">
                    Politique de confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 hover:text-neon-blue transition-colors duration-300 text-sm">
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 hover:text-neon-blue transition-colors duration-300 text-sm">
                    Règlement des jeux
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Trust */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 mb-6">
                <li>
                  <a href="mailto:contact@clikzy.fr" className="text-white/50 hover:text-neon-pink transition-colors duration-300 text-sm">
                    contact@clikzy.fr
                  </a>
                </li>
                <li>
                  <span className="text-white/50 text-sm">Support 24h/24 - 7j/7</span>
                </li>
              </ul>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  SSL
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Stripe
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © 2025 CLIKZY. Tous droits réservés.
            </p>
            <p className="text-white/20 text-xs">
              🎮 Clique. Gagne. Répète.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
