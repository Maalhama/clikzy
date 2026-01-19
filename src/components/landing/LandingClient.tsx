'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
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
  FAQ,
  TodayWinsCounter,
  Guarantees,
} from './widgets'

// Gaming Icons
import { TargetIcon, CursorClickIcon, TrophyIcon, GiftIcon } from '@/components/ui/GamingIcons'

// Widgets - PrizeCarousel
import { PrizeCarousel } from './widgets/PrizeCarousel'

// Background Effects
import { BackgroundEffects } from './components/BackgroundEffects'

// Components
import { PlayerCounter } from './components/PlayerCounter'
import { ScrollProgressBar } from './components/ScrollProgressBar'

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

// Winner Card Component for marquee - Responsive
function WinnerCard({ winner }: { winner: Winner }) {
  const timeLabel = getRandomTimeLabel(winner.id)
  const isRecent = timeLabel === 'À l\'instant' || timeLabel.includes('min')

  return (
    <div className="w-[220px] sm:w-[280px] min-h-[150px] sm:min-h-[180px] p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-bg-secondary/80 border border-white/10">
      {/* Time badge */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 mb-2 sm:mb-3 text-[10px] sm:text-xs">
        {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
        <span className="text-white/50">{timeLabel}</span>
      </div>

      {/* Avatar & Username */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
          {winner.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-white text-xs sm:text-sm">{winner.username}</div>
          <div className="text-[10px] sm:text-xs text-success font-medium">a remporté</div>
        </div>
      </div>

      {/* Item won */}
      <div>
        <div className="font-bold text-white text-sm sm:text-base mb-1 truncate">{winner.item_name}</div>
        <div className="font-black text-xl sm:text-2xl text-success">{winner.item_value.toLocaleString()}€</div>
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
  const [menuClosing, setMenuClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Pour le portal - attendre le montage côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const closeMenu = () => {
    if (menuClosing) return
    setMenuClosing(true)
    setTimeout(() => {
      setMobileMenuOpen(false)
      setMenuClosing(false)
    }, 300)
  }

  const { playerCount, recentWinners } = useLandingRealtime(
    initialWinners,
    initialFeaturedGame
  )

  // GSAP Animations
  useGSAP(
    () => {
      if (!mainRef.current) return

      const ctx = gsap.context(() => {
        // Hero animations removed - instant display

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
    <>
    <main ref={mainRef} className="relative bg-bg-primary text-white overflow-hidden">
      {/* SCROLL PROGRESS BAR */}
      <ScrollProgressBar color="gradient" height={3} position="top" />

      {/* MOBILE LIGHTWEIGHT BACKGROUND - CSS only, no JS */}
      <div className="md:hidden">
        <div className="mobile-grid-bg" />
        <div className="mobile-geo-shapes" />
        <div className="mobile-geo-circle" />
        <div className="mobile-geo-triangle" />
        <div className="mobile-glow-spot mobile-glow-spot-1" />
        <div className="mobile-glow-spot mobile-glow-spot-2" />
        <div className="mobile-glow-spot mobile-glow-spot-3" />
      </div>

      {/* DESKTOP ANIMATED BACKGROUND - Hidden on mobile for performance */}
      <div className="hidden md:block">
        <BackgroundEffects />
      </div>

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

        {/* Mobile Header */}
        <div className="md:hidden relative px-4 py-3 flex items-center justify-between">
          {/* Mobile menu button - Left */}
          <button
            onClick={() => mobileMenuOpen ? closeMenu() : setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 border border-neon-purple/30 hover:border-neon-pink/50 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="url(#menuGradient)" strokeWidth={2}>
              <defs>
                <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9B5CFF" />
                  <stop offset="100%" stopColor="#FF4FD8" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo - Center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo size="md" animated={true} href="/" />
          </div>

          {/* Placeholder for balance - Right */}
          <div className="w-9 h-9" />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex relative max-w-7xl mx-auto px-6 py-4 items-center justify-between">
          {/* Logo */}
          <Logo size="md" animated={true} href="/" />

          {/* Navigation centrale - Desktop */}
          <nav className="flex items-center gap-8">
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
            <PlayerCounter count={playerCount} label="en ligne" size="sm" />

            {/* Desktop buttons */}
            <div className="flex items-center gap-4">
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
          </div>
        </div>

      </header>

      {/* HERO SECTION */}
      {/* === MOBILE HERO === */}
      <section className="md:hidden relative min-h-[100svh] flex flex-col justify-center pt-16 pb-6 px-4">
        {/* Mobile Hero Content - Centered & Compact */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Live badge */}
          <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-full mb-4 self-start">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-white text-xs font-bold">
              <span className="text-green-400">{playerCount}</span> en ligne
            </span>
          </div>

          {/* Title - Escalating sizes effect */}
          <h1 className="hero-title leading-[0.9] font-black mb-4">
            <span className="block text-xl">
              <span className="text-neon-purple neon-text">CLIQUE</span>
              <span className="text-white">.</span>
            </span>
            <span className="block text-4xl">
              <span className="text-neon-blue neon-text">JOUE</span>
              <span className="text-white">.</span>
            </span>
            <span className="block text-[2.75rem]">
              <span className="text-neon-pink neon-text-pink">GAGNE</span>
              <span className="text-white">.</span>
            </span>
          </h1>

          {/* Subtitle - Short */}
          <p className="hero-subtitle text-sm text-white/60 mb-4 max-w-[300px]">
            Le dernier clic remporte le lot. Rejoins des milliers de joueurs et tente de remporter ta récompense.
            <span className="block text-neon-blue font-semibold mt-1">10 clics gratuits chaque jour.</span>
          </p>

          {/* Mini Prize Showcase - Mobile - Infinite Marquee */}
          <div className="hero-prize mb-6 -mx-4 overflow-hidden">
            <div
              className="flex gap-3"
              style={{
                width: 'max-content',
                animation: 'marquee 20s linear infinite',
              }}
            >
              {/* First set */}
              {[
                { name: 'iPhone 15 Pro', value: 1479, color: '#9B5CFF', image: '/products/iphone-15-pro.svg' },
                { name: 'PlayStation 5', value: 549, color: '#3CCBFF', image: '/products/ps5.svg' },
                { name: 'MacBook Pro', value: 2499, color: '#FF4FD8', image: '/products/macbook-pro.svg' },
                { name: 'AirPods Pro', value: 279, color: '#00FF88', image: '/products/airpods-pro.svg' },
                { name: 'Apple Watch', value: 449, color: '#9B5CFF', image: '/products/apple-watch.svg' },
                { name: 'iPad Pro', value: 1099, color: '#3CCBFF', image: '/products/ipad-pro.svg' },
              ].map((prize, i) => (
                <div
                  key={`a-${i}`}
                  className="flex-shrink-0 w-[100px] p-2.5 rounded-xl bg-bg-secondary/70 border text-center"
                  style={{ borderColor: `${prize.color}40` }}
                >
                  <div
                    className="relative w-14 h-14 mx-auto mb-1.5 rounded-lg overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${prize.color}20, transparent)` }}
                  >
                    <Image
                      src={prize.image}
                      alt={prize.name}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  </div>
                  <div className="text-[9px] text-white/70 truncate">{prize.name}</div>
                  <div className="text-xs font-black" style={{ color: prize.color }}>{prize.value}€</div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { name: 'iPhone 15 Pro', value: 1479, color: '#9B5CFF', image: '/products/iphone-15-pro.svg' },
                { name: 'PlayStation 5', value: 549, color: '#3CCBFF', image: '/products/ps5.svg' },
                { name: 'MacBook Pro', value: 2499, color: '#FF4FD8', image: '/products/macbook-pro.svg' },
                { name: 'AirPods Pro', value: 279, color: '#00FF88', image: '/products/airpods-pro.svg' },
                { name: 'Apple Watch', value: 449, color: '#9B5CFF', image: '/products/apple-watch.svg' },
                { name: 'iPad Pro', value: 1099, color: '#3CCBFF', image: '/products/ipad-pro.svg' },
              ].map((prize, i) => (
                <div
                  key={`b-${i}`}
                  className="flex-shrink-0 w-[100px] p-2.5 rounded-xl bg-bg-secondary/70 border text-center"
                  style={{ borderColor: `${prize.color}40` }}
                >
                  <div
                    className="relative w-14 h-14 mx-auto mb-1.5 rounded-lg overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${prize.color}20, transparent)` }}
                  >
                    <Image
                      src={prize.image}
                      alt={prize.name}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  </div>
                  <div className="text-[9px] text-white/70 truncate">{prize.name}</div>
                  <div className="text-xs font-black" style={{ color: prize.color }}>{prize.value}€</div>
                </div>
              ))}
            </div>
          </div>

          {/* Single CTA - Full width */}
          <Link
            href={isLoggedIn ? '/lobby' : '/register'}
            className="hero-cta w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-black text-base rounded-xl text-center mb-3"
            style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.4)' }}
          >
            {isLoggedIn ? 'VOIR LES LOTS' : 'JOUER GRATUITEMENT'}
          </Link>

          {/* Reassurance message */}
          <p className="text-[10px] text-white/40 text-center mb-6">
            Jeu 100% gratuit • Aucun paiement requis • Lots réels
          </p>

          {/* Stats - Horizontal compact */}
          <div className="hero-stats flex justify-between gap-2">
            <div className="flex-1 py-3 px-2 rounded-lg bg-bg-secondary/60 border border-neon-blue/20 text-center">
              <div className="text-lg font-black text-neon-blue">{stats.totalWinningsValue.toLocaleString()}€</div>
              <div className="text-[9px] text-white/40 uppercase">Récompenses</div>
            </div>
            <div className="flex-1 py-3 px-2 rounded-lg bg-bg-secondary/60 border border-neon-purple/20 text-center">
              <div className="text-lg font-black text-neon-purple">{stats.totalGames}+</div>
              <div className="text-[9px] text-white/40 uppercase">Lots</div>
            </div>
            <div className="flex-1 py-3 px-2 rounded-lg bg-bg-secondary/60 border border-neon-pink/20 text-center">
              <div className="text-lg font-black text-neon-pink">10c</div>
              <div className="text-[9px] text-white/40 uppercase">Gratuits/jour</div>
            </div>
          </div>
        </div>

      </section>

      {/* === DESKTOP HERO === */}
      <section className="hidden md:flex relative min-h-screen items-center pt-20">
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

            {/* Title - Escalating sizes effect */}
            <h1 className="hero-title font-black leading-[0.9] mb-6" style={{ perspective: '1000px' }}>
              <span className="block text-3xl lg:text-4xl">
                <span className="text-neon-purple neon-text">CLIQUE</span>
                <span className="text-white">.</span>
              </span>
              <span className="block text-5xl lg:text-6xl">
                <span className="text-neon-blue neon-text">JOUE</span>
                <span className="text-white">.</span>
              </span>
              <span className="block text-6xl lg:text-7xl glitch-text" data-text="GAGNE.">
                <span className="text-neon-pink neon-text-pink">GAGNE</span>
                <span className="text-white">.</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg text-white/70 max-w-lg mb-8">
              Le dernier clic remporte le lot. Rejoins des milliers de joueurs et tente de remporter ta récompense.
              <span className="block text-neon-blue font-semibold mt-2">10 clics gratuits chaque jour.</span>
            </p>

            {/* CTA */}
            <div className="hero-cta flex flex-col gap-3 mb-12">
              <div className="flex gap-4">
                <Link
                  href={isLoggedIn ? '/lobby' : '/register'}
                  className="gaming-btn-large group text-center"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoggedIn ? 'VOIR LES LOTS' : 'JOUER GRATUITEMENT'}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 border-2 border-white/20 text-white font-bold hover:border-neon-blue/50 hover:text-neon-blue transition-all text-center focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                >
                  COMMENT ÇA MARCHE
                </a>
              </div>
              {/* Reassurance message */}
              <p className="text-sm text-white/50">
                Jeu 100% gratuit • Aucun paiement requis • Lots réels livrés chez toi
              </p>
            </div>

            {/* Stats */}
            <div className="hero-stats grid grid-cols-3 gap-6">
              <div className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-blue/20">
                <div className="text-3xl font-black text-neon-blue">{stats.totalWinningsValue.toLocaleString()}€</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Récompenses</div>
              </div>
              <div className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-purple/20">
                <div className="text-3xl font-black text-neon-purple">{stats.totalGames}+</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Lots distribués</div>
              </div>
              <div className="stat-box p-4 rounded-xl bg-bg-secondary/40 border border-neon-pink/20">
                <div className="text-3xl font-black text-neon-pink">10</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Clics gratuits/jour</div>
              </div>
            </div>
          </div>

          {/* Right - Floating prizes */}
          <div className="hero-prize relative hidden lg:block">
            <FloatingPrizes />
          </div>
        </div>

      </section>

      {/* TRUST BADGES */}
      <TrustBadges variant="horizontal" />

      {/* TODAY'S WINS COUNTER */}
      <TodayWinsCounter />

      {/* HOW IT WORKS */}
      {/* === MOBILE HOW IT WORKS === */}
      <section id="how-it-works" className="md:hidden how-section relative py-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/3 to-transparent" />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black">
              COMMENT <span className="text-neon-purple">ÇA MARCHE</span>
            </h2>
            <p className="text-white/50 text-sm mt-1">Un jeu simple, transparent, ouvert à tous</p>
          </div>

          {/* Vertical steps */}
          <div className="space-y-3">
            {[
              { num: '1', title: 'CHOISIS', desc: 'Parcours les lots et choisis celui qui te fait envie', Icon: TargetIcon, hex: '#9B5CFF' },
              { num: '2', title: 'CLIQUE', desc: '1 clic = 1 crédit (10 gratuits chaque jour)', Icon: CursorClickIcon, hex: '#3CCBFF' },
              { num: '3', title: 'ATTENDS', desc: 'Sous 1 min, chaque clic relance le timer à 1 min', Icon: TrophyIcon, hex: '#00FF88' },
              { num: '4', title: 'GAGNE', desc: 'Timer à zéro ? Le dernier clic remporte le lot !', Icon: GiftIcon, hex: '#FF4FD8' },
            ].map((step, i) => (
              <div
                key={i}
                className="step-card flex items-center gap-4 p-4 rounded-xl bg-bg-secondary/50 border"
                style={{ borderColor: `${step.hex}30` }}
              >
                {/* Number badge */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                  style={{ backgroundColor: `${step.hex}20`, border: `2px solid ${step.hex}` }}
                >
                  {step.num}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <step.Icon className="w-5 h-5" style={{ color: step.hex }} />
                    <h3 className="font-black" style={{ color: step.hex }}>{step.title}</h3>
                  </div>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Transparency note */}
          <div className="mt-8 p-3 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
            <div className="flex items-start gap-2 justify-center">
              <svg className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[11px] text-white/60 text-left">
                Les crédits supplémentaires permettent de jouer plus longtemps, mais n'augmentent pas tes chances de remporter le lot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === DESKTOP HOW IT WORKS === */}
      <section className="hidden md:block how-section relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="section-title text-6xl font-black mb-4">
              COMMENT <span className="text-neon-purple">ÇA MARCHE</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Un jeu simple, transparent, et ouvert à tous
            </p>
          </div>

          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-16 left-[12.5%] right-[12.5%] h-[2px]">
              <div className="absolute inset-0 bg-white/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-blue via-success to-neon-pink animate-gradient-x" />
            </div>

            <div className="grid grid-cols-4 gap-8">
              {[
                { num: '1', title: 'CHOISIS', desc: 'Parcours les lots disponibles : smartphones, consoles, accessoires... Choisis celui qui te fait envie.', Icon: TargetIcon, hex: '#9B5CFF' },
                { num: '2', title: 'CLIQUE', desc: 'Chaque clic utilise 1 crédit. Tu reçois 10 crédits gratuits chaque jour, sans aucun paiement.', Icon: CursorClickIcon, hex: '#3CCBFF' },
                { num: '3', title: 'LE TIMER', desc: 'Quand le timer passe sous 1 minute, chaque clic le relance à 1 minute. Le jeu continue tant que la communauté joue.', Icon: TrophyIcon, hex: '#00FF88' },
                { num: '4', title: 'GAGNE', desc: 'Quand le timer atteint zéro, le dernier joueur à avoir cliqué remporte le lot. Simple.', Icon: GiftIcon, hex: '#FF4FD8' },
              ].map((step, i) => (
                <div key={i} className="step-card group relative">
                  <div className="relative z-10 flex justify-center mb-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl text-white border-2"
                      style={{ backgroundColor: `${step.hex}20`, borderColor: step.hex }}
                    >
                      {step.num}
                    </div>
                  </div>

                  <div className="relative p-6 rounded-lg bg-bg-secondary/50 border h-full" style={{ borderColor: `${step.hex}30` }}>
                    <div className="mb-4">
                      <step.Icon className="w-12 h-12" style={{ color: step.hex }} />
                    </div>
                    <h3 className="text-xl font-black mb-2" style={{ color: step.hex }}>{step.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency note */}
          <div className="mt-24 max-w-2xl mx-auto p-4 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
            <div className="flex items-center gap-3 justify-center">
              <svg className="w-5 h-5 text-neon-blue flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-white/70 text-sm text-left">
                Les crédits supplémentaires permettent de jouer plus longtemps, mais n'augmentent pas tes chances de remporter le lot. Seul le timing compte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIZES SHOWCASE */}
      {/* === MOBILE PRIZES === */}
      <section id="lots" className="md:hidden relative py-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/3 to-transparent" />

        <div className="relative">
          {/* Header compact */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-neon-pink/10 border border-neon-pink/30 rounded-full text-neon-pink text-[10px] font-medium mb-2">
                <GiftIcon className="w-3 h-3" />
                Premium
              </div>
              <h2 className="text-xl font-black">
                LOTS <span className="text-neon-pink">À GAGNER</span>
              </h2>
            </div>
            <Link
              href="/lobby"
              className="text-xs text-neon-pink font-semibold flex items-center gap-1"
            >
              Voir tout
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Carousel */}
          <PrizeCarousel />
        </div>
      </section>

      {/* === DESKTOP PRIZES === */}
      <section className="hidden md:block relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-pink/10 border border-neon-pink/30 rounded-full text-neon-pink text-sm font-medium mb-4">
              <GiftIcon className="w-5 h-5" />
              Premium
            </div>
            <h2 className="text-5xl font-black mb-4">
              LOTS <span className="text-neon-pink">À REMPORTER</span>
            </h2>
            <p className="text-white/60 text-lg">Produits premium quotidiens</p>
          </div>
          <PrizeCarousel />
        </div>
      </section>

      {/* LEADERBOARD & TESTIMONIALS - Hidden on mobile to reduce length */}
      <section className="hidden md:block relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Leaderboard />
            <Testimonials />
          </div>
        </div>
      </section>

      {/* WINNERS SECTION */}
      {/* === MOBILE WINNERS === */}
      <section id="winners" className="md:hidden winners-section relative py-8 px-4">
        <div className="relative">
          {/* Header compact */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/30 rounded-full text-success text-[10px] font-medium mb-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                </span>
                Live
              </div>
              <h2 className="text-xl font-black">
                DERNIERS <span className="text-success">GAGNANTS</span>
              </h2>
            </div>
            {/* Mini stats */}
            <div className="text-right">
              <div className="text-lg font-black text-success">{stats.totalWinningsValue.toLocaleString()}€</div>
              <div className="text-[9px] text-white/40 uppercase">Distribués</div>
            </div>
          </div>

          {/* Compact winners list */}
          <div className="space-y-2">
            {(recentWinners.length > 0 ? recentWinners.slice(0, 4) : [
              { id: '1', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
              { id: '2', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
              { id: '3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
              { id: '4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
            ]).map((winner, i) => (
              <div
                key={winner.id}
                className="winner-item flex items-center gap-3 p-3 rounded-xl bg-bg-secondary/50 border border-success/20"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {winner.username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{winner.username}</span>
                    {i === 0 && <span className="text-[10px] text-success">À l'instant</span>}
                  </div>
                  <div className="text-xs text-white/50 truncate">{winner.item_name}</div>
                </div>

                {/* Value */}
                <div className="text-success font-black text-sm">{winner.item_value}€</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === MOBILE TESTIMONIALS === */}
      <section className="md:hidden relative py-8 px-4">
        <div className="relative">
          <Testimonials className="border-neon-pink/20" />
        </div>
      </section>

      {/* === DESKTOP WINNERS === */}
      <section className="hidden md:block winners-section relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-success/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full text-success text-sm font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live
              </div>
              <h2 className="text-6xl font-black">
                DERNIERS <span className="text-success">GAGNANTS</span>
              </h2>
              <p className="text-white/70 mt-3 max-w-md">
                Des gagnants remportent des objets chaque jour.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-neon-purple/30">
                <span className="text-3xl font-black text-neon-purple">{stats.totalWinningsValue.toLocaleString()}€</span>
                <span className="text-xs text-white/40 uppercase tracking-wider mt-1">Distribué</span>
              </div>
              <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-bg-secondary/60 border border-success/30">
                <span className="text-3xl font-black text-success">{stats.totalGames}+</span>
                <span className="text-xs text-white/40 uppercase tracking-wider mt-1">Gagnants</span>
              </div>
            </div>
          </div>

          {/* Winners Marquee */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none" />

            <div className="overflow-hidden">
              <div className="winners-marquee-track">
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

      {/* GUARANTEES SECTION - Mobile & Desktop handled internally */}
      <Guarantees />

      {/* FAQ SECTION */}
      {/* === MOBILE FAQ === */}
      <section className="md:hidden relative py-8 px-4">
        <FAQ />
      </section>

      {/* === DESKTOP FAQ === */}
      <section className="hidden md:block relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <FAQ />
        </div>
      </section>

      {/* FINAL CTA */}
      {/* === MOBILE FINAL CTA === */}
      <section className="md:hidden final-cta relative py-10 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/15 via-transparent to-transparent" />

        <div className="relative text-center final-cta-content">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neon-purple/20 border border-neon-purple/40 rounded-full mb-4">
            <GiftIcon className="w-4 h-4 text-neon-pink" />
            <span className="text-white text-xs font-bold">REJOINS LA PARTIE</span>
          </div>

          <h2 className="text-2xl font-black mb-3">
            PRÊT À{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">JOUER</span>
            {' '}?
          </h2>

          <p className="text-sm text-white/60 mb-5">
            Reçois <span className="text-neon-pink font-black">10 clics gratuits</span> chaque jour
          </p>

          {/* CTA Button */}
          <Link
            href={isLoggedIn ? '/lobby' : '/register'}
            className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-black text-base rounded-xl text-center block mb-3"
            style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.4)' }}
          >
            {isLoggedIn ? 'VOIR LES LOTS' : 'JOUER GRATUITEMENT'}
          </Link>

          {/* Reassurance */}
          <p className="text-[10px] text-white/40 mb-5">Aucun paiement requis • Lots réels livrés</p>

          {/* Trust badges - Compact horizontal */}
          <div className="flex justify-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-success text-[10px] font-bold">0€</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
              <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-neon-blue text-[10px] font-bold">+18 ans</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
              <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-neon-pink text-[10px] font-bold">Lots réels</span>
            </div>
          </div>
        </div>
      </section>

      {/* === DESKTOP FINAL CTA === */}
      <section className="hidden md:block final-cta relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/20 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-neon-blue/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.5)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center final-cta-content">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/40 rounded-full mb-8 animate-pulse"
            style={{ boxShadow: '0 0 25px rgba(155, 92, 255, 0.3)' }}
          >
            <GiftIcon className="w-5 h-5 text-neon-pink" />
            <span className="text-white text-sm font-bold tracking-wide">REJOINS LA PARTIE</span>
          </div>

          <h2 className="text-6xl lg:text-7xl font-black mb-6">
            PRÊT À{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-purple">JOUER</span>
            {' '}?
          </h2>

          <p className="text-xl text-white/70 mb-6 max-w-2xl mx-auto">
            Inscris-toi et reçois{' '}
            <span className="text-neon-pink font-black text-2xl">10 clics gratuits</span>{' '}
            chaque jour pour participer.
          </p>

          <p className="text-sm text-white/50 mb-10">
            Jeu 100% gratuit • Aucun paiement requis • Lots réels livrés chez toi
          </p>

          <div className="relative inline-block">
            <div className="absolute inset-0 bg-neon-purple rounded-full blur-xl animate-pulse opacity-60" style={{ transform: 'scale(1.1)' }} />
            <Link
              href={isLoggedIn ? '/lobby' : '/register'}
              className="relative gaming-btn-large inline-flex items-center gap-3 group"
              style={{ boxShadow: '0 0 40px rgba(155, 92, 255, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)' }}
            >
              <span className="relative z-10 font-black tracking-wide">
                {isLoggedIn ? 'VOIR LES LOTS' : 'JOUER GRATUITEMENT'}
              </span>
              <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-success/10 border border-success/30">
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
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neon-blue/10 border border-neon-blue/30">
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
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neon-pink/10 border border-neon-pink/30">
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
      {/* === MOBILE FOOTER === */}
      <footer className="md:hidden relative border-t border-white/10 px-4 py-6">
        {/* Logo & Social */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-black">
            <span className="text-neon-purple">CLIK</span>
            <span className="text-neon-pink">ZY</span>
          </div>
          <nav className="flex gap-2" aria-label="Réseaux sociaux">
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Twitter">
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Instagram">
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="TikTok">
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            </a>
          </nav>
        </div>

        {/* Links - Horizontal compact */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-xs">
          <a href="#" className="text-white/40">CGU</a>
          <a href="#" className="text-white/40">Confidentialité</a>
          <a href="#" className="text-white/40">Mentions légales</a>
          <a href="mailto:contact@clikzy.fr" className="text-white/40">Contact</a>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <span>© 2025 CLIKZY</span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Clique. Joue. Gagne.
          </span>
        </div>
      </footer>

      {/* === DESKTOP FOOTER === */}
      <footer className="hidden md:block relative border-t border-white/10">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent" style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.3)' }} />

        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-4 gap-12">
            {/* Logo & Description */}
            <div>
              <div className="text-3xl font-black mb-4">
                <span className="text-neon-purple">CLIK</span>
                <span className="text-neon-pink">ZY</span>
              </div>
              <p className="text-white/70 text-sm mb-6">La plateforme de jeu où le dernier clic gagne.</p>
              <nav className="flex gap-3" aria-label="Réseaux sociaux">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-purple/50 hover:bg-neon-purple/10 transition-all group" aria-label="Twitter">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-pink/50 hover:bg-neon-pink/10 transition-all group" aria-label="Instagram">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-pink" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-neon-blue/50 hover:bg-neon-blue/10 transition-all group" aria-label="TikTok">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-blue" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-success/50 hover:bg-success/10 transition-all group" aria-label="Discord">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                </a>
              </nav>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-3">
                <li><Link href="/lobby" className="text-white/50 hover:text-neon-purple transition-colors text-sm">Voir les lots</Link></li>
                <li><a href="#how-it-works" className="text-white/50 hover:text-neon-purple transition-colors text-sm">Comment ça marche</a></li>
                <li><a href="#winners" className="text-white/50 hover:text-neon-purple transition-colors text-sm">Derniers gagnants</a></li>
                <li><Link href="/register" className="text-white/50 hover:text-neon-purple transition-colors text-sm">Créer un compte</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-white/50 hover:text-neon-blue transition-colors text-sm">Conditions générales</a></li>
                <li><a href="#" className="text-white/50 hover:text-neon-blue transition-colors text-sm">Politique de confidentialité</a></li>
                <li><a href="#" className="text-white/50 hover:text-neon-blue transition-colors text-sm">Mentions légales</a></li>
                <li><a href="#" className="text-white/50 hover:text-neon-blue transition-colors text-sm">Règlement des jeux</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 mb-6">
                <li><a href="mailto:contact@clikzy.fr" className="text-white/50 hover:text-neon-pink transition-colors text-sm">contact@clikzy.fr</a></li>
                <li><span className="text-white/50 text-sm">Support 24h/24 - 7j/7</span></li>
              </ul>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  SSL
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Stripe
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <p className="text-white/30 text-sm">© 2025 CLIKZY. Tous droits réservés.</p>
            <p className="text-white/20 text-xs flex items-center gap-1">
              <svg className="w-3 h-3 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Clique. Joue. Gagne.
            </p>
          </div>
        </div>
      </footer>
    </main>

    {/* Mobile Menu Portal - rendu directement dans document.body via createPortal */}
    {isMounted && mobileMenuOpen && createPortal(
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          pointerEvents: 'auto'
        }}
      >
        {/* Backdrop */}
        <div
          onClick={closeMenu}
          className={menuClosing ? 'animate-fade-out' : 'animate-fade-in'}
          style={{
            position: 'fixed',
            top: '3.5rem',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        />
        {/* Menu Panel */}
        <div
          className={menuClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}
          style={{
            position: 'fixed',
            top: '3.5rem',
            left: 0,
            width: '17rem',
            backgroundColor: '#0a0a0f',
            border: '2px solid rgba(155, 92, 255, 0.5)',
            borderLeft: 'none',
            borderRadius: '0 1rem 1rem 0',
            boxShadow: menuClosing ? 'none' : '0 0 60px rgba(155, 92, 255, 0.4), 0 0 100px rgba(255, 79, 216, 0.2), 10px 10px 40px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Menu</span>
            <button
              onClick={closeMenu}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 hover:border-neon-pink/50 transition-all"
              aria-label="Fermer le menu"
              style={{ boxShadow: '0 0 10px rgba(155, 92, 255, 0.2)' }}
            >
              <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-3">
            <a
              href="#lots"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-neon-pink/10 transition-all group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neon-pink/10 border border-neon-pink/30 group-hover:border-neon-pink/50 transition-colors">
                <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <span className="block text-sm font-semibold">Lots</span>
                <span className="block text-[10px] text-white/40">Voir les lots disponibles</span>
              </div>
            </a>

            <a
              href="#how-it-works"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-neon-blue/10 transition-all group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neon-blue/10 border border-neon-blue/30 group-hover:border-neon-blue/50 transition-colors">
                <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="block text-sm font-semibold">Comment jouer</span>
                <span className="block text-[10px] text-white/40">Les règles du jeu</span>
              </div>
            </a>

            <a
              href="#winners"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-success/10 transition-all group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 border border-success/30 group-hover:border-success/50 transition-colors">
                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="block text-sm font-semibold">Gagnants</span>
                <span className="block text-[10px] text-white/40">Derniers lots remportés</span>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </a>
          </nav>

          {/* CTA Section */}
          <div className="px-4 pb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/20">
              {isLoggedIn ? (
                <Link
                  href="/lobby"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
                  style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.3)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  JOUER
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
                    style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.3)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    S'INSCRIRE
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-white/50 hover:text-white transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Déjà inscrit ? Connexion
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
