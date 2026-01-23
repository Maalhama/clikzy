'use client'

import { memo, useMemo, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatTime, calculateTimeLeft } from '@/lib/utils/timer'
import { FINAL_PHASE_THRESHOLD } from '@/lib/utils/constants'
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'
import { getProductImageWithFallback } from '@/lib/utils/productImages'
import type { GameWithItem } from '@/types/database'
import type { GameWithFinalPhaseTracking } from '@/hooks/lobby/useLobbyRealtime'

interface GameCardProps {
  game: GameWithItem | GameWithFinalPhaseTracking
  index?: number
  isFavorite?: boolean
  onToggleFavorite?: (gameId: string) => void
}

// Helper to format duration since entering final phase
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h${minutes % 60}min`
}

// Helper to format "time ago" (il y a...)
function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `il y a ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export const GameCard = memo(function GameCard({ game, index = 0, isFavorite = false, onToggleFavorite }: GameCardProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    game.end_time ? calculateTimeLeft(game.end_time) : 0
  )
  const [prevClicks, setPrevClicks] = useState(game.total_clicks)
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLAnchorElement>(null)

  // Images avec fallback
  const { primary: neonImage, fallback: fallbackImage } = useMemo(
    () => getProductImageWithFallback(game.item.name, game.item.id),
    [game.item.name, game.item.id]
  )
  const currentImage = imgError ? fallbackImage : neonImage

  const isStatusEnded = game.status === 'ended'

  // Detect if timer reached zero (real-time ended state)
  const isTimerEnded = !isStatusEnded && timeLeft <= 0 && game.end_time && game.end_time <= Date.now()
  const isEnded = isStatusEnded || isTimerEnded

  // Live timer update using RAF for performance
  useEffect(() => {
    if (!game.end_time || isStatusEnded) return

    let animationId: number
    let lastUpdate = 0

    const updateTimer = (timestamp: number) => {
      // Update every 100ms for smooth countdown
      if (timestamp - lastUpdate >= 100) {
        setTimeLeft(calculateTimeLeft(game.end_time))
        lastUpdate = timestamp
      }
      animationId = requestAnimationFrame(updateTimer)
    }

    animationId = requestAnimationFrame(updateTimer)
    return () => cancelAnimationFrame(animationId)
  }, [game.end_time, isStatusEnded])

  // Click count sync
  useEffect(() => {
    if (game.total_clicks > prevClicks) {
      setPrevClicks(game.total_clicks)
    }
  }, [game.total_clicks, prevClicks])

  const isUrgent = !isEnded && timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
  const isCritical = !isEnded && timeLeft > 0 && timeLeft <= 10000

  // Display actual time (everything resets to 60s)
  const displayTimeLeft = timeLeft

  // Duration since entering final phase
  const enteredFinalPhaseAt = 'enteredFinalPhaseAt' in game ? game.enteredFinalPhaseAt : undefined
  const [finalPhaseDuration, setFinalPhaseDuration] = useState<number>(0)

  // Update final phase duration
  useEffect(() => {
    if (!isUrgent || !enteredFinalPhaseAt) {
      setFinalPhaseDuration(0)
      return
    }

    const updateDuration = () => {
      setFinalPhaseDuration(Date.now() - enteredFinalPhaseAt)
    }

    updateDuration()
    const interval = setInterval(updateDuration, 1000)
    return () => clearInterval(interval)
  }, [isUrgent, enteredFinalPhaseAt])

  // Duration since game ended (use ended_at if available)
  const [endedDuration, setEndedDuration] = useState<number>(0)

  useEffect(() => {
    const endedAt = game.ended_at ? new Date(game.ended_at).getTime() : game.end_time
    if (!isEnded || !endedAt) {
      setEndedDuration(0)
      return
    }

    const updateDuration = () => {
      setEndedDuration(Date.now() - endedAt)
    }

    updateDuration()
    const interval = setInterval(updateDuration, 60000) // Update every minute for ended games
    return () => clearInterval(interval)
  }, [isEnded, game.end_time, game.ended_at])

  // Get leader/winner name: real one or generate a consistent fake one
  const leaderName = useMemo(() => {
    // If there's a real last click username, use it
    if (game.last_click_username) {
      return game.last_click_username
    }

    // If game has clicks but no username, generate a deterministic one
    // This ensures server and client render the same name
    if (game.total_clicks > 0) {
      return generateDeterministicUsername(game.id)
    }

    return null
  }, [game.id, game.last_click_username, game.total_clicks])
  const isWaiting = game.status === 'waiting'

  // Timer countdown for waiting games (time until start_time)
  const [timeUntilStart, setTimeUntilStart] = useState<number>(() => {
    if (!isWaiting || !('start_time' in game) || !game.start_time) return 0
    const startTime = new Date(game.start_time).getTime()
    return Math.max(0, startTime - Date.now())
  })

  // Update countdown for waiting games
  useEffect(() => {
    if (!isWaiting || !('start_time' in game) || !game.start_time) return

    const startTime = new Date(game.start_time).getTime()

    const updateCountdown = () => {
      setTimeUntilStart(Math.max(0, startTime - Date.now()))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isWaiting, game])

  // Stagger animation delay
  const animationDelay = `${index * 50}ms`

  const cardClasses = useMemo(() => {
    const base = `
      group relative block rounded-2xl overflow-hidden
      backdrop-blur-sm
      transition-all duration-300
      hover:-translate-y-1
    `

    // Animation d'entrée uniquement au premier rendu (gérée par style animationDelay)
    const entryAnimation = 'animate-[fadeInUp_0.5s_ease-out_forwards] opacity-0'

    if (isEnded) {
      return `${base} ${entryAnimation} !opacity-80`
    }
    if (isCritical) {
      // Critical: shake animation + opacity visible (pas de fadeInUp pour éviter le conflit)
      return `${base} opacity-100 shadow-neon-danger animate-[shake_0.5s_ease-in-out_infinite]`
    }
    if (isUrgent) {
      return `${base} ${entryAnimation} shadow-[0_0_30px_rgba(255,68,68,0.3)]`
    }
    return `${base} ${entryAnimation} hover:shadow-[0_0_30px_rgba(155,92,255,0.2)]`
  }, [isUrgent, isCritical, isEnded])

  // Gradient border style
  const borderStyle = useMemo(() => {
    const cardBg = 'rgba(20, 27, 45, 0.95)'

    if (isEnded) {
      // Green gradient for ended
      return {
        background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #00FF88, #10B981, #34D399) border-box`,
        border: '1.5px solid transparent',
      }
    }
    if (isWaiting) {
      // Purple gradient for waiting (Bientôt)
      return {
        background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #9B5CFF, #7C3AED, #9B5CFF) border-box`,
        border: '1.5px solid transparent',
      }
    }
    if (isCritical || isUrgent) {
      // Red gradient for urgent
      return {
        background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #FF4757, #FF6B6B, #FF4757) border-box`,
        border: '1.5px solid transparent',
      }
    }
    // Pink/purple neon gradient for active
    return {
      background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, linear-gradient(135deg, #FF4FD8, #9B5CFF, #3CCBFF) border-box`,
      border: '1.5px solid transparent',
    }
  }, [isEnded, isWaiting, isCritical, isUrgent])

  return (
    <Link
      ref={cardRef}
      href={(isEnded || isWaiting) ? '#' : `/game/${game.id}`}
      className={cardClasses}
      style={{ animationDelay, ...borderStyle }}
      onClick={(isEnded || isWaiting) ? (e) => e.preventDefault() : undefined}
    >
      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(game.id)
          }}
          className={`
            absolute top-3 left-3 z-20 w-9 h-9 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isFavorite
              ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,79,216,0.5)]'
              : 'bg-bg-secondary/80 text-white/50 hover:text-white hover:bg-bg-secondary'
            }
          `}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg
            className="w-5 h-5 transition-transform"
            fill={isFavorite ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ transform: isFavorite ? 'scale(1.1)' : 'scale(1)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      )}

      {/* Won badge */}
      {isEnded && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Time ago badge (il y a...) */}
          {endedDuration > 0 && (
            <div className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-medium backdrop-blur-sm">
              {formatTimeAgo(endedDuration)}
            </div>
          )}
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold ${
            isTimerEnded ? 'bg-neon-purple/90 animate-pulse' : 'bg-success/90'
          }`}>
            {isTimerEnded ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FIN !
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                GAGNÉ
              </>
            )}
          </div>
        </div>
      )}

      {/* Waiting badge (Bientôt) */}
      {isWaiting && (
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold bg-neon-purple/90">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            BIENTÔT
          </div>
        </div>
      )}

      {/* Urgent badge */}
      {isUrgent && !isEnded && !isWaiting && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Duration badge */}
          {finalPhaseDuration > 0 && !isCritical && (
            <div className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-medium backdrop-blur-sm">
              {formatDuration(finalPhaseDuration)}
            </div>
          )}
          {/* Phase finale badge */}
          <div
            className={`
              flex items-center gap-1.5 px-2.5 py-1
              rounded-full text-white text-xs font-bold
              ${isCritical ? 'bg-danger animate-pulse' : 'bg-danger/90'}
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-white ${
                isCritical ? 'animate-ping' : 'animate-pulse'
              }`}
            />
            {isCritical ? 'GO GO GO !' : 'PHASE FINALE'}
          </div>
        </div>
      )}

      {/* Image section */}
      <div className={`relative aspect-[4/3] bg-gradient-to-br from-bg-tertiary to-bg-secondary overflow-hidden ${isEnded ? 'grayscale-[30%]' : ''}`}>
        {/* Glow effect on hover */}
        {!isEnded && (
          <div
            className={`
              absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-500 pointer-events-none
              ${isUrgent ? 'bg-danger/10' : 'bg-neon-purple/10'}
            `}
          />
        )}

        {/* Neon glow effect behind product */}
        {!isEnded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-3/4 h-3/4 rounded-full blur-3xl opacity-60 animate-pulse"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,79,216,0.8) 0%, rgba(155,92,255,0.6) 40%, rgba(60,203,255,0.4) 70%, transparent 100%)',
              }}
            />
          </div>
        )}

        {/* Product image */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className={`relative w-full h-full ${isEnded ? '' : 'group-hover:scale-110'} transition-transform duration-500`}>
            <Image
              src={currentImage}
              alt={game.item.name}
              fill
              className={`
                object-contain
                ${isEnded
                  ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] opacity-80'
                  : 'drop-shadow-[0_0_25px_rgba(255,79,216,0.5)] drop-shadow-[0_0_50px_rgba(155,92,255,0.3)]'
                }
              `}
              sizes="224px"
              onError={() => !imgError && setImgError(true)}
            />
          </div>
        </div>

        {/* Shine sweep effect */}
        {!isEnded && (
          <div
            className="
              absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-transform duration-1000 ease-in-out pointer-events-none
            "
          />
        )}

        {/* Price tag */}
        {game.item.retail_value && (
          <div
            className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg backdrop-blur-sm ${isEnded ? 'opacity-60' : ''}`}
            style={{
              background: isEnded
                ? 'rgba(100, 100, 100, 0.8)'
                : 'linear-gradient(135deg, rgba(155, 92, 255, 0.9), rgba(255, 92, 184, 0.9))',
              boxShadow: isEnded
                ? 'none'
                : '0 0 15px rgba(155, 92, 255, 0.5), 0 0 30px rgba(255, 92, 184, 0.3)',
            }}
          >
            <span className="font-black text-white text-lg drop-shadow-lg">
              {game.item.retail_value.toFixed(0)}€
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className={`font-bold text-lg mb-1 truncate transition-colors ${isEnded ? 'text-white/60' : 'text-white group-hover:text-neon-purple'}`}>
          {game.item.name}
        </h3>
        {game.item.description && !isEnded && (
          <p className="text-white/50 text-sm line-clamp-1 mb-4">
            {game.item.description}
          </p>
        )}

        {/* Won message or Timer box */}
        {isEnded ? (
          <div className="relative p-3 rounded-xl mb-4 bg-gradient-to-br from-success/10 via-emerald-500/5 to-success/10 border border-success/20 overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1 left-4 w-1 h-1 bg-success/40 rounded-full animate-pulse" />
              <div className="absolute top-3 right-6 w-0.5 h-0.5 bg-emerald-400/50 rounded-full animate-ping" />
              <div className="absolute bottom-2 left-8 w-0.5 h-0.5 bg-success/30 rounded-full animate-pulse" />
            </div>

            <div className="relative flex items-center gap-3">
              {/* Crown icon */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-success/20 to-emerald-500/20 border border-success/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                  </svg>
                </div>
              </div>

              {/* Winner info */}
              <div className="flex-1 min-w-0">
                <div className="text-success font-bold text-sm">
                  {leaderName || 'Champion'}
                </div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider">
                  a remporté ce lot
                </div>
              </div>

              {/* Check badge */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`
              p-3 rounded-xl mb-4 transition-all
              ${
                isUrgent
                  ? 'bg-danger/20 border border-danger/30'
                  : 'bg-bg-tertiary/50 border border-white/5'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                {isWaiting ? 'Disponible dans' : isUrgent ? 'Fonce !' : 'Temps restant'}
              </span>
              <span
                suppressHydrationWarning
                className={`
                  font-mono font-bold text-2xl tracking-tight
                  ${
                    isWaiting
                      ? 'text-neon-purple'
                      : isCritical
                      ? 'text-danger animate-pulse'
                      : isUrgent
                      ? 'text-danger'
                      : 'text-neon-blue'
                  }
                `}
              >
                {isWaiting ? formatTime(timeUntilStart) : formatTime(displayTimeLeft)}
              </span>
            </div>

            {/* Progress bar */}
            {!isWaiting && (
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  suppressHydrationWarning
                  className={`
                    h-full rounded-full transition-all duration-300
                    ${isUrgent ? 'bg-danger' : 'bg-neon-blue'}
                  `}
                  style={{
                    width: `${Math.min(100, (displayTimeLeft / FINAL_PHASE_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm mb-4">
          {/* Leader/Winner */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isEnded ? 'bg-success/10' : 'bg-neon-pink/10'}`}>
              <svg
                className={`w-4 h-4 ${isEnded ? 'text-success' : 'text-neon-pink'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {isEnded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                )}
              </svg>
            </div>
            <div>
              <div className="text-white/40 text-[10px] uppercase">
                {isEnded ? 'Gagnant' : 'Leader'}
              </div>
              <div className={`font-medium text-xs truncate max-w-[100px] ${isEnded ? 'text-success' : 'text-white'}`}>
                {leaderName || '-'}
              </div>
            </div>
          </div>

          {/* Activity indicator */}
          <div className="text-right">
            <div className="text-white/40 text-[9px] uppercase">Activité</div>
            <div className="flex items-center gap-0.5 justify-end">
              {isEnded ? (
                <span className="text-white/50 text-[10px] font-medium">Terminé</span>
              ) : isUrgent ? (
                <>
                  <svg className="w-3 h-3 text-danger animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                  </svg>
                  <span className="text-danger font-bold text-[10px]">Intense</span>
                </>
              ) : timeLeft <= 5 * 60 * 1000 ? (
                <>
                  <svg className="w-3 h-3 text-neon-pink" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                  </svg>
                  <span className="text-neon-pink font-bold text-[10px]">Élevée</span>
                </>
              ) : timeLeft <= 15 * 60 * 1000 ? (
                <>
                  <svg className="w-3 h-3 text-neon-blue" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                  </svg>
                  <span className="text-neon-blue font-medium text-[10px]">Modérée</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-white/50" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-1.5 0-2.8-.5-3.9-1.4-1.1-1-1.8-2.2-2-3.6-.2-1.4.1-2.7.8-4 .4-.7.9-1.4 1.4-2l.7 1c-.4.5-.7 1-1 1.5-.5 1-.7 2-.5 3 .2 1 .6 1.9 1.4 2.6.8.7 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1c.8-.7 1.3-1.6 1.4-2.6.2-1 0-2-.5-3-.5-1-1.3-1.9-2.2-2.6-.9-.8-2-1.4-3.1-1.8-1.2-.4-2.4-.6-3.6-.5.4-1.2 1-2.3 1.8-3.2 1-1 2.2-1.8 3.5-2.3 1.4-.5 2.8-.7 4.2-.6.7.1 1.3.2 2 .4l-.5 1.4c-.5-.2-1-.3-1.5-.3-1.1-.1-2.3.1-3.4.5s-2 1-2.8 1.8c-.6.6-1 1.3-1.4 2 1 0 2 .2 3 .5 1.2.4 2.4 1.1 3.4 2 1 .9 1.9 1.9 2.5 3.1.6 1.2.9 2.5.8 3.8-.2 1.5-.8 2.7-2 3.7-1.1.9-2.4 1.4-3.9 1.4z"/>
                  </svg>
                  <span className="text-white/50 font-medium text-[10px]">Calme</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        {isEnded ? (
          <div className="py-3 rounded-xl text-center text-sm border bg-success/5 border-success/20 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-success/80 font-medium">Partie terminée</span>
            {/* Total game duration badge */}
            {game.start_time && (game.ended_at || game.end_time) && (
              <span className="px-2 py-0.5 rounded-full bg-success/10 text-success/70 text-[10px] font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration((game.ended_at ? new Date(game.ended_at).getTime() : game.end_time) - new Date(game.start_time).getTime())}
              </span>
            )}
          </div>
        ) : isWaiting ? (
          <div className="py-3 rounded-xl text-center font-bold text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            BIENTÔT DISPONIBLE
          </div>
        ) : (
          <div
            className={`
              py-3 rounded-xl text-center font-bold text-sm transition-all
              ${
                isUrgent
                  ? 'bg-danger text-white group-hover:bg-danger/90 shadow-neon-danger'
                  : (game.item?.retail_value ?? 0) >= 1000
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white group-hover:opacity-90 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                  : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white group-hover:opacity-90 shadow-neon-purple'
              }
            `}
          >
            {isCritical ? 'CLIQUE !' : isUrgent ? 'FONCE' : (game.item?.retail_value ?? 0) >= 1000 ? 'V.I.P' : 'JOUER'}
          </div>
        )}
      </div>
    </Link>
  )
})
