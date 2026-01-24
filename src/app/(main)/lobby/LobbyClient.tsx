'use client'

import { Suspense, useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LobbyHeader,
  GameFilters,
  GameCard,
  LastWinnersFeed,
  Pagination,
  PullToRefreshIndicator,
} from '@/components/lobby'
import { PaymentSuccessModal } from '@/components/lobby/PaymentSuccessModal'
import type { WinnerData } from '@/actions/winners'
import { FloatingTimer } from '@/components/landing/widgets/FloatingTimer'
import { useLobbyFilters } from '@/hooks/lobby/useLobbyFilters'
import { useLobbyRealtime } from '@/hooks/lobby/useLobbyRealtime'
import { useLobbyBotSimulation } from '@/hooks/lobby/useLobbyBotSimulation'
import { useFavorites } from '@/hooks/useFavorites'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useCreditsOptional } from '@/contexts/CreditsContext'
import type { GameWithItem } from '@/types/database'

interface LobbyClientProps {
  initialGames: GameWithItem[]
  credits: number
  wasReset: boolean
  winners: WinnerData[]
}

export function LobbyClient({
  initialGames,
  credits,
  wasReset,
  winners,
}: LobbyClientProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState<{ show: boolean; credits: number }>({ show: false, credits: 0 })

  // Favorites
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  // Credits context for refresh
  const creditsContext = useCreditsOptional()

  // Router for refresh
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle payment success from URL params
  useEffect(() => {
    const payment = searchParams.get('payment')
    const creditsParam = searchParams.get('credits')

    if (payment === 'success' && creditsParam) {
      const purchasedCredits = parseInt(creditsParam, 10)
      if (purchasedCredits > 0) {
        setPaymentSuccess({ show: true, credits: purchasedCredits })
        // Refresh credits from database
        creditsContext?.refreshCredits()
        // Clean URL params
        router.replace('/lobby', { scroll: false })
      }
    }
  }, [searchParams, router, creditsContext])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    // Refresh the page data using Next.js router
    router.refresh()
    // Small delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [router])

  // Pull to refresh hook (mobile only)
  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  })

  // Real-time updates - reads from shared cache
  const { games, updateGame, addClickNotification } = useLobbyRealtime(initialGames)

  // Bot simulation pour expérience visuelle fluide
  useLobbyBotSimulation({
    games,
    onGameUpdate: useCallback((gameId: string, updates: { total_clicks?: number; last_click_username?: string; end_time?: number }) => {
      updateGame(gameId, updates)
      if (updates.last_click_username) {
        const game = games.find(g => g.id === gameId)
        if (game?.item?.name) {
          addClickNotification(updates.last_click_username, gameId, game.item.name)
        }
      }
    }, [updateGame, addClickNotification, games]),
    enabled: true,
  })

  // Filters, sorting and pagination
  const {
    currentFilter,
    currentSort,
    setFilter,
    setSort,
    filteredGames,
    stats,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    itemsPerPage,
  } = useLobbyFilters(games, { searchQuery, favorites })

  // Sticky urgent game - stays on same game until it ends
  const stickyGameIdRef = useRef<string | null>(null)

  // Find the game to show in floating timer (sticky system)
  const urgentGame = useMemo(() => {
    const now = Date.now()

    // Get all active final phase games (< 60s remaining)
    const finalPhaseGames = games.filter(
      (g) => g.status !== 'ended' && g.end_time > now && (g.end_time - now) <= 60000
    )

    // If we have a sticky game, check if it's still valid
    if (stickyGameIdRef.current) {
      const stickyGame = finalPhaseGames.find((g) => g.id === stickyGameIdRef.current)
      if (stickyGame) {
        // Sticky game still active, keep showing it
        return stickyGame
      }
      // Sticky game ended, clear it
      stickyGameIdRef.current = null
    }

    // No sticky game or it ended, select a new one
    if (finalPhaseGames.length === 0) return null

    // Sort by enteredFinalPhaseAt descending (newest first), fallback to end_time
    const sorted = finalPhaseGames.sort((a, b) => {
      const aEntry = a.enteredFinalPhaseAt || 0
      const bEntry = b.enteredFinalPhaseAt || 0
      if (aEntry !== bEntry) return bEntry - aEntry // Newest entry first
      return a.end_time - b.end_time // Fallback: soonest end time
    })

    // Set the new sticky game
    stickyGameIdRef.current = sorted[0].id
    return sorted[0]
  }, [games])

  return (
    <>
      {/* Payment success modal */}
      {paymentSuccess.show && (
        <PaymentSuccessModal
          credits={paymentSuccess.credits}
          onClose={() => setPaymentSuccess({ show: false, credits: 0 })}
        />
      )}

      {/* Floating urgent timer */}
      <FloatingTimer
        enabled={true}
        isLoggedIn={true}
        gameId={urgentGame?.id}
        initialEndTime={urgentGame?.end_time}
        itemName={urgentGame?.item.name}
      />

      {/* Pull to refresh indicator (mobile) */}
      <div className="md:hidden">
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
        />
      </div>

      <div
        className="min-h-screen pb-20"
        {...pullHandlers}
      >
        {/* Header with stats */}
        <LobbyHeader
        credits={credits}
        activeCount={stats.activeCount}
        urgentCount={stats.urgentCount}
        endedCount={stats.endedCount}
        wasReset={wasReset}
      />

      {/* Filters */}
      <div className="px-4 md:px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <Suspense fallback={null}>
              <GameFilters
                currentFilter={currentFilter}
                currentSort={currentSort}
                onFilterChange={setFilter}
                onSortChange={setSort}
                onSearch={setSearchQuery}
                urgentCount={stats.urgentCount}
                soonCount={stats.soonCount}
                endedCount={stats.endedCount}
                favoritesCount={stats.favoritesCount}
                premiumCount={stats.highValueCount}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Games */}
            <div className="flex-1">
              {filteredGames.length > 0 ? (
                <>
                  {/* Mobile: Horizontal scroll */}
                  <div className="sm:hidden">
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                      {filteredGames.map((game, index) => (
                        <div
                          key={game.id}
                          className="flex-shrink-0 w-[85vw] max-w-[320px] snap-start"
                        >
                          <GameCard
                            game={game}
                            index={index}
                            isFavorite={isFavorite(game.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Mobile pagination info */}
                    <div className="flex justify-center items-center gap-2 mt-2 text-sm">
                      <span className="text-white/50">
                        Page {currentPage}/{totalPages}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/50">
                        {totalItems} produits
                      </span>
                    </div>
                    {/* Mobile page nav */}
                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-3">
                        <button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === 1
                              ? 'bg-white/5 text-white/30'
                              : 'bg-bg-secondary text-white border border-white/10'
                          }`}
                        >
                          Précédent
                        </button>
                        <button
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === totalPages
                              ? 'bg-white/5 text-white/30'
                              : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                          }`}
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desktop/Tablet: Grid */}
                  <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {filteredGames.map((game, index) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        index={index}
                        isFavorite={isFavorite(game.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:block">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={goToPage}
                      onNext={nextPage}
                      onPrev={prevPage}
                    />
                  </div>
                </>
              ) : (
                <EmptyState filter={currentFilter} />
              )}
            </div>

            {/* Winners sidebar - desktop only */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <LastWinnersFeed winners={winners} />
              </div>
            </div>
          </div>

          {/* Mobile winners feed */}
          <div className="lg:hidden mt-8">
            <LastWinnersFeed winners={winners} />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: 'Aucune partie en cours',
      description: 'De nouvelles parties arrivent bientôt. Reste connecté !',
    },
    favorites: {
      title: 'Aucun favori',
      description: 'Ajoute des produits en favoris en cliquant sur le coeur.',
    },
    urgent: {
      title: 'Aucune partie en phase finale',
      description: 'Reviens dans quelques instants pour saisir ta chance.',
    },
    soon: {
      title: 'Aucune partie à venir',
      description: 'Les prochaines parties seront affichées ici.',
    },
    high_value: {
      title: 'Pas de lots premium',
      description: 'Les gros lots arrivent régulièrement. Patience !',
    },
    ended: {
      title: 'Aucune partie terminée',
      description: 'Les parties terminées apparaîtront ici avec leurs gagnants.',
    },
  }

  const { title, description } = messages[filter] || messages.all

  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-neon-purple"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/50 max-w-sm mx-auto">{description}</p>
    </div>
  )
}
