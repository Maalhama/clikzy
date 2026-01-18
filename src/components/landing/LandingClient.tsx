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
  PrizeCarousel,
  ClickPulse,
  TrustBadges,
  Testimonials,
  FloatingPrizes,
} from './widgets'

// Gaming Icons
import { TargetIcon, CursorClickIcon, TrophyIcon, GiftIcon } from '@/components/ui/GamingIcons'

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
      {/* FLOATING WIDGETS */}
      <LiveActivityToast enabled={true} maxVisible={3} />
      <FloatingTimer
        enabled={true}
        gameId={initialFeaturedGame?.id}
        initialEndTime={initialFeaturedGame?.end_time}
        itemName={featuredItem?.name}
      />

      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #9B5CFF 1px, transparent 1px),
              linear-gradient(#9B5CFF 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-blue/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
        <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            <span className="text-neon-purple">CLIK</span>
            <span className="text-neon-blue">ZY</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/lobby"
                className="gaming-btn px-6 py-2.5 text-sm font-bold"
              >
                JOUER
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="gaming-btn px-6 py-2.5 text-sm font-bold"
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

        <div className="absolute inset-0">
          {/* Diagonal lines */}
          <div className="absolute top-20 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent transform -skew-y-3" />
          <div className="absolute bottom-40 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent transform skew-y-2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Live badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded mb-6 clip-angle-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-purple" />
              </span>
              <span className="text-neon-purple text-sm font-bold uppercase tracking-wider">
                {playerCount} joueurs en ce moment
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6" style={{ perspective: '1000px' }}>
              <span className="block text-white">1 CLIC.</span>
              <span className="block text-white">1 GAGNANT.</span>
              <span className="block glitch-text" data-text="C'EST TOI?">
                <span className="text-neon-purple">C'EST</span>{' '}
                <span className="text-neon-blue">TOI?</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg md:text-xl text-white/60 max-w-md mb-8 leading-relaxed">
              Le dernier a cliquer gagne. iPhone, PS5, MacBook...
              <span className="text-neon-pink font-bold"> Gratuit si tu gagnes.</span>
            </p>

            {/* CTA */}
            <div className="hero-cta flex flex-wrap gap-4 mb-12">
              <Link
                href={isLoggedIn ? '/lobby' : '/register'}
                className="gaming-btn-large group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoggedIn ? 'JOUER MAINTENANT' : 'JE VEUX GAGNER'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <a
                href="#how"
                className="px-8 py-4 border-2 border-white/20 text-white font-bold hover:border-neon-blue/50 hover:text-neon-blue transition-all clip-angle"
              >
                C'EST QUOI CE DELIRE?
              </a>
            </div>

            {/* Stats */}
            <div className="hero-stats flex gap-8">
              <div className="stat-box">
                <div className="text-3xl font-black text-neon-blue">{stats.totalWinningsValue.toLocaleString()}€</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Deja gagnes</div>
              </div>
              <div className="stat-box">
                <div className="text-3xl font-black text-neon-purple">{stats.totalGames}+</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Objets distribues</div>
              </div>
              <div className="stat-box">
                <div className="text-3xl font-black text-white">10</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Credits gratuits</div>
              </div>
            </div>
          </div>

          {/* Right - Floating prizes showcase */}
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
      <section id="how" className="how-section relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="section-title text-4xl md:text-6xl font-black mb-4">
              ULTRA <span className="text-neon-purple">SIMPLE</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Meme ton petit frere peut comprendre
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'VISE',
                desc: 'iPhone? PS5? MacBook? Tu choisis. Tu veux, tu cliques.',
                Icon: TargetIcon,
                hex: '#9B5CFF',
              },
              {
                num: '02',
                title: 'CLIQUE',
                desc: '1 clic = 1 credit. Le timer repart. Tu restes le dernier? Tu gagnes.',
                Icon: CursorClickIcon,
                hex: '#3CCBFF',
              },
              {
                num: '03',
                title: 'ENCAISSE',
                desc: 'Timer a zero et t\'es le dernier? L\'objet est a toi. Livre chez toi.',
                Icon: TrophyIcon,
                hex: '#FF4FD8',
              },
            ].map((step, i) => (
              <div key={i} className="step-card group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 border border-white/10 hover:border-white/20 transition-colors clip-angle-lg">
                  <div className="text-7xl font-black opacity-10 absolute top-4 right-4" style={{ color: step.hex }}>
                    {step.num}
                  </div>
                  <div className="mb-6">
                    <step.Icon className="w-14 h-14" style={{ color: step.hex }} />
                  </div>
                  <h3 className="text-2xl font-black mb-3" style={{ color: step.hex }}>{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                  <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500" style={{ backgroundColor: step.hex }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              EUX <span className="text-neon-blue">L'ONT FAIT</span>
            </h2>
            <p className="text-white/50 text-lg">Pourquoi pas toi?</p>
          </div>
          <AnimatedStats
            totalWinnings={stats.totalWinningsValue}
            totalGames={stats.totalGames}
            playersOnline={playerCount || 42}
          />
        </div>
      </section>

      {/* PRIZES & GAMES SECTION */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-blue/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              CA POURRAIT <span className="text-neon-pink">ETRE A TOI</span>
            </h2>
            <p className="text-white/50 text-lg">Nouveaux objets chaque jour. Tu rates, tu pleures.</p>
          </div>
          <PrizeCarousel />
        </div>
      </section>

      {/* LEADERBOARD & TESTIMONIALS */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Leaderboard />
            <Testimonials />
          </div>
        </div>
      </section>

      {/* WINNERS SECTION */}
      <section className="winners-section relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Stats */}
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                PENDANT QUE <span className="text-neon-blue">TU HESITES...</span>
              </h2>
              <p className="text-white/50 text-lg mb-12 max-w-md">
                Eux ils cliquent. Et ils gagnent. <span className="text-neon-pink">En ce moment meme.</span>
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 clip-angle">
                  <div className="text-4xl font-black text-neon-purple mb-1">
                    {stats.totalWinningsValue.toLocaleString()}€
                  </div>
                  <div className="text-sm text-white/40 uppercase">Distribues</div>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 clip-angle">
                  <div className="text-4xl font-black text-neon-blue mb-1">
                    {(recentWinners.length || 4) * 100}+
                  </div>
                  <div className="text-sm text-white/40 uppercase">Chanceux</div>
                </div>
              </div>
            </div>

            {/* Right - Winners feed */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-transparent to-bg-primary z-10 pointer-events-none" />
              <div className="space-y-4 max-h-[400px] overflow-hidden">
                {(recentWinners.length > 0 ? recentWinners : [
                  { id: '1', username: 'Alex42', item_name: 'iPhone 15 Pro', item_value: 1299, won_at: new Date().toISOString() },
                  { id: '2', username: 'GamerPro', item_name: 'PS5', item_value: 549, won_at: new Date().toISOString() },
                  { id: '3', username: 'LuckyOne', item_name: 'AirPods Pro', item_value: 279, won_at: new Date().toISOString() },
                  { id: '4', username: 'WinnerX', item_name: 'Nintendo Switch', item_value: 329, won_at: new Date().toISOString() },
                ]).map((winner) => (
                  <div
                    key={winner.id}
                    className="winner-item flex items-center gap-4 p-4 bg-white/5 border border-white/10 clip-angle-sm"
                  >
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold">
                      {winner.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{winner.username}</div>
                      <div className="text-sm text-white/40">vient de remporter {winner.item_name}</div>
                    </div>
                    <div className="text-neon-blue font-bold">{winner.item_value}€</div>
                  </div>
                ))}
              </div>
            </div>
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
      <section className="final-cta relative py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center final-cta-content">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-blue/10 border border-neon-blue/30 rounded mb-8 clip-angle-sm">
            <span className="text-neon-blue text-sm font-bold flex items-center gap-2">
              <GiftIcon className="w-5 h-5" />
              10 CREDITS OFFERTS - MAINTENANT
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            TON <span className="text-neon-purple">IPHONE</span> T'ATTEND
          </h2>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto">
            10 credits gratuits a l'inscription. <span className="text-white">Zero risque. Que du gain.</span>
          </p>

          <Link
            href={isLoggedIn ? '/lobby' : '/register'}
            className="gaming-btn-large inline-flex"
          >
            <span className="relative z-10">
              {isLoggedIn ? 'JE JOUE' : 'JE TENTE MA CHANCE'}
            </span>
          </Link>

          <div className="mt-12 flex justify-center gap-8 text-sm text-white/30">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              0€ pour s'inscrire
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              100% legal
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Livraison gratuite
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-black">
            <span className="text-neon-purple">CLIK</span>
            <span className="text-neon-blue">ZY</span>
          </div>
          <p className="text-white/30 text-sm">
            © 2025 CLIKZY. Clique. Gagne. Repete.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialite</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
