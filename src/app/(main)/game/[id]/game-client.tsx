'use client'

import { useState, useCallback, useTransition, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { GameComments } from '@/components/comments/GameComments'
import Link from 'next/link'
import Image from 'next/image'
import { useGame } from '@/hooks/useGame'
import { useTimer } from '@/hooks/useTimer'
import { useSounds } from '@/hooks/useSounds'
import { useSoundPreference } from '@/hooks/useSoundPreference'
import { Volume2, VolumeX } from 'lucide-react'
import { useBotSimulation } from '@/hooks/useBotSimulation'
import { useCredits } from '@/contexts/CreditsContext'
import { useBadgeNotification } from '@/contexts/BadgeNotificationContext'
import { clickGame, getItemGauge, type GaugeState } from '@/actions/game'
import { GAME_CONSTANTS, GAUGE_ENABLED, GAUGE_MULTIPLIER } from '@/lib/constants'
import { ItemGauge, GaugeCaption } from '@/components/game/ItemGauge'
import { GameRules } from '@/components/game/GameRules'
import { formatTime } from '@/lib/utils/timer'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductImageWithFallback } from '@/lib/utils/productImages'
import { ShareWinButtons } from '@/components/game/ShareWinButtons'
import { ShareNearMissButtons } from '@/components/game/ShareNearMissButtons'
import { BuyItNowGameOffer } from '@/components/game/BuyItNowGameOffer'
import { GameContenders } from '@/components/game/GameContenders'
import { GameClicksFeed } from '@/components/game/GameClicksFeed'
import { trackGameClick, trackGameWin } from '@/lib/analytics'
import { createVIPCheckoutSession, checkVIPStatus } from '@/actions/stripe'
import type { Game, Item } from '@/types/database'

// Modales lourdes (chacune tire framer-motion) chargées en lazy : elles ne s'affichent
// que sur action (gate anon, achat de crédits, abonnement V.I.P) -> hors bundle initial
// de la route /game. Le rendu reste gardé par un booléen isOpen ; le piège de focus
// (useModalA11y, keyé sur isOpen) reste fonctionnel après chargement.
const AnonGateModal = dynamic(
  () => import('@/components/modals/AnonGateModal').then((m) => ({ default: m.AnonGateModal })),
  { ssr: false }
)
const CreditPacksModal = dynamic(
  () => import('@/components/modals/CreditPacksModal').then((m) => ({ default: m.CreditPacksModal })),
  { ssr: false }
)
const VIPSubscriptionModal = dynamic(
  () => import('@/components/modals/VIPSubscriptionModal'),
  { ssr: false }
)

// Generate UUID with fallback for browsers that don't support crypto.randomUUID
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type GameWithItem = Game & { item: Item }

type RecentClick = {
  id: string
  username: string
  clickedAt: string
  isBot?: boolean
}

type GameClientProps = {
  initialGame: GameWithItem
  initialCredits: number
  username: string
  userId: string | null
  recentClicks: RecentClick[]
}

export function GameClient({
  initialGame,
  initialCredits: _initialCredits,
  username,
  userId,
  recentClicks: _initialClicks,
}: GameClientProps) {
  // useGame now provides recentClicks from DB (synced with lobby)
  const { game, recentClicks, isConnected, optimisticUpdate, addClick, removeClick } = useGame(initialGame)
  const { credits, decrementCredits } = useCredits()
  const { showBadgeNotifications } = useBadgeNotification()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showVIPModal, setShowVIPModal] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [vipLoading, setVipLoading] = useState(false)
  const [clickAnimation, setClickAnimation] = useState(false)
  // A cliqué au moins une fois dans cette partie (pour proposer le partage near-miss en cas de défaite)
  const [hasParticipated, setHasParticipated] = useState(false)
  // Bursts de particules : un par clic, auto-purgés
  const [bursts, setBursts] = useState<number[]>([])
  const burstSeq = useRef(0)
  const [creditsAnimation, setCreditsAnimation] = useState(false)
  // JAUGE (feature en exploration) : progression perso vers CE modèle d'item.
  // Init SYNCHRONE pour afficher la fiole dès le 1er rendu (pas de pop-in / décalage) :
  // la cible est calculable depuis retail_value (déjà dispo) ; getItemGauge réconcilie
  // ensuite la progression réelle. Logged-in uniquement (anon = pas de fiole).
  const [gauge, setGauge] = useState<GaugeState | null>(() => {
    if (!GAUGE_ENABLED || !userId || !game.item_id) return null
    const retail = Number(game.item?.retail_value ?? 0)
    if (retail <= 0) return null
    return {
      progress: 0,
      target: Math.max(1, Math.round(retail * GAUGE_MULTIPLIER * 100)),
      completed: false,
      completedCount: 0,
    }
  })
  const [gaugeCelebrate, setGaugeCelebrate] = useState(false)
  // Annonces lecteur d'écran (régions live .sr-only) : le timer et les clics sont
  // purement visuels/sonores. On annonce par PALIERS (jamais à chaque tick) pour ne
  // pas spammer le lecteur d'écran.
  const [timerAnnounce, setTimerAnnounce] = useState('')
  const [clickAnnounce, setClickAnnounce] = useState('')
  const lastTimerBucketRef = useRef<string>('')
  const lastLeaderRef = useRef<string | null>(null)

  const { timeLeft, isUrgent, isEnded } = useTimer({ endTime: game.end_time ?? 0 })

  // Display actual time (everything resets to 60s)
  const displayTimeLeft = timeLeft
  // Libre choix du joueur : préférence sonore persistée (au lieu d'un son figé).
  const { soundEnabled, toggleSound } = useSoundPreference()
  const { playClick, playWin, playHeartbeat, stopAll: stopSounds } = useSounds(soundEnabled)

  // Simulation pour expérience visuelle fluide
  useBotSimulation({
    gameId: game.id,
    endTime: game.end_time ?? 0,
    status: game.status ?? '',
    battleStartTime: game.battle_start_time,
    lastClickUsername: game.last_click_username,
    lastClickUserId: game.last_click_user_id,
    addClick,
    optimisticUpdate,
    enabled: game.status === 'active' || game.status === 'final_phase',
  })

  const isCritical = timeLeft <= 10000 && timeLeft > 0
  const isWinner = game.status === 'ended' && game.winner_id === userId
  const canClick = !isEnded && game.status !== 'ended' && game.status !== 'waiting'
  const hasCredits = credits >= GAME_CONSTANTS.CREDIT_COST_PER_CLICK
  const isPremiumProduct = (game.item?.retail_value ?? 0) >= 1000

  // Annonce le compte à rebours UNIQUEMENT aux seuils utiles (entrée phase finale,
  // 30 s, 10 s, 5 s, 3-2-1, fin) — jamais à chaque seconde. On dérive un « palier »
  // de displayTimeLeft et on n'annonce qu'au changement de palier.
  useEffect(() => {
    if (game.status === 'waiting' || game.status === 'ended') return
    const secs = Math.ceil(displayTimeLeft / 1000)
    let bucket = ''
    let message = ''
    if (displayTimeLeft <= 0) {
      bucket = 'ended'
      message = 'Temps écoulé.'
    } else if (secs <= 3) {
      bucket = `s${secs}`
      message = `${secs}…`
    } else if (secs <= 5) {
      bucket = 's5'
      message = 'Plus que 5 secondes.'
    } else if (secs <= 10) {
      bucket = 's10'
      message = 'Plus que 10 secondes.'
    } else if (secs <= 30) {
      bucket = 's30'
      message = 'Plus que 30 secondes.'
    } else if (game.status === 'final_phase') {
      bucket = 'final'
      message = 'Phase finale, le dernier clic gagne.'
    }
    if (bucket && bucket !== lastTimerBucketRef.current) {
      lastTimerBucketRef.current = bucket
      if (message) setTimerAnnounce(message)
    }
  }, [displayTimeLeft, game.status])

  // Annonce le changement de leader (qui est en tête) sans spammer : seulement
  // quand le meneur change réellement.
  useEffect(() => {
    if (game.status === 'ended' || game.status === 'waiting') return
    const leader = game.last_click_username ?? null
    if (leader && leader !== lastLeaderRef.current) {
      const wasInit = lastLeaderRef.current !== null
      lastLeaderRef.current = leader
      if (wasInit) {
        setClickAnnounce(leader === username ? 'Tu es en tête.' : `${leader} a pris la tête.`)
      } else {
        lastLeaderRef.current = leader
      }
    }
  }, [game.last_click_username, game.status, username])

  // Check VIP status on mount for premium products
  useEffect(() => {
    if (isPremiumProduct) {
      checkVIPStatus().then((result) => {
        if (result.success && result.data) {
          setIsVip(result.data.isVip)
        }
      }).catch(() => {})
    }
  }, [isPremiumProduct])

  // Charge la progression de la jauge à l'ouverture (lecture own-row via RLS)
  useEffect(() => {
    if (!GAUGE_ENABLED || !userId || !game.item_id) return
    getItemGauge(game.item_id).then(setGauge).catch(() => {})
  }, [userId, game.item_id])

  // Get leader name (real or bot-generated for consistency)
  const leaderName = useMemo(() => {
    if (game.last_click_username) return game.last_click_username
    if ((game.total_clicks ?? 0) > 0) return generateDeterministicUsername(game.id)
    return null
  }, [game.id, game.last_click_username, game.total_clicks])

  // Heartbeat when critical
  useEffect(() => {
    if (isCritical && game.status !== 'ended') {
      playHeartbeat()
    } else {
      stopSounds()
    }
    return () => stopSounds()
  }, [isCritical, game.status, playHeartbeat, stopSounds])

  // Track win when game ends (sound + analytics, no modal)
  const hasPlayedWinRef = useRef(false)
  useEffect(() => {
    if (game.status === 'ended' && game.winner_id === userId && !hasPlayedWinRef.current) {
      hasPlayedWinRef.current = true
      playWin()
      // Annonce la victoire au lecteur d'écran (aujourd'hui : seulement son + vibration).
      setClickAnnounce(`Victoire ! Tu remportes ${game.item.name}.`)
      // Haptique de victoire (motif festif, distinct du clic) — no-op si non supporté.
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40, 60, 90])
      }
      trackGameWin(game.id, game.item.name, game.item.retail_value ?? 0)
    }
  }, [game.status, game.winner_id, userId, playWin, game.id, game.item.name, game.item])

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20])
    }
  }, [])

  // Handle VIP subscription
  const handleVIPSubscribe = useCallback(async () => {
    setVipLoading(true)
    try {
      const result = await createVIPCheckoutSession()
      if (result.success && result.data?.url) {
        window.location.href = result.data.url
      } else {
        setError(result.error || 'Erreur lors de la création de l\'abonnement')
        setShowVIPModal(false)
      }
    } catch {
      setError('Erreur lors de la création de l\'abonnement')
      setShowVIPModal(false)
    }
    setVipLoading(false)
  }, [])

  const handleClick = useCallback(() => {
    // Visiteur non connecté : on l'invite à créer un compte / se connecter
    if (!userId) {
      setShowAuthGate(true)
      return
    }

    if (isPending || !canClick) return

    // Plus de crédits : capter le pic d'intention en ouvrant directement l'achat
    // (au lieu d'un clic « dans le vide » sans réaction).
    if (!hasCredits) {
      setShowCreditModal(true)
      return
    }

    // Check VIP for premium products
    if (isPremiumProduct && !isVip) {
      setShowVIPModal(true)
      return
    }

    setError(null)
    playClick()
    triggerHaptic()
    trackGameClick(game.id, game.item.name)
    setClickAnimation(true)
    setCreditsAnimation(true)
    setHasParticipated(true)
    const burstId = ++burstSeq.current
    setBursts((prev) => [...prev.slice(-3), burstId])
    setTimeout(() => setBursts((prev) => prev.filter((b) => b !== burstId)), 600)
    setTimeout(() => setClickAnimation(false), 150)
    setTimeout(() => setCreditsAnimation(false), 300)

    // Optimistic updates
    const now = new Date().toISOString()
    decrementCredits(GAME_CONSTANTS.CREDIT_COST_PER_CLICK)
    // Jauge « cash réel » : on NE fait PAS d'avance optimiste (l'avance dépend du coût
    // cash du crédit, connu seulement du serveur). On réconcilie depuis result.data.gauge.

    const newClick = { id: generateId(), username, clickedAt: now, isBot: false }
    addClick(newClick)

    const currentTimeLeft = (game.end_time ?? 0) - Date.now()
    let newEndTime = game.end_time ?? 0
    if (currentTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      newEndTime = Date.now() + GAME_CONSTANTS.TIMER_RESET_VALUE
    }

    const newTotalClicks = (game.total_clicks ?? 0) + 1

    optimisticUpdate({
      last_click_username: username,
      last_click_at: now,
      total_clicks: newTotalClicks,
      end_time: newEndTime,
      status: currentTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD ? 'final_phase' : game.status,
    })

    startTransition(async () => {
      const result = await clickGame(game.id)
      if (!result.success) {
        // Refund credit by decrementing a negative amount
        decrementCredits(-GAME_CONSTANTS.CREDIT_COST_PER_CLICK)
        removeClick(newClick.id)
        // (pas d'avance optimiste de jauge à annuler)
        setError(result.error || 'Une erreur est survenue')
      } else {
        // Retour lecteur d'écran : confirmation du clic + crédits restants (action
        // centrale du produit, sinon le joueur aveugle clique « dans le vide »).
        const remaining = Math.max(0, credits - GAME_CONSTANTS.CREDIT_COST_PER_CLICK)
        setClickAnnounce(`Clic enregistré, tu es en tête. Crédits restants : ${remaining}.`)
        // Réconcilie la jauge avec l'état serveur (autoritaire) + célèbre la complétion
        if (result.data?.gauge) {
          setGauge(result.data.gauge)
          if (result.data.gauge.completed) {
            playWin()
            setGaugeCelebrate(true)
            setClickAnnounce('Jauge complétée, récompense débloquée !')
            setTimeout(() => setGaugeCelebrate(false), 4500)
          }
        }
        if (result.data?.newBadges && result.data.newBadges.length > 0) {
          // Show badge notifications for newly earned badges
          showBadgeNotifications(result.data.newBadges)
        }
      }
    })
  }, [userId, isPending, hasCredits, canClick, isPremiumProduct, isVip, playClick, playWin, triggerHaptic, username, game, credits, optimisticUpdate, decrementCredits, addClick, removeClick, showBadgeNotifications])

  // Border gradient style (same as lobby cards)
  const borderStyle = useMemo(() => {
    const cardBg = 'rgba(20, 27, 45, 0.95)'
    if (game.status === 'ended') {
      return {
        background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #00FF88, #10B981, #34D399) border-box`,
        border: '2px solid transparent',
      }
    }
    if (isCritical || isUrgent) {
      return {
        background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #FF4757, #FF6B6B, #FF4757) border-box`,
        border: '2px solid transparent',
      }
    }
    return {
      background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF, #3CCBFF) border-box`,
      border: '2px solid transparent',
    }
  }, [game.status, isCritical, isUrgent])

  const { primary: productImagePrimary, fallback: productImageFallback } = useMemo(
    () => getProductImageWithFallback(game.item.name, game.item.image_url),
    [game.item.name, game.item.image_url]
  )
  const [imgError, setImgError] = useState(false)
  // Si l'image produit 404 (ex: asset manquant), bascule sur le fallback au lieu d'une image cassée
  const productImage = imgError ? productImageFallback : productImagePrimary

  return (
    <div className="min-h-screen pb-20 lg:pb-8">

      {/* Régions live accessibles (masquées visuellement) : annoncent le compte à
          rebours par paliers et le retour de clic / changement de leader, sans
          dupliquer le timer visuel ni spammer le lecteur d'écran. */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="status">
        {timerAnnounce}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {clickAnnounce}
      </div>

      {/* Contrôle du son — libre choix du joueur, persistant (#292/#327) */}
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? 'Couper les effets sonores' : 'Activer les effets sonores'}
        aria-pressed={!soundEnabled}
        className="fixed right-4 bottom-24 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-bg-secondary/80 text-white/70 backdrop-blur-sm transition-colors hover:text-white lg:bottom-8"
      >
        {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      {/* Main content - Different layouts for mobile and desktop */}
      <div className="px-4 pt-4 md:px-6 lg:px-8 lg:pt-8">
        {/* MOBILE LAYOUT */}
        <div className="lg:hidden max-w-2xl mx-auto">
          {/* Game Card */}
          {isCritical && game.status !== 'ended' && <div className="arena-vignette" aria-hidden />}
          <div
            className={`rounded-2xl overflow-hidden backdrop-blur-sm ${isCritical ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}
            style={borderStyle}
          >
            {/* Product image section */}
            <div className={`relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden ${game.status === 'ended' ? 'grayscale-[30%]' : ''}`}>
              <div className="hero-stage-floor opacity-70" aria-hidden="true" />
              {/* Jauge FIOLE pixel-art : overlay magma à droite de la card */}
              {GAUGE_ENABLED && gauge && (
                <div className="absolute right-2 top-14 bottom-3 z-20 w-11">
                  <ItemGauge gauge={gauge} celebrate={gaugeCelebrate} itemName={game.item.name} />
                </div>
              )}
              {/* Back to lobby button - top left */}
              <Link
                href="/lobby"
                className="absolute top-3 left-3 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-black/70 transition-all"
                title="Retour au lobby"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {/* Connection status - top right (only if not ended and no urgent badge) */}
              {game.status !== 'ended' && !isUrgent && (
                <div className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm ${isConnected ? 'bg-black/50 border border-white/20' : 'bg-danger/20 border border-danger/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  <span className={`text-[10px] font-medium ${isConnected ? 'text-white/70' : 'text-danger'}`}>
                    {isConnected ? 'En direct' : 'Hors ligne'}
                  </span>
                </div>
              )}

              {/* Glow effect */}
              {game.status !== 'ended' && (
                <div className={`absolute inset-0 ${isUrgent ? 'bg-danger/10' : 'bg-neon-purple/10'}`} />
              )}

              {/* Product image */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-full h-full max-w-[200px] max-h-[200px]">
                  <Image
                    src={productImage}
                    alt={game.item.name}
                    fill
                    sizes="(min-width: 1024px) 220px, 200px"
                    className={`object-contain ${
                      game.status === 'ended'
                        ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] opacity-80'
                        : isUrgent
                        ? 'drop-shadow-[0_0_25px_rgba(255,68,68,0.5)]'
                        : 'drop-shadow-[0_0_20px_rgba(155,92,255,0.4)]'
                    }`}
                    priority
                    onError={() => !imgError && setImgError(true)}
                  />
                </div>
              </div>

              {/* Shine sweep effect */}
              {game.status !== 'ended' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
              )}

              {/* Price tag */}
              {game.item.retail_value && (
                <div
                  className={`absolute bottom-4 left-4 px-4 py-2 rounded-xl backdrop-blur-sm ${game.status === 'ended' ? 'opacity-60' : ''}`}
                  style={{
                    background: game.status === 'ended'
                      ? 'rgba(100, 100, 100, 0.8)'
                      : 'linear-gradient(135deg, rgba(155, 92, 255, 0.9), rgba(255, 92, 184, 0.9))',
                    boxShadow: game.status === 'ended'
                      ? 'none'
                      : '0 0 20px rgba(155, 92, 255, 0.5), 0 0 40px rgba(255, 92, 184, 0.3)',
                  }}
                >
                  <span className="font-black text-white text-2xl drop-shadow-lg">
                    {game.item.retail_value.toFixed(0)}€
                  </span>
                </div>
              )}

              {/* Status badge */}
              {game.status === 'ended' ? (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/90 text-white text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  TERMINÉ
                </div>
              ) : isUrgent && (
                <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-bold ${isCritical ? 'bg-danger animate-pulse' : 'bg-danger/90'}`}>
                  <span className={`w-2 h-2 rounded-full bg-white ${isCritical ? 'animate-ping' : 'animate-pulse'}`} />
                  {isCritical ? 'GO GO GO !' : 'PHASE FINALE'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h1 className={`font-bold text-xl mb-1 ${game.status === 'ended' ? 'text-white/60' : 'text-white'}`}>
                {game.item.name}
              </h1>
              {game.item.description && game.status !== 'ended' && (
                <p className="text-white/50 text-sm mb-5">{game.item.description}</p>
              )}

              {/* Timer box */}
              {game.status === 'ended' ? (
                <div className="relative p-4 rounded-xl mb-5 bg-gradient-to-br from-success/10 via-emerald-500/5 to-success/10 border border-success/20 overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-emerald-500/20 border border-success/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-success" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-success font-bold text-lg">
                        {isWinner ? 'Tu as gagné !' : leaderName || 'Champion'}
                      </div>
                      <div className="text-white/55 text-sm">
                        {isWinner ? 'Félicitations !' : 'a remporté ce lot'}
                      </div>
                    </div>
                    {isWinner && (
                      <svg className="w-10 h-10 text-success drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                        <circle cx="5" cy="5" r="1" fill="currentColor" />
                        <circle cx="19" cy="5" r="1" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  {isWinner && <ShareWinButtons itemName={game.item.name} itemValue={game.item.retail_value ?? 0} username={username} />}
                  {!isWinner && hasParticipated && <ShareNearMissButtons itemName={game.item.name} username={username} />}
                  {!isWinner && hasParticipated && <BuyItNowGameOffer gameId={game.id} />}
                </div>
              ) : (
                <div className={`p-4 rounded-xl mb-5 transition-all ${isUrgent ? 'bg-danger/20 border border-danger/30' : 'hero-live-card'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {game.status === 'waiting' ? 'Commence bientôt' : isUrgent ? 'Fonce !' : 'Temps restant'}
                    </span>
                    <span
                      suppressHydrationWarning
                      role="timer"
                      aria-label={game.status === 'waiting' ? 'Le jeu commence bientôt' : `Temps restant : ${formatTime(displayTimeLeft)}`}
                      className={`stat-numeral text-3xl ${
                        isCritical ? 'text-danger animate-pulse' : isUrgent ? 'text-danger' : 'text-neon-blue'
                      }`}
                    >
                      {game.status === 'waiting' ? '--:--' : formatTime(displayTimeLeft)}
                    </span>
                  </div>
                  {game.status !== 'waiting' && (
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        suppressHydrationWarning
                        className={`h-full rounded-full transition-all duration-300 ${isUrgent ? 'bg-danger' : 'bg-neon-blue'}`}
                        style={{ width: `${Math.min(100, (displayTimeLeft / 90000) * 100)}%` }}
                      />
                    </div>
                  )}
                  {isUrgent && (
                    <p className="text-danger text-xs mt-3 text-center flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Chaque clic remet le timer à 1min30 !
                    </p>
                  )}
                </div>
              )}

              {/* Jauge perso (feature en exploration) : la FIOLE est en overlay sur la
                  card produit (à droite) ; ici uniquement la légende explicative. */}
              {GAUGE_ENABLED && gauge && (
                <div className="mb-5">
                  <GaugeCaption gauge={gauge} itemName={game.item.name} />
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center justify-between text-sm mb-5 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${game.status === 'ended' ? 'bg-success/10' : 'bg-neon-pink/10'}`}>
                    <svg className={`w-5 h-5 ${game.status === 'ended' ? 'text-success' : 'text-neon-pink'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/55 text-xs uppercase">Leader</div>
                    <div className={`font-semibold ${game.status === 'ended' ? 'text-success' : 'text-white'}`}>
                      {leaderName || '-'}
                    </div>
                    <GameContenders gameId={game.id} status={game.status} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/55 text-xs uppercase">Activité</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    {game.status === 'ended' ? (
                      <span className="text-white/50 font-medium">Terminé</span>
                    ) : isUrgent ? (
                      <>
                        <svg className="w-5 h-5 text-danger animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-danger font-bold">Intense</span>
                      </>
                    ) : timeLeft <= 5 * 60 * 1000 ? (
                      <>
                        <svg className="w-5 h-5 text-neon-pink" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-neon-pink font-bold">Élevée</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-neon-blue font-medium">Active</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Anon : inviter à créer un compte (pas d'achat sans compte) */}
              {game.status !== 'ended' && !userId && (
                <button
                  onClick={() => setShowAuthGate(true)}
                  className="btn-arena w-full whitespace-nowrap py-4 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  FONCE !
                </button>
              )}
              {/* Connecté sans crédits : achat */}
              {game.status !== 'ended' && userId && !hasCredits && (
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="btn-arena w-full py-4 text-base"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Acheter des crédits
                </button>
              )}
              {game.status !== 'ended' && hasCredits && (
                <div className="relative">
                {bursts.map((id) => (
                  <span key={id} className="click-burst" aria-hidden>
                    {Array.from({ length: 10 }, (_, i) => {
                      const angle = (i / 10) * Math.PI * 2 + (id % 7) * 0.31
                      const dist = 46 + ((id + i) % 4) * 14
                      return (
                        <i
                          key={i}
                          style={{
                            '--bx': `${Math.cos(angle) * dist}px`,
                            '--by': `${Math.sin(angle) * dist - 18}px`,
                          } as React.CSSProperties}
                        />
                      )
                    })}
                  </span>
                ))}
                <button
                  onClick={handleClick}
                  disabled={!canClick}
                  className={`
                    w-full py-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] font-display font-semibold uppercase tracking-wide text-base transition-all flex items-center justify-center gap-2
                    ${!canClick
                      ? 'bg-bg-secondary/50 text-white/50 cursor-not-allowed'
                      : (game.item?.retail_value ?? 0) >= 1000
                      ? isUrgent
                        ? `bg-gradient-to-r from-[#FFB800] via-[#FF8C00] to-[#FFD700] text-[#0B0F1A] drop-shadow-[0_0_14px_rgba(255,184,0,0.55)] active:scale-[0.98] animate-pulse ${clickAnimation ? 'scale-95' : ''}`
                        : `bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] text-[#0B0F1A] drop-shadow-[0_0_12px_rgba(255,184,0,0.5)] hover:drop-shadow-[0_0_18px_rgba(255,184,0,0.7)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : isUrgent
                      ? `bg-danger text-white drop-shadow-[0_0_14px_rgba(255,71,87,0.5)] hover:drop-shadow-[0_0_20px_rgba(255,71,87,0.7)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : `bg-gradient-to-r from-neon-purple to-neon-pink text-white drop-shadow-[0_0_12px_rgba(155,92,255,0.45)] hover:drop-shadow-[0_0_18px_rgba(155,92,255,0.65)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                    }
                  `}
                >
                  {game.status === 'waiting' ? (
                    'En attente...'
                  ) : (game.item?.retail_value ?? 0) >= 1000 ? (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                      {isCritical ? 'CLIQUE !' : isUrgent ? 'FONCE !' : 'V.I.P - 1 crédit'}
                    </>
                  ) : isCritical ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      CLIQUE MAINTENANT !
                    </>
                  ) : isUrgent ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      FONCE !
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      CLIQUER - 1 crédit
                    </>
                  )}
                </button>
                </div>
              )}

              {error && (
                <div role="alert" className="mt-4 text-center text-danger bg-danger/10 border border-danger/30 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Credits box */}
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-neon-purple/10 via-neon-blue/10 to-neon-pink/10 border border-neon-purple/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white/50 text-xs uppercase">Mes crédits</div>
                      <div className="text-white font-medium">Solde disponible</div>
                    </div>
                  </div>
                  <div className={`text-3xl stat-numeral transition-all duration-200 ${creditsAnimation ? 'scale-125 text-neon-pink' : 'scale-100 text-neon-blue'}`}>
                    {credits}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discussion de la partie (mobile) — placée AVANT les derniers clics */}
          <GameComments gameId={game.id} userId={userId} itemName={game.item.name} />

          {/* Mobile: derniers clics */}
          <div className="lg:hidden">
            <GameClicksFeed clicks={recentClicks} />
          </div>

          {/* Règles du jeu (mobile) */}
          <GameRules className="mt-6 panel" beginnersOnly={!!game.beginners_only} />

        </div>

        {/* DESKTOP LAYOUT - Compact */}
        <div className="hidden lg:block max-w-5xl mx-auto">
          <div className={`grid grid-cols-[1fr,1.2fr] gap-6 ${isCritical ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}>
            {/* LEFT COLUMN - Card produit + discussion (comble l'espace libre
                sous la carte, à gauche des derniers clics). */}
            <div className="self-start space-y-4">
              <div
                className="rounded-2xl overflow-hidden backdrop-blur-sm"
                style={borderStyle}
              >
              <div className={`relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden ${game.status === 'ended' ? 'grayscale-[30%]' : ''}`}>
              <div className="hero-stage-floor opacity-70" aria-hidden="true" />
                {/* Jauge FIOLE pixel-art : overlay magma à droite de l'image, dans la card */}
                {GAUGE_ENABLED && gauge && (
                  <div className="absolute right-3 top-16 bottom-4 z-20 w-12">
                    <ItemGauge gauge={gauge} celebrate={gaugeCelebrate} itemName={game.item.name} />
                  </div>
                )}
                {/* Back to lobby button - top left */}
                <Link
                  href="/lobby"
                  className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-black/70 transition-all"
                  title="Retour au lobby"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>

                {/* Glow effect */}
                {game.status !== 'ended' && (
                  <div className={`absolute inset-0 ${isUrgent ? 'bg-danger/10' : 'bg-neon-purple/10'}`} />
                )}

                {/* Product image */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative w-full h-full max-w-[220px] max-h-[220px]">
                    <Image
                      src={productImage}
                      alt={game.item.name}
                      fill
                      sizes="(min-width: 1024px) 220px, 200px"
                      className={`object-contain ${
                        game.status === 'ended'
                          ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-80'
                          : isUrgent
                          ? 'drop-shadow-[0_0_30px_rgba(255,68,68,0.5)]'
                          : 'drop-shadow-[0_0_25px_rgba(155,92,255,0.4)]'
                      }`}
                      priority
                      onError={() => !imgError && setImgError(true)}
                    />
                  </div>
                </div>

                {/* Shine sweep effect */}
                {game.status !== 'ended' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
                )}

                {/* Price tag */}
                {game.item.retail_value && (
                  <div
                    className={`absolute bottom-4 left-4 px-4 py-2 rounded-xl backdrop-blur-sm ${game.status === 'ended' ? 'opacity-60' : ''}`}
                    style={{
                      background: game.status === 'ended'
                        ? 'rgba(100, 100, 100, 0.8)'
                        : 'linear-gradient(135deg, rgba(155, 92, 255, 0.9), rgba(255, 92, 184, 0.9))',
                      boxShadow: game.status === 'ended'
                        ? 'none'
                        : '0 0 20px rgba(155, 92, 255, 0.5), 0 0 40px rgba(255, 92, 184, 0.3)',
                    }}
                  >
                    <span className="font-black text-white text-2xl drop-shadow-lg">
                      {game.item.retail_value.toFixed(0)}€
                    </span>
                  </div>
                )}

                {/* Status badge */}
                {game.status === 'ended' ? (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/90 text-white text-sm font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    TERMINÉ
                  </div>
                ) : isUrgent && (
                  <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-bold ${isCritical ? 'bg-danger animate-pulse' : 'bg-danger/90'}`}>
                    <span className={`w-2 h-2 rounded-full bg-white ${isCritical ? 'animate-ping' : 'animate-pulse'}`} />
                    {isCritical ? 'GO GO GO !' : 'PHASE FINALE'}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="p-4">
                <h1 className={`font-bold text-xl mb-1 ${game.status === 'ended' ? 'text-white/60' : 'text-white'}`}>
                  {game.item.name}
                </h1>
                {game.item.description && game.status !== 'ended' && (
                  <p className="text-white/50 text-sm line-clamp-2">{game.item.description}</p>
                )}
              </div>
              </div>
              {/* Discussion de la partie (comble l'espace sous la carte) */}
              <GameComments gameId={game.id} userId={userId} itemName={game.item.name} />
            </div>

            {/* RIGHT COLUMN - Action Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="live-dot" aria-hidden="true" />
                <span className="kicker !text-[0.6rem]">Arène en direct</span>
              </div>
              {/* Timer Card */}
              {game.status === 'ended' ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-success/10 via-emerald-500/5 to-success/10 border border-success/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/20 to-emerald-500/20 border border-success/30 flex items-center justify-center">
                      <svg className="w-7 h-7 text-success" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-success font-bold text-xl">
                        {isWinner ? 'Tu as gagné !' : leaderName || 'Champion'}
                      </div>
                      <div className="text-white/55 text-sm">
                        {isWinner ? 'Félicitations !' : 'a remporté ce lot'}
                      </div>
                    </div>
                    {isWinner && (
                      <svg className="w-10 h-10 text-success drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                        <circle cx="5" cy="5" r="1" fill="currentColor" />
                        <circle cx="19" cy="5" r="1" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  {isWinner && <ShareWinButtons itemName={game.item.name} itemValue={game.item.retail_value ?? 0} username={username} />}
                  {!isWinner && hasParticipated && <ShareNearMissButtons itemName={game.item.name} username={username} />}
                  {!isWinner && hasParticipated && <BuyItNowGameOffer gameId={game.id} />}
                </div>
              ) : (
                <div className={`p-5 rounded-2xl transition-all ${isUrgent ? 'bg-danger/20 border border-danger/40' : 'hero-live-card'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {game.status === 'waiting' ? 'Commence bientôt' : isUrgent ? 'Fonce !' : 'Temps restant'}
                    </span>
                    <div
                      suppressHydrationWarning
                      role="timer"
                      aria-label={game.status === 'waiting' ? 'Le jeu commence bientôt' : `Temps restant : ${formatTime(displayTimeLeft)}`}
                      className={`stat-numeral text-4xl ${
                        isCritical ? 'text-danger animate-pulse' : isUrgent ? 'text-danger' : 'text-neon-blue'
                      }`}
                    >
                      {game.status === 'waiting' ? '--:--' : formatTime(displayTimeLeft)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {game.status !== 'waiting' && (
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        suppressHydrationWarning
                        className={`h-full rounded-full transition-all duration-300 ${isUrgent ? 'bg-danger' : 'bg-neon-blue'}`}
                        style={{ width: `${Math.min(100, (displayTimeLeft / 90000) * 100)}%` }}
                      />
                    </div>
                  )}

                  {isUrgent && (
                    <p className="text-danger text-xs mt-3 text-center flex items-center justify-center gap-1 font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Chaque clic remet le timer à 1min30 !
                    </p>
                  )}
                </div>
              )}

              {/* Jauge perso (feature en exploration) : fiole en overlay sur la card ;
                  ici la légende explicative. */}
              {GAUGE_ENABLED && gauge && (
                <div className="mb-4">
                  <GaugeCaption gauge={gauge} itemName={game.item.name} />
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${game.status === 'ended' ? 'bg-success/10' : 'bg-neon-pink/10'}`}>
                    <svg className={`w-5 h-5 ${game.status === 'ended' ? 'text-success' : 'text-neon-pink'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/55 text-xs uppercase">Leader</div>
                    <div className={`font-semibold truncate ${game.status === 'ended' ? 'text-success' : 'text-white'}`}>
                      {leaderName || '-'}
                    </div>
                    <GameContenders gameId={game.id} status={game.status} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/55 text-xs uppercase">Activité</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    {game.status === 'ended' ? (
                      <span className="text-white/50 font-medium text-lg">Terminé</span>
                    ) : isUrgent ? (
                      <>
                        <svg className="w-6 h-6 text-danger animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-danger font-bold text-lg">Intense</span>
                      </>
                    ) : timeLeft <= 5 * 60 * 1000 ? (
                      <>
                        <svg className="w-6 h-6 text-neon-pink" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-neon-pink font-bold text-lg">Élevée</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                        </svg>
                        <span className="text-neon-blue font-medium text-lg">Active</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Anon : inviter à créer un compte */}
              {game.status !== 'ended' && !userId && (
                <button
                  onClick={() => setShowAuthGate(true)}
                  className="w-full py-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] font-display font-semibold uppercase tracking-wide text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-pink text-white drop-shadow-[0_0_12px_rgba(155,92,255,0.45)] hover:drop-shadow-[0_0_18px_rgba(155,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  FONCE !
                </button>
              )}
              {/* Connecté sans crédits : achat */}
              {game.status !== 'ended' && userId && !hasCredits && (
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="w-full py-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] font-display font-semibold uppercase tracking-wide text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-pink text-white drop-shadow-[0_0_12px_rgba(155,92,255,0.45)] hover:drop-shadow-[0_0_18px_rgba(155,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Acheter des crédits
                </button>
              )}
              {game.status !== 'ended' && hasCredits && (
                <button
                  onClick={handleClick}
                  disabled={!canClick}
                  className={`
                    w-full py-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] font-display font-semibold uppercase tracking-wide text-base transition-all flex items-center justify-center gap-2
                    ${!canClick
                      ? 'bg-bg-secondary/50 text-white/50 cursor-not-allowed'
                      : (game.item?.retail_value ?? 0) >= 1000
                      ? isUrgent
                        ? `bg-gradient-to-r from-[#FFB800] via-[#FF8C00] to-[#FFD700] text-[#0B0F1A] drop-shadow-[0_0_14px_rgba(255,184,0,0.55)] hover:scale-[1.01] active:scale-[0.98] animate-pulse ${clickAnimation ? 'scale-95' : ''}`
                        : `bg-gradient-to-r from-[#FFB800] via-[#FFD700] to-[#FF8C00] text-[#0B0F1A] drop-shadow-[0_0_12px_rgba(255,184,0,0.5)] hover:drop-shadow-[0_0_18px_rgba(255,184,0,0.7)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : isUrgent
                      ? `bg-danger text-white drop-shadow-[0_0_14px_rgba(255,71,87,0.5)] hover:drop-shadow-[0_0_20px_rgba(255,71,87,0.7)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : `bg-gradient-to-r from-neon-purple to-neon-pink text-white drop-shadow-[0_0_12px_rgba(155,92,255,0.45)] hover:drop-shadow-[0_0_18px_rgba(155,92,255,0.65)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                    }
                  `}
                >
                  {game.status === 'waiting' ? (
                    'En attente...'
                  ) : (game.item?.retail_value ?? 0) >= 1000 ? (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                      {isCritical ? 'CLIQUE !' : isUrgent ? 'FONCE !' : 'V.I.P - 1 crédit'}
                    </>
                  ) : isCritical ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      CLIQUE MAINTENANT !
                    </>
                  ) : isUrgent ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      FONCE !
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      CLIQUER - 1 crédit
                    </>
                  )}
                </button>
              )}

              {error && (
                <div role="alert" className="text-center text-danger bg-danger/10 border border-danger/30 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Derniers clics - Desktop */}
              <GameClicksFeed clicks={recentClicks} />

              {/* Règles du jeu (desktop) */}
              <GameRules className="rounded-xl bg-bg-secondary/30 border border-white/10" beginnersOnly={!!game.beginners_only} />
            </div>
          </div>

          {/* (Bandeau règles supprimé : il dupliquait mot pour mot le panneau
              « Règles du jeu » affiché juste au-dessus dans la colonne droite.) */}
        </div>
      </div>

      {/* Credit Packs Modal (lazy : ne télécharge son JS qu'à la 1re ouverture) */}
      {showCreditModal && (
        <CreditPacksModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
        />
      )}

      {/* VIP Subscription Modal (lazy) */}
      {showVIPModal && (
        <VIPSubscriptionModal
          isOpen={showVIPModal}
          onClose={() => setShowVIPModal(false)}
          onSubscribe={handleVIPSubscribe}
          isLoading={vipLoading}
        />
      )}

      {/* Anon : modal d'invitation à l'inscription (au lieu de l'achat de crédits) — lazy */}
      {showAuthGate && (
        <AnonGateModal isOpen={showAuthGate} onClose={() => setShowAuthGate(false)} />
      )}
    </div>
  )
}
