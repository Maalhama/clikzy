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
import dynamic from 'next/dynamic'
import { LobbyFeatured } from '@/components/lobby/LobbyFeatured'
// Modales montées à la demande (coffres, tuto, succès paiement, calendrier) : sorties
// du bundle initial du lobby via next/dynamic (chargées à la 1re ouverture).
const LobbyChestsModal = dynamic(() => import('@/components/lobby/LobbyChestsModal').then((m) => m.LobbyChestsModal), { ssr: false })
const LobbyTour = dynamic(() => import('@/components/tutorial/LobbyTour').then((m) => m.LobbyTour), { ssr: false })
const PaymentSuccessModal = dynamic(() => import('@/components/lobby/PaymentSuccessModal').then((m) => m.PaymentSuccessModal), { ssr: false })
const RewardsCalendarModal = dynamic(() => import('@/components/progression/RewardsCalendarModal').then((m) => m.RewardsCalendarModal), { ssr: false })
import { LobbyCommentsFeed } from '@/components/comments/LobbyCommentsFeed'
import { type CommentFeedItem } from '@/actions/comments'
import { seedBotComments } from '@/lib/bots/commentGenerator'
import { LobbyGamificationBar } from '@/components/progression/LobbyGamificationBar'
import { BuyItNowLobbyBanner } from '@/components/profile/BuyItNowLobbyBanner'
import { trackPurchase } from '@/lib/analytics'
import { getCalendarMonth, type CalendarDay } from '@/actions/calendar'
import { applyReferralCode } from '@/actions/referral'
import { readPendingReferral, clearPendingReferral } from '@/lib/referralPending'
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
  comments?: CommentFeedItem[]
  chestInfo?: { count: number; bestRarity: string; dailyAvailable: boolean } | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progression?: any
  isLoggedIn?: boolean
}

export function LobbyClient({
  initialGames,
  credits,
  wasReset,
  winners,
  comments = [],
  chestInfo,
  progression,
  isLoggedIn = false,
}: LobbyClientProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [calendarData, setCalendarData] = useState<CalendarDay[] | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showChests, setShowChests] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<{ show: boolean; credits: number; kind: 'credits' | 'vip' | 'pass' }>({ show: false, credits: 0, kind: 'credits' })
  // Commentaires d'ambiance émis par les bots (client-only, éphémères)
  const [botComments, setBotComments] = useState<CommentFeedItem[]>([])

  // Favorites
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  // Credits context for refresh
  const creditsContext = useCreditsOptional()

  // Router for refresh
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle payment success from URL params (crédits, V.I.P, Passe d'Arène)
  useEffect(() => {
    const payment = searchParams.get('payment')
    const creditsParam = searchParams.get('credits')

    if (payment === 'success' && creditsParam) {
      const purchasedCredits = parseInt(creditsParam, 10)
      if (purchasedCredits > 0) {
        setPaymentSuccess({ show: true, credits: purchasedCredits, kind: 'credits' })
        creditsContext?.refreshCredits()
        trackPurchase(0, purchasedCredits) // conversion pack (montant réel suivi côté admin)
        router.replace('/lobby', { scroll: false })
      }
    } else if (searchParams.get('vip') === 'success') {
      setPaymentSuccess({ show: true, credits: 0, kind: 'vip' })
      creditsContext?.refreshCredits()
      trackPurchase(12.99, 0) // conversion VIP
      router.replace('/lobby', { scroll: false })
    } else if (searchParams.get('pass') === 'success') {
      setPaymentSuccess({ show: true, credits: 0, kind: 'pass' })
      trackPurchase(4.99, 0) // conversion Passe d'Arène
      router.replace('/lobby', { scroll: false })
    }
  }, [searchParams, router, creditsContext])

  // Filet de sécurité parrainage : applique le code ?ref= capté sur /register
  // (le flow OAuth perd les query params, le code attend en localStorage).
  useEffect(() => {
    if (!progression) return // visiteur non connecté
    const pending = readPendingReferral()
    if (!pending) return
    applyReferralCode(pending).finally(() => clearPendingReferral())
  }, [progression])

  // Calendrier des récompenses : charge les données + pop une fois/jour (Paris)
  useEffect(() => {
    if (!progression) return // visiteur non connecté
    getCalendarMonth().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setCalendarData(res.data)
        const parisDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
        const key = `cleekzy-calendar-${parisDay}`
        // Pas d'auto-pop par-dessus l'onboarding première visite
        const onboarded = typeof window !== 'undefined' && !!localStorage.getItem('cleekzy-onboarding-done')
        if (typeof window !== 'undefined' && onboarded && !localStorage.getItem(key)) {
          setShowCalendar(true)
          localStorage.setItem(key, '1')
        }
      }
    }).catch(() => {})
  }, [progression])

  const calendarClaimable = !!calendarData?.some((d) => d.claimable)

  // Ouverture du calendrier : si les données ne sont pas encore chargées
  // (réseau lent / fetch initial raté sur mobile), on les récupère à la volée
  // pour que le modal s'ouvre toujours au clic.
  const handleCalendarClick = useCallback(async () => {
    setShowCalendar(true)
    if (!calendarData) {
      const res = await getCalendarMonth()
      if (res.success && res.data) setCalendarData(res.data)
    }
  }, [calendarData])

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
    onBotComment: useCallback((c: CommentFeedItem) => {
      setBotComments((prev) => {
        // Évite les doublons visibles dans le feed : ni le même id, ni un contenu déjà présent.
        if (prev.some((p) => p.id === c.id || p.content === c.content)) return prev
        return [c, ...prev].slice(0, 20)
      })
    }, []),
    enabled: true,
  })

  // Seed initial des commentaires bots (client-only -> pas de mismatch SSR)
  useEffect(() => {
    setBotComments(seedBotComments(initialGames, 14, Date.now()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Carte « À la une » : la partie active dont la fin est la plus imminente
  // (uniquement sur le filtre par défaut, page 1, desktop)
  const featuredLobbyGame = useMemo(() => {
    if (currentFilter !== 'all' || currentPage !== 1) return null
    const now = Date.now()
    const live = filteredGames.filter(
      (g) => g.status !== 'ended' && g.status !== 'waiting' && (g.end_time ?? 0) > now
    )
    if (live.length === 0) return null
    return [...live].sort((a, b) => (a.end_time ?? 0) - (b.end_time ?? 0))[0]
  }, [filteredGames, currentFilter, currentPage])

  // Sticky urgent game - stays on same game until it ends
  const stickyGameIdRef = useRef<string | null>(null)

  // Find the game to show in floating timer (sticky system)
  const urgentGame = useMemo(() => {
    const now = Date.now()

    // Get all active final phase games (< 60s remaining)
    const finalPhaseGames = games.filter(
      (g) => g.status !== 'ended' && (g.end_time ?? 0) > now && ((g.end_time ?? 0) - now) <= 60000
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
      return (a.end_time ?? 0) - (b.end_time ?? 0) // Fallback: soonest end time
    })

    // Set the new sticky game
    stickyGameIdRef.current = sorted[0].id
    return sorted[0]
  }, [games])

  // Feed lobby : commentaires réels + bots, fusionnés/dédupliqués/triés
  const feedComments = useMemo<CommentFeedItem[]>(() => {
    const seen = new Set<string>()
    const merged = [...comments, ...botComments].filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    return merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 18)
  }, [comments, botComments])

  return (
    <>
      {/* Visite guidée auto à la 1ère arrivée sur le lobby (anon + connecté) */}
      <LobbyTour isLoggedIn={isLoggedIn} />

      {/* Modal coffres (ouverture depuis le lobby) */}
      {showChests && (
        <LobbyChestsModal onClose={() => { setShowChests(false); router.refresh() }} />
      )}

      {/* Calendrier des récompenses */}
      {showCalendar && calendarData && (
        <RewardsCalendarModal
          days={calendarData}
          onClose={() => setShowCalendar(false)}
          onClaimed={() => {
            creditsContext?.refreshCredits()
            getCalendarMonth().then((res) => { if (res.success && res.data) setCalendarData(res.data) }).catch(() => {})
          }}
        />
      )}

      {/* Payment success modal */}
      {paymentSuccess.show && (
        <PaymentSuccessModal
          credits={paymentSuccess.credits}
          kind={paymentSuccess.kind}
          onClose={() => setPaymentSuccess({ show: false, credits: 0, kind: 'credits' })}
        />
      )}

      {/* Floating urgent timer */}
      <FloatingTimer
        enabled={true}
        isLoggedIn={isLoggedIn}
        gameId={urgentGame?.id}
        initialEndTime={urgentGame?.end_time ?? undefined}
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
        {/* Fond d'arène : grille + halo + formes dérivantes (CSS pur) */}
        <div className="arena-backdrop" aria-hidden>
          <span className="arena-shape left-[8%] top-[22%] h-24 w-24 rotate-12 rounded-lg" />
          <span className="arena-shape--blue arena-shape right-[6%] top-[14%] h-16 w-16 rounded-full" />
          <span className="arena-shape--pink arena-shape left-[55%] top-[60%] h-20 w-20 rotate-45 rounded-lg" />
        </div>

        {/* Header with stats */}
        <LobbyHeader
        isLoggedIn={isLoggedIn}
        credits={credits}
        activeCount={stats.activeCount}
        urgentCount={stats.urgentCount}
        endedCount={stats.endedCount}
        wasReset={wasReset}
        chestInfo={chestInfo}
        onChestsClick={() => setShowChests(true)}
        calendarAvailable={calendarClaimable}
        onCalendarClick={handleCalendarClick}
      />

      {/* Bandeau gamification (rappel coffres/progression) — masqué si non connecté */}
      <LobbyGamificationBar initialProg={progression} initialChests={chestInfo?.count ?? 0} />

      {/* Rappel « Rachat malin » (offres en attente) — masqué si anon / 0 offre */}
      <BuyItNowLobbyBanner />

      {/* Filters */}
      <div className="px-4 md:px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div data-tour="filters" className="flex items-start gap-4">
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
            {/* Games — min-w-0 OBLIGATOIRE : sans lui, un nom d'item long dans
                la carte « À la une » élargit la colonne et décale la sidebar
                des derniers gagnants à chaque rotation. */}
            <div className="flex-1 min-w-0">
              {filteredGames.length > 0 ? (
                <>
                  {/* Mobile: Horizontal scroll, snap centré (espaces égaux G/D) */}
                  <div className="sm:hidden">
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-[10vw] scrollbar-hide snap-x snap-mandatory">
                      {filteredGames.map((game, index) => (
                        <div
                          key={game.id}
                          className="flex-shrink-0 w-[80vw] snap-center"
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
                      <span className="text-white/50">•</span>
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
                              ? 'bg-white/5 text-white/50'
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
                              ? 'bg-white/5 text-white/50'
                              : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                          }`}
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desktop: carte « À la une » (partie la plus imminente) */}
                  {featuredLobbyGame && (
                    <div data-tour="games" className="hidden sm:block mb-6">
                      <LobbyFeatured game={featuredLobbyGame} />
                    </div>
                  )}

                  {/* Desktop/Tablet: Grid */}
                  {/* Grille bento : tuile large en tête (et une 2e en milieu
                      de page) pour casser l'uniformité — grid-flow-dense comble
                      les trous avec les cartes suivantes. */}
                  <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 grid-flow-dense gap-4 md:gap-6">
                    {filteredGames
                      .filter((game) => game.id !== featuredLobbyGame?.id)
                      .map((game, index, arr) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        index={index}
                        isFavorite={isFavorite(game.id)}
                        onToggleFavorite={toggleFavorite}
                        wide={index === 0 || (index === 5 && arr.length >= 8)}
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

            {/* Winners sidebar + commentaires - desktop only */}
            <div className="hidden lg:block w-80 flex-shrink-0 space-y-4">
              <div data-tour="winners" className="sticky top-24">
                <LastWinnersFeed winners={winners} />
              </div>
              <LobbyCommentsFeed comments={feedComments} />
            </div>
          </div>

          {/* Mobile winners feed + commentaires */}
          <div className="lg:hidden mt-8 space-y-6">
            <LastWinnersFeed winners={winners} />
            <LobbyCommentsFeed comments={feedComments} />
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
    <div className="panel text-center py-20 px-6">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center shadow-[0_0_30px_rgba(155,92,255,0.15)]">
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
