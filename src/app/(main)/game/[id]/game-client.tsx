'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useGame } from '@/hooks/useGame'
import { useTimer } from '@/hooks/useTimer'
import { clickGame } from '@/actions/game'
import { GAME_CONSTANTS } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Timer, ClickZone, WinnerModal, ItemDisplay, GameStats } from '@/components/game'
import type { Game, Item } from '@/types/database'

type GameWithItem = Game & {
  item: Item
}

type RecentClick = {
  id: string
  username: string
  clickedAt: string
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
  initialCredits,
  username,
  userId,
  recentClicks: initialClicks,
}: GameClientProps) {
  const { game, isConnected, optimisticUpdate } = useGame(initialGame)
  const [credits, setCredits] = useState(initialCredits)
  const [recentClicks, setRecentClicks] = useState(initialClicks)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)

  const { timeLeft, isUrgent, isEnded } = useTimer({
    endTime: game.end_time,
  })

  // Show winner modal when game ends
  useEffect(() => {
    if (game.status === 'ended' && game.winner_id) {
      const timer = setTimeout(() => setShowWinnerModal(true), 500)
      return () => clearTimeout(timer)
    }
  }, [game.status, game.winner_id])

  const handleClick = useCallback(() => {
    if (isPending || credits < GAME_CONSTANTS.CREDIT_COST_PER_CLICK) return

    setError(null)

    // Optimistic updates
    const now = new Date().toISOString()
    setCredits((prev) => prev - GAME_CONSTANTS.CREDIT_COST_PER_CLICK)

    const newClick = {
      id: crypto.randomUUID(),
      username,
      clickedAt: now,
    }
    setRecentClicks((prev) => [newClick, ...prev.slice(0, 9)])

    // Calculate optimistic end time
    const currentTimeLeft = game.end_time - Date.now()
    let newEndTime = game.end_time

    if (currentTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD) {
      newEndTime = Date.now() + GAME_CONSTANTS.TIMER_RESET_VALUE
    }

    optimisticUpdate({
      last_click_username: username,
      last_click_at: now,
      total_clicks: game.total_clicks + 1,
      end_time: newEndTime,
      status: currentTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD ? 'final_phase' : game.status,
    })

    startTransition(async () => {
      const result = await clickGame(game.id)

      if (!result.success) {
        // Revert optimistic updates
        setCredits((prev) => prev + GAME_CONSTANTS.CREDIT_COST_PER_CLICK)
        setRecentClicks((prev) => prev.filter((c) => c.id !== newClick.id))
        setError(result.error || 'Une erreur est survenue')
      }
    })
  }, [isPending, credits, username, game, optimisticUpdate])

  const isWinner = game.status === 'ended' && game.winner_id === userId
  const canClick = !isEnded && game.status !== 'ended' && game.status !== 'waiting'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/lobby"
        className="inline-flex items-center text-text-secondary hover:text-neon-purple transition-colors mb-6 group"
      >
        <svg
          className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au lobby
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main game area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item display */}
          <Card variant="gradient">
            <ItemDisplay item={game.item} />
          </Card>

          {/* Timer and click zone */}
          <Card
            variant="neon"
            className={`overflow-hidden ${isUrgent ? 'border-danger shadow-danger/20' : ''}`}
          >
            <CardContent className="p-8">
              {/* Status message for ended game */}
              {game.status === 'ended' && (
                <div className="text-center mb-6">
                  {isWinner ? (
                    <div className="bg-success/20 border border-success/50 rounded-xl p-8">
                      <div className="text-6xl mb-4 animate-bounce">🎉</div>
                      <h2 className="text-3xl font-bold text-success neon-text-success mb-2">
                        Félicitations !
                      </h2>
                      <p className="text-text-secondary text-lg">
                        Tu as remporté <span className="text-text-primary font-semibold">{game.item.name}</span> !
                      </p>
                    </div>
                  ) : game.winner_id ? (
                    <div className="bg-bg-tertiary rounded-xl p-8">
                      <div className="text-6xl mb-4">🏆</div>
                      <h2 className="text-2xl font-bold text-text-primary mb-2">
                        Partie terminée
                      </h2>
                      <p className="text-text-secondary">
                        Gagnant : <span className="text-neon-purple font-semibold neon-text">{game.last_click_username}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-bg-tertiary rounded-xl p-8">
                      <div className="text-6xl mb-4">😔</div>
                      <h2 className="text-2xl font-bold text-text-primary mb-2">
                        Partie terminée sans gagnant
                      </h2>
                      <p className="text-text-secondary">
                        Personne n&apos;a cliqué pendant cette partie.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Timer and click zone for active game */}
              {game.status !== 'ended' && (
                <div className="space-y-8">
                  <Timer
                    timeLeft={timeLeft}
                    isUrgent={isUrgent}
                    status={game.status}
                  />

                  <ClickZone
                    onClickAction={handleClick}
                    disabled={!canClick || isPending}
                    isPending={isPending}
                    isUrgent={isUrgent}
                    hasCredits={credits >= GAME_CONSTANTS.CREDIT_COST_PER_CLICK}
                    status={game.status}
                  />

                  {error && (
                    <div className="text-center text-danger bg-danger/10 border border-danger/30 px-4 py-3 rounded-lg animate-modal-enter">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <GameStats
          credits={credits}
          totalClicks={game.total_clicks}
          lastClickUsername={game.last_click_username}
          isConnected={isConnected}
          recentClicks={recentClicks}
        />
      </div>

      {/* Winner modal */}
      <WinnerModal
        isOpen={showWinnerModal}
        isWinner={isWinner}
        winnerUsername={game.last_click_username}
        itemName={game.item.name}
        itemValue={game.item.retail_value}
        onClose={() => setShowWinnerModal(false)}
      />
    </div>
  )
}
