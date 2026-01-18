'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { useLandingRealtime } from '@/hooks/landing/useLandingRealtime'

// Widgets
import {
  LiveActivityToast,
  FloatingTimer,
  AnimatedStats,
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

export function LandingClient({
  isLoggedIn,
  initialWinners,
  initialFeaturedGame,
  featuredItem,
  stats,
}: LandingClientProps) {
  const mainRef = useRef<HTMLElement>(null)

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

          {/* Navigation centrale */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#lots" className="nav-link-neon text-sm font-medium text-white/60 hover:text-white transition-all duration-300">
              Lots
            </a>
            <a href="#how-it-works" className="nav-link-neon text-sm font-medium text-white/60 hover:text-white transition-all duration-300">
              Comment ça marche
            </a>
            <a href="#winners" className="nav-link-neon text-sm font-medium text-white/60 hover:text-white transition-all duration-300">
              Gagnants
            </a>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Live badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-xs font-medium text-neon-green">{playerCount.toLocaleString('fr-FR')} en ligne</span>
            </div>

            {isLoggedIn ? (
              <Link
                href="/lobby"
                className="neon-btn-primary px-6 py-2.5 text-sm font-bold"
              >
                PARTICIPER
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="neon-btn-ghost px-4 py-2 text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="neon-btn-primary px-6 py-2.5 text-sm font-bold"
                >
                  S'INSCRIRE
                </Link>
              </>
            )}
          </div>
        </div>
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
            <p className="hero-subtitle text-sm md:text-base text-white/60 max-w-lg mb-8">
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
                href="#how"
                className="px-8 py-4 border-2 border-white/20 text-white font-bold hover:border-neon-blue/50 hover:text-neon-blue transition-all clip-angle"
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/30 text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-6 h-6 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
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
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
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
                    <p className="text-white/60 leading-relaxed">
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

      {/* STATS SECTION */}
      <section className="relative py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/5 via-transparent to-neon-purple/5" />

        {/* Glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-neon-purple/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-neon-blue/10 rounded-full blur-[100px]" />
        </div>

        {/* Floating particles with glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] w-2 h-2 rounded-full bg-neon-purple animate-float" style={{ animationDelay: '0s', boxShadow: '0 0 10px rgba(155, 92, 255, 0.8)' }} />
          <div className="absolute top-20 right-[15%] w-3 h-3 rounded-full bg-neon-blue animate-float" style={{ animationDelay: '1s', boxShadow: '0 0 12px rgba(60, 203, 255, 0.8)' }} />
          <div className="absolute bottom-20 left-[20%] w-2 h-2 rounded-full bg-neon-pink animate-float" style={{ animationDelay: '2s', boxShadow: '0 0 10px rgba(255, 79, 216, 0.8)' }} />
          <div className="absolute bottom-10 right-[25%] w-2 h-2 rounded-full bg-neon-purple animate-float" style={{ animationDelay: '0.5s', boxShadow: '0 0 10px rgba(155, 92, 255, 0.8)' }} />
          <div className="absolute top-1/3 left-[5%] w-1.5 h-1.5 rounded-full bg-success animate-float" style={{ animationDelay: '1.5s', boxShadow: '0 0 8px rgba(0, 255, 136, 0.8)' }} />
          <div className="absolute bottom-1/3 right-[8%] w-2 h-2 rounded-full bg-neon-pink animate-float" style={{ animationDelay: '2.5s', boxShadow: '0 0 10px rgba(255, 79, 216, 0.8)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-neon-purple" style={{ textShadow: '0 0 30px rgba(155, 92, 255, 0.5)' }}>CLIK</span>
              <span className="text-neon-pink" style={{ textShadow: '0 0 30px rgba(255, 79, 216, 0.5)' }}>ZY</span>
              <span className="text-white"> EN CHIFFRES</span>
            </h2>
            <p className="text-white/50 text-lg">Une communauté active et des gains réels</p>
          </div>
          <AnimatedStats
            totalWinnings={stats.totalWinningsValue}
            totalGames={stats.totalGames}
            playersOnline={playerCount || 42}
          />
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
              <span className="text-lg">🎁</span>
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
            <p className="text-white/50 text-lg">Des produits premium à remporter quotidiennement</p>
          </div>
          <PrizeCarousel />
        </div>
      </section>

      {/* LEADERBOARD & TESTIMONIALS */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Leaderboard />
            <Testimonials />
          </div>
        </div>
      </section>

      {/* WINNERS SECTION - Modern Design */}
      <section id="winners" className="winners-section relative py-24 overflow-hidden">
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
              <p className="text-white/50 mt-3 max-w-md">
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

          {/* Winners Marquee - Auto scrolling */}
          <div className="relative">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

            {/* Scrolling container */}
            <div className="overflow-hidden">
              <div
                className="flex gap-4 animate-marquee hover:[animation-play-state:paused]"
                style={{
                  width: 'max-content',
                }}
              >
                {/* First set of cards */}
                {[...(recentWinners.length > 0 ? recentWinners : [
                  { id: '1', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
                  { id: '2', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
                  { id: '3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
                  { id: '4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
                  { id: '5', username: 'ProPlayer', item_name: 'MacBook Air', item_value: 1199, won_at: new Date().toISOString() },
                  { id: '6', username: 'Champion99', item_name: 'iPad Pro', item_value: 999, won_at: new Date().toISOString() },
                  { id: '7', username: 'Lucky777', item_name: 'Apple Watch', item_value: 449, won_at: new Date().toISOString() },
                  { id: '8', username: 'TopGamer', item_name: 'Sony WH-1000XM5', item_value: 379, won_at: new Date().toISOString() },
                ]), ...(recentWinners.length > 0 ? recentWinners : [
                  { id: '1b', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
                  { id: '2b', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
                  { id: '3b', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
                  { id: '4b', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
                  { id: '5b', username: 'ProPlayer', item_name: 'MacBook Air', item_value: 1199, won_at: new Date().toISOString() },
                  { id: '6b', username: 'Champion99', item_name: 'iPad Pro', item_value: 999, won_at: new Date().toISOString() },
                  { id: '7b', username: 'Lucky777', item_name: 'Apple Watch', item_value: 449, won_at: new Date().toISOString() },
                  { id: '8b', username: 'TopGamer', item_name: 'Sony WH-1000XM5', item_value: 379, won_at: new Date().toISOString() },
                ])].map((winner, index) => (
                  <div
                    key={winner.id}
                    className="winner-item group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] flex-shrink-0 w-[280px]"
                  >
                    {/* Card background */}
                    <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-bg-secondary/80 to-bg-secondary/60" />

                    {/* Border */}
                    <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-success/50 transition-colors duration-300" />

                    {/* Content */}
                    <div className="relative p-5">
                      {/* Time badge */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 mb-3 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-white/50">À l'instant</span>
                      </div>

                      {/* Avatar & Username */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.4)' }}
                        >
                          {winner.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {winner.username}
                          </div>
                          <div className="text-xs text-success font-medium">vient de remporter</div>
                        </div>
                      </div>

                      {/* Item won */}
                      <div>
                        <div className="font-bold text-white text-lg mb-1 truncate">
                          {winner.item_name}
                        </div>
                        <div
                          className="font-black text-2xl"
                          style={{
                            background: 'linear-gradient(135deg, #00FF88 0%, #3CCBFF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.4))',
                          }}
                        >
                          {winner.item_value.toLocaleString()}€
                        </div>
                      </div>
                    </div>

                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 30px rgba(0, 255, 136, 0.15)' }}
                    />
                  </div>
                ))}
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

      {/* TRUST BADGES GRID */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-6">
          <TrustBadges variant="grid" />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta relative py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/20 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center final-cta-content">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-blue/10 border border-neon-blue/30 rounded-full mb-8"
            style={{ boxShadow: '0 0 20px rgba(60, 203, 255, 0.2)' }}
          >
            <span className="text-neon-blue text-sm font-bold flex items-center gap-2">
              <GiftIcon className="w-5 h-5" />
              OFFRE DE BIENVENUE
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            PRET A{' '}
            <span
              className="text-neon-purple"
              style={{ textShadow: '0 0 50px rgba(155, 92, 255, 0.6)' }}
            >
              GAGNER
            </span>{' '}
            ?
          </h2>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto">
            Inscris-toi maintenant et recois{' '}
            <span
              className="text-neon-pink font-bold"
              style={{ textShadow: '0 0 15px rgba(255, 79, 216, 0.5)' }}
            >
              10 credits offerts
            </span>{' '}
            pour tenter ta chance.
          </p>

          <Link
            href={isLoggedIn ? '/lobby' : '/register'}
            className="gaming-btn-large inline-flex"
            style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.4)' }}
          >
            <span className="relative z-10">
              {isLoggedIn ? 'VOIR LES LOTS' : 'CREER MON COMPTE'}
            </span>
          </Link>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
            {[
              { text: "0€ pour s'inscrire", color: 'success' },
              { text: '100% legal', color: 'neon-blue' },
              { text: 'Livraison gratuite', color: 'neon-pink' },
            ].map((item, i) => (
              <span
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${item.color}/10 border border-${item.color}/30 text-${item.color}`}
                style={{ boxShadow: `0 0 15px ${item.color === 'success' ? 'rgba(0, 255, 136, 0.15)' : item.color === 'neon-blue' ? 'rgba(60, 203, 255, 0.15)' : 'rgba(255, 79, 216, 0.15)'}` }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10 py-12">
        {/* Subtle glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent"
          style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.3)' }}
        />

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-black">
            <span className="text-neon-purple" style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.4)' }}>CLIK</span>
            <span className="text-neon-pink" style={{ textShadow: '0 0 20px rgba(255, 79, 216, 0.4)' }}>ZY</span>
          </div>
          <p className="text-white/30 text-sm">
            © 2025 CLIKZY. Clique. Gagne. Répète.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-neon-purple transition-colors duration-300">CGU</a>
            <a href="#" className="hover:text-neon-blue transition-colors duration-300">Confidentialité</a>
            <a href="#" className="hover:text-neon-pink transition-colors duration-300">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
