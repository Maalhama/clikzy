'use client'

import { useState, useCallback, useTransition, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useGame } from '@/hooks/useGame'
import { useTimer } from '@/hooks/useTimer'
import { useSounds } from '@/hooks/useSounds'
import { useBotSimulation } from '@/hooks/useBotSimulation'
import { useCredits } from '@/contexts/CreditsContext'
import { clickGame } from '@/actions/game'
import { GAME_CONSTANTS } from '@/lib/constants'
import { formatTime } from '@/lib/utils/timer'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductSvg } from '@/lib/utils/productImages'
import { CreditPacksModal } from '@/components/modals/CreditPacksModal'
import type { Game, Item } from '@/types/database'

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
  userId: string
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
  const { game, isConnected, optimisticUpdate, addClick, removeClick } = useGame(initialGame)
  const { credits, decrementCredits } = useCredits()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [clickAnimation, setClickAnimation] = useState(false)
  const [creditsAnimation, setCreditsAnimation] = useState(false)

  const { timeLeft, isUrgent, isEnded } = useTimer({ endTime: game.end_time })

  // Display actual time (everything resets to 60s)
  const displayTimeLeft = timeLeft
  const { playClick, playWin, playHeartbeat, stopAll: stopSounds } = useSounds(true)

  // Simulation pour expérience visuelle fluide
  useBotSimulation({
    gameId: game.id,
    endTime: game.end_time,
    status: game.status,
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

  // Get leader name (real or bot-generated for consistency)
  const leaderName = useMemo(() => {
    if (game.last_click_username) return game.last_click_username
    if (game.total_clicks > 0) return generateDeterministicUsername(game.id)
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

  // Show winner modal when game ends (either via status or timer reaching 0)
  const gameEnded = game.status === 'ended' || isEnded
  useEffect(() => {
    if (gameEnded && !showWinnerModal) {
      const timer = setTimeout(() => {
        setShowWinnerModal(true)
        if (game.winner_id === userId) playWin()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [gameEnded, showWinnerModal, game.winner_id, userId, playWin])

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20])
    }
  }, [])

  const handleClick = useCallback(() => {
    if (isPending || !hasCredits || !canClick) return

    setError(null)
    playClick()
    triggerHaptic()
    setClickAnimation(true)
    setCreditsAnimation(true)
    setTimeout(() => setClickAnimation(false), 150)
    setTimeout(() => setCreditsAnimation(false), 300)

    // Optimistic updates
    const now = new Date().toISOString()
    decrementCredits(GAME_CONSTANTS.CREDIT_COST_PER_CLICK)

    const newClick = { id: generateId(), username, clickedAt: now, isBot: false }
    addClick(newClick)

    const currentTimeLeft = game.end_time - Date.now()
    let newEndTime = game.end_time
    if (currentTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      newEndTime = Date.now() + GAME_CONSTANTS.TIMER_RESET_VALUE
    }

    const newTotalClicks = game.total_clicks + 1

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
        setError(result.error || 'Une erreur est survenue')
      }
    })
  }, [isPending, hasCredits, canClick, playClick, triggerHaptic, username, game, optimisticUpdate, decrementCredits, addClick, removeClick])

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

  const productImage = getProductSvg(game.item.name, game.item.id)

  return (
    <div className="min-h-screen pb-20 lg:pb-8">

      {/* Main content - Different layouts for mobile and desktop */}
      <div className="px-4 pt-4 md:px-6 lg:px-8 lg:pt-8">
        {/* MOBILE LAYOUT */}
        <div className="lg:hidden max-w-2xl mx-auto">
          {/* Game Card */}
          <div
            className={`rounded-2xl overflow-hidden backdrop-blur-sm ${isCritical ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}
            style={borderStyle}
          >
            {/* Product image section */}
            <div className={`relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden ${game.status === 'ended' ? 'grayscale-[30%]' : ''}`}>
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
                    className={`object-contain ${
                      game.status === 'ended'
                        ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] opacity-80'
                        : isUrgent
                        ? 'drop-shadow-[0_0_25px_rgba(255,68,68,0.5)]'
                        : 'drop-shadow-[0_0_20px_rgba(155,92,255,0.4)]'
                    }`}
                    priority
                    unoptimized
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
                      <div className="text-white/40 text-sm">
                        {isWinner ? 'Félicitations !' : 'a remporté ce lot'}
                      </div>
                    </div>
                    {isWinner && <span className="text-4xl">🎉</span>}
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl mb-5 transition-all ${isUrgent ? 'bg-danger/20 border border-danger/30' : 'bg-bg-tertiary/50 border border-white/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {game.status === 'waiting' ? 'Commence bientôt' : isUrgent ? 'Fonce !' : 'Temps restant'}
                    </span>
                    <span
                      suppressHydrationWarning
                      className={`font-mono font-bold text-3xl tracking-tight ${
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

              {/* Stats row */}
              <div className="flex items-center justify-between text-sm mb-5 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${game.status === 'ended' ? 'bg-success/10' : 'bg-neon-pink/10'}`}>
                    <svg className={`w-5 h-5 ${game.status === 'ended' ? 'text-success' : 'text-neon-pink'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs uppercase">Leader</div>
                    <div className={`font-semibold ${game.status === 'ended' ? 'text-success' : 'text-white'}`}>
                      {leaderName || '-'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs uppercase">Activité</div>
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

              {/* Click button - shows "Buy credits" when no credits */}
              {game.status !== 'ended' && !hasCredits && (
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_25px_rgba(155,92,255,0.4)] hover:shadow-[0_0_35px_rgba(155,92,255,0.6)] active:scale-[0.98]"
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
                  disabled={!canClick || isPending}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                    ${!canClick
                      ? 'bg-bg-secondary/50 text-white/30 cursor-not-allowed'
                      : isUrgent
                      ? `bg-danger text-white shadow-[0_0_30px_rgba(255,68,68,0.4)] hover:shadow-[0_0_40px_rgba(255,68,68,0.6)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : (game.item?.retail_value ?? 0) >= 1000
                      ? `bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : `bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_25px_rgba(155,92,255,0.4)] hover:shadow-[0_0_35px_rgba(155,92,255,0.6)] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                    }
                  `}
                >
                  {isPending ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : game.status === 'waiting' ? (
                    'En attente...'
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
                  ) : (game.item?.retail_value ?? 0) >= 1000 ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      V.I.P - 1 crédit
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
                <div className="mt-4 text-center text-danger bg-danger/10 border border-danger/30 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
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
                      <div className="text-white/40 text-xs uppercase">Mes crédits</div>
                      <div className="text-white font-medium">Solde disponible</div>
                    </div>
                  </div>
                  <div className={`text-3xl font-black transition-all duration-200 ${creditsAnimation ? 'scale-125 text-neon-pink' : 'scale-100 text-neon-blue'}`}>
                    {credits}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Rules */}
          <div className="mt-6 p-5 rounded-2xl bg-bg-secondary/30 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Règles du jeu
            </h3>
            <ul className="text-sm text-white/50 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                1 clic = 1 crédit
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Le dernier clic avant la fin gagne
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-pink flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Phase finale : chaque clic remet 1 min
              </li>
            </ul>
          </div>

          {/* Mobile: Game Rules */}
          <div className="mt-6 rounded-2xl bg-bg-secondary/30 border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-white font-bold text-sm">RÈGLES DU JEU</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Clique pour participer</p>
                  <p className="text-white/50 text-xs">Chaque clic coûte 1 crédit</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Le dernier clic gagne</p>
                  <p className="text-white/50 text-xs">Quand le timer atteint 0, le dernier cliqueur remporte le lot</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Phase finale</p>
                  <p className="text-white/50 text-xs">Quand il reste moins d&apos;1 min, chaque clic remet le timer à 1 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT - Compact */}
        <div className="hidden lg:block max-w-5xl mx-auto">
          <div className={`grid grid-cols-[1fr,1.2fr] gap-6 ${isCritical ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}>
            {/* LEFT COLUMN - Product Showcase */}
            <div
              className="rounded-2xl overflow-hidden backdrop-blur-sm"
              style={borderStyle}
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden ${game.status === 'ended' ? 'grayscale-[30%]' : ''}`}>
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
                      className={`object-contain ${
                        game.status === 'ended'
                          ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-80'
                          : isUrgent
                          ? 'drop-shadow-[0_0_30px_rgba(255,68,68,0.5)]'
                          : 'drop-shadow-[0_0_25px_rgba(155,92,255,0.4)]'
                      }`}
                      priority
                      unoptimized
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

            {/* RIGHT COLUMN - Action Panel */}
            <div className="space-y-4">
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
                      <div className="text-white/40 text-sm">
                        {isWinner ? 'Félicitations !' : 'a remporté ce lot'}
                      </div>
                    </div>
                    {isWinner && <span className="text-4xl">🎉</span>}
                  </div>
                </div>
              ) : (
                <div className={`p-5 rounded-2xl transition-all ${isUrgent ? 'bg-danger/20 border border-danger/40' : 'bg-bg-tertiary/50 border border-white/10'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {game.status === 'waiting' ? 'Commence bientôt' : isUrgent ? 'Fonce !' : 'Temps restant'}
                    </span>
                    <div
                      suppressHydrationWarning
                      className={`font-mono font-black text-4xl tracking-tight ${
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

              {/* Stats Row */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${game.status === 'ended' ? 'bg-success/10' : 'bg-neon-pink/10'}`}>
                    <svg className={`w-5 h-5 ${game.status === 'ended' ? 'text-success' : 'text-neon-pink'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs uppercase">Leader</div>
                    <div className={`font-semibold truncate ${game.status === 'ended' ? 'text-success' : 'text-white'}`}>
                      {leaderName || '-'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs uppercase">Activité</div>
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

              {/* Click Button */}
              {game.status !== 'ended' && !hasCredits && (
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_25px_rgba(155,92,255,0.4)] hover:shadow-[0_0_35px_rgba(155,92,255,0.6)] hover:scale-[1.01] active:scale-[0.98]"
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
                  disabled={!canClick || isPending}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                    ${!canClick
                      ? 'bg-bg-secondary/50 text-white/30 cursor-not-allowed'
                      : isUrgent
                      ? `bg-danger text-white shadow-[0_0_30px_rgba(255,68,68,0.4)] hover:shadow-[0_0_40px_rgba(255,68,68,0.6)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : (game.item?.retail_value ?? 0) >= 1000
                      ? `bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                      : `bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_25px_rgba(155,92,255,0.4)] hover:shadow-[0_0_35px_rgba(155,92,255,0.6)] hover:scale-[1.01] active:scale-[0.98] ${clickAnimation ? 'scale-95' : ''}`
                    }
                  `}
                >
                  {isPending ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : game.status === 'waiting' ? (
                    'En attente...'
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
                  ) : (game.item?.retail_value ?? 0) >= 1000 ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      V.I.P - 1 crédit
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
                <div className="text-center text-danger bg-danger/10 border border-danger/30 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Game Rules - Desktop Compact */}
              <div className="rounded-xl bg-bg-secondary/30 border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-white font-bold text-sm">RÈGLES DU JEU</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Clique pour participer</p>
                      <p className="text-white/50 text-xs">Chaque clic coûte 1 crédit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Le dernier clic gagne</p>
                      <p className="text-white/50 text-xs">Quand le timer atteint 0, le dernier cliqueur remporte le lot</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Phase finale</p>
                      <p className="text-white/50 text-xs">Quand il reste moins d&apos;1 min, chaque clic remet le timer à 1 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Bottom Row - Rules (Compact) */}
          <div className="mt-6 p-4 rounded-xl bg-bg-secondary/30 border border-white/5">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-white/40 font-medium">Règles:</span>
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                1 clic = 1 crédit
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Le dernier clic gagne
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Phase finale: reset 1 min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWinnerModal(false)} />
          <div
            className={`relative z-10 w-full max-w-md rounded-2xl overflow-hidden ${
              isWinner ? 'bg-gradient-to-br from-success/20 via-bg-secondary to-neon-purple/20 border border-success/30' : 'bg-bg-secondary border border-white/10'
            }`}
          >
            <div className="p-8 text-center">
              {isWinner ? (
                <>
                  <div className="text-7xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-2xl font-bold text-success mb-2">Félicitations !</h2>
                  <p className="text-white mb-4">Tu as gagné {game.item.name} !</p>
                  {game.item.retail_value && (
                    <p className="text-success text-lg font-semibold mb-6">
                      Valeur : {game.item.retail_value.toFixed(0)}€
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-xl font-bold text-white mb-2">Partie terminée</h2>
                  <p className="text-white/50 mb-2">Le gagnant est :</p>
                  <p className="text-neon-purple font-bold text-xl mb-6">
                    {leaderName || 'Inconnu'}
                  </p>
                </>
              )}
              <Link
                href="/lobby"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Retour au lobby
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Credit Packs Modal */}
      <CreditPacksModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </div>
  )
}
