'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductImageWithFallback } from '@/lib/utils/productImages'

export interface HeroLiveGame {
  id: string
  item_name: string
  item_image_url: string
  item_value: number
  end_time: number
  total_clicks: number
  last_click_username: string | null
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

interface HeroLiveCardProps {
  games: HeroLiveGame[]
  compact?: boolean
}

// Pool de lots crédibles pour les parties de démonstration (images réelles du catalogue)
const DEMO_POOL = [
  { name: 'iPhone 17 Pro', image: '/products/iphone-17-pro-neon.png', value: 1479 },
  { name: 'PlayStation 5 Pro', image: '/products/playstation-5-pro-neon.png', value: 799 },
  { name: 'MacBook Pro 16 M5 Max', image: '/products/macbook-pro-16-m5-max-neon.png', value: 4499 },
  { name: 'AirPods Pro 3', image: '/products/airpods-pro-3-neon.png', value: 299 },
]

function makeDemoGame(seed: number): HeroLiveGame {
  const item = DEMO_POOL[seed % DEMO_POOL.length]
  // Timer entre 2 et 7 minutes pour rester regardable
  const durationMs = (120 + Math.floor(Math.random() * 300)) * 1000
  return {
    id: `demo-${seed}`,
    item_name: item.name,
    item_image_url: item.image,
    item_value: item.value,
    end_time: Date.now() + durationMs,
    total_clicks: 12 + (seed % 40),
    last_click_username: null,
    status: 'active',
  }
}

/**
 * Carte « arène en direct » du hero : montre une vraie partie en cours
 * (produit, compte à rebours, leader). Quand la partie affichée se termine,
 * la suivante de la file prend sa place ; s'il n'y a plus de partie réelle,
 * une partie de démonstration est générée (lien vers /lobby).
 * Affichage uniquement — aucune écriture, les parties vivent côté backend.
 */
export function HeroLiveCard({ games, compact = false }: HeroLiveCardProps) {
  const [mounted, setMounted] = useState(false)
  const [demoSeed, setDemoSeed] = useState(0)
  const [demoGame, setDemoGame] = useState<HeroLiveGame | null>(null)
  // Tick d'expiration : force le recalcul de la partie courante
  const [, setExpiredTick] = useState(0)

  useEffect(() => setMounted(true), [])

  // Première partie réelle non expirée de la file
  const liveGame = useMemo(() => {
    const now = Date.now()
    return (
      games.find(
        (g) => g.status !== 'ended' && g.status !== 'waiting' && g.end_time > now
      ) ?? null
    )
  }, [games, mounted, demoSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Partie démo si plus rien de réel à montrer (client uniquement)
  useEffect(() => {
    if (!mounted) return
    if (liveGame) {
      setDemoGame(null)
      return
    }
    setDemoGame(makeDemoGame(demoSeed))
  }, [mounted, liveGame, demoSeed])

  const game = liveGame ?? demoGame
  const isDemo = !liveGame && !!demoGame

  const [timeLeft, setTimeLeft] = useState(() =>
    game?.end_time ? calculateTimeLeft(game.end_time) : 0
  )

  useEffect(() => {
    if (!game?.end_time) return
    const interval = setInterval(() => {
      const left = calculateTimeLeft(game.end_time)
      setTimeLeft(left)
      if (left <= 0) {
        // Partie finie : on passe à la suivante (réelle) ou on régénère une démo
        setExpiredTick((t) => t + 1)
        setDemoSeed((s) => s + 1)
      }
    }, 250)
    return () => clearInterval(interval)
  }, [game?.end_time, game?.id])

  const { primary: productImage, fallback: fallbackImage } = useMemo(
    () => getProductImageWithFallback(game?.item_name ?? '', game?.item_image_url ?? ''),
    [game?.item_name, game?.item_image_url]
  )
  const [imgError, setImgError] = useState(false)
  useEffect(() => setImgError(false), [game?.id])

  const leaderName = useMemo(() => {
    if (!game) return null
    if (game.last_click_username) return game.last_click_username
    if ((game.total_clicks ?? 0) > 0) return generateDeterministicUsername(game.id)
    return null
  }, [game])

  // Tilt 3D subtil au survol (desktop pointer fine uniquement) — appliqué sur
  // un wrapper externe pour ne pas entrer en conflit avec l'animation float.
  const tiltRef = useRef<HTMLDivElement>(null)
  const onTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    if (!el || !window.matchMedia('(pointer: fine)').matches) return
    const inner = el.firstElementChild as HTMLElement | null
    if (!inner) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    inner.style.transition = 'transform 0.18s ease-out'
    inner.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`
  }, [])
  const onTiltLeave = useCallback(() => {
    const inner = tiltRef.current?.firstElementChild as HTMLElement | null
    if (!inner) return
    inner.style.transition = 'transform 0.5s ease-out'
    inner.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }, [])

  // Coquille stable côté serveur tant qu'aucune partie n'est affichable
  if (!game || timeLeft < 0) {
    return (
      <div className={`hero-live-card ${compact ? 'p-4 min-h-[280px]' : 'p-6 min-h-[420px]'} flex items-center justify-center`}>
        <div className="flex items-center gap-2.5 text-white/40">
          <span className="live-dot" aria-hidden="true" />
          <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.3em]">
            Recherche d&apos;une partie…
          </span>
        </div>
      </div>
    )
  }

  const isUrgent = timeLeft > 0 && timeLeft <= 90000

  return (
    <div
      ref={tiltRef}
      onMouseMove={onTiltMove}
      onMouseLeave={onTiltLeave}
      style={{ perspective: '1100px' }}
    >
    {/* Couche tilt séparée : l'animation float vit sur le Link, le tilt ici */}
    <div style={{ transformStyle: 'preserve-3d' }}>
    <Link
      href={isDemo ? '/lobby' : `/game/${game.id}`}
      className={`hero-live-card hero-live-card-float group block overflow-hidden ${compact ? 'p-4' : 'p-6'}`}
    >
      {/* Le key force un remontage à chaque nouvelle partie → animation warp-in */}
      <div key={game.id} className="warp-in">
      {/* Bandeau live */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="live-dot" aria-hidden="true" />
          <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-success">
            En direct
          </span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-wider text-white/50">
          {isUrgent ? 'Phase finale' : 'Partie en cours'}
        </span>
      </div>

      {/* Produit */}
      <div className={`relative mx-auto ${compact ? 'h-36 w-36' : 'h-52 w-52'} mb-4`}>
        <div
          className="absolute inset-0 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,79,216,0.55) 0%, rgba(155,92,255,0.4) 50%, transparent 75%)',
          }}
        />
        <Image
          src={imgError ? fallbackImage : productImage}
          alt={game.item_name}
          fill
          sizes={compact ? '144px' : '208px'}
          className="object-contain drop-shadow-[0_0_30px_rgba(155,92,255,0.45)] transition-transform duration-500 group-hover:scale-105"
          priority
          onError={() => !imgError && setImgError(true)}
        />
      </div>

      {/* Nom + valeur */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className={`truncate font-bold text-white ${compact ? 'text-base' : 'text-lg'}`}>
            {game.item_name}
          </div>
          {leaderName && (
            <div className="mt-0.5 truncate text-xs text-white/45">
              Leader : <span className="font-semibold text-neon-pink">{leaderName}</span>
            </div>
          )}
        </div>
        <div className={`stat-numeral shrink-0 text-success ${compact ? 'text-xl' : 'text-2xl'}`}>
          {game.item_value.toLocaleString()}€
        </div>
      </div>

      {/* Compte à rebours */}
      <div className={`rounded-xl border p-3.5 ${isUrgent ? 'border-danger/40 bg-danger/15' : 'border-white/10 bg-white/[0.04]'}`}>
        <div className="flex items-center justify-between">
          <span className="text-[0.625rem] uppercase tracking-[0.2em] text-white/50">
            {isUrgent ? 'Fonce !' : 'Temps restant'}
          </span>
          <span
            suppressHydrationWarning
            className={`stat-numeral ${compact ? 'text-2xl' : 'text-3xl'} ${
              isUrgent ? 'animate-pulse text-danger' : 'text-neon-blue'
            }`}
          >
            {formatTime(Math.max(0, timeLeft))}
          </span>
        </div>
        <div className="meter-track mt-2.5 !h-1.5">
          <div
            suppressHydrationWarning
            className="meter-fill"
            style={{
              width: `${Math.min(100, (Math.max(0, timeLeft) / 90000) * 100)}%`,
              background: isUrgent ? 'linear-gradient(90deg, #FF4757, #FF4FD8)' : undefined,
            }}
          />
        </div>
      </div>

      {/* CTA implicite */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-display font-semibold uppercase tracking-wider text-neon-purple transition-colors group-hover:text-neon-pink">
        Rejoindre la partie
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      </div>
    </Link>
    </div>
    </div>
  )
}
