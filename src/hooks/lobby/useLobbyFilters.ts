'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { GameWithItem } from '@/types/database'
import type { GameWithFinalPhaseTracking } from '@/hooks/lobby/useLobbyRealtime'
import { calculateTimeLeft } from '@/lib/utils/timer'
import { FINAL_PHASE_THRESHOLD } from '@/lib/utils/constants'
import { SOON_THRESHOLD } from '@/lib/constants/rotation'

export type FilterType = 'all' | 'urgent' | 'soon' | 'high_value' | 'ended' | 'favorites'
export type SortType = 'ending_soon' | 'newest' | 'most_clicks' | 'highest_value'

interface UseLobbyFiltersOptions {
  searchQuery?: string
  favorites?: string[]
}

interface FilterOption {
  value: FilterType
  label: string
}

interface SortOption {
  value: SortType
  label: string
}

export const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'favorites', label: 'Favoris' },
  { value: 'urgent', label: 'Phase finale' },
  { value: 'soon', label: 'Bientôt' },
  { value: 'high_value', label: 'Premium' },
  { value: 'ended', label: 'Terminés' },
]

export const SORT_OPTIONS: SortOption[] = [
  { value: 'ending_soon', label: 'Fin imminente' },
  { value: 'newest', label: 'Plus recentes' },
  { value: 'most_clicks', label: 'Plus de clics' },
  { value: 'highest_value', label: 'Valeur max' },
]

const HIGH_VALUE_THRESHOLD = 1000 // €
const ITEMS_PER_PAGE = 9

export function useLobbyFilters(games: GameWithFinalPhaseTracking[], options: UseLobbyFiltersOptions = {}) {
  const { searchQuery = '', favorites = [] } = options
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [currentPage, setCurrentPage] = useState(1)

  const currentFilter = (searchParams.get('filter') as FilterType) || 'all'
  const currentSort = (searchParams.get('sort') as SortType) || 'ending_soon'

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const setFilter = useCallback(
    (filter: FilterType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (filter === 'all') {
        params.delete('filter')
      } else {
        params.set('filter', filter)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      setCurrentPage(1) // Reset to page 1 when filter changes
    },
    [searchParams, router, pathname]
  )

  const setSort = useCallback(
    (sort: SortType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (sort === 'ending_soon') {
        params.delete('sort')
      } else {
        params.set('sort', sort)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      setCurrentPage(1) // Reset to page 1 when sort changes
    },
    [searchParams, router, pathname]
  )

  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...games]

    // Capture time ONCE at start of memo for stable sorting
    // This prevents cards from jumping during the render cycle
    const sortTime = Date.now()

    // Apply search filter first (if any)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((game) => {
        const itemName = game.item?.name?.toLowerCase() || ''
        const itemDescription = game.item?.description?.toLowerCase() || ''
        return itemName.includes(query) || itemDescription.includes(query)
      })
    }

    // Apply filter
    switch (currentFilter) {
      case 'all':
        // "Toutes" = only active games (NOT waiting, NOT ended)
        filtered = filtered.filter((game) => {
          return game.status !== 'waiting' && game.status !== 'ended' && game.end_time > sortTime
        })
        break
      case 'favorites':
        filtered = filtered.filter((game) => favorites.includes(game.id) && game.status !== 'waiting')
        break
      case 'urgent':
        filtered = filtered.filter((game) => {
          if (game.status === 'waiting') return false
          const timeLeft = game.end_time ? game.end_time - sortTime : 0
          return timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
        })
        break
      case 'soon':
        // Games waiting to go live (status = 'waiting' AND within 15min of start_time)
        filtered = filtered.filter((game) => {
          if (game.status !== 'waiting') return false
          // If no start_time, show all waiting games
          if (!('start_time' in game) || !game.start_time) return true
          // Check if within 15 minutes of start_time
          const startTime = new Date(game.start_time).getTime()
          const timeUntilStart = startTime - sortTime
          return timeUntilStart > 0 && timeUntilStart <= SOON_THRESHOLD
        })
        break
      case 'high_value':
        filtered = filtered.filter(
          (game) => game.status !== 'waiting' && (game.item?.retail_value ?? 0) >= HIGH_VALUE_THRESHOLD
        )
        break
      case 'ended':
        filtered = filtered.filter((game) => {
          return game.status === 'ended' || game.end_time <= sortTime
        })
        break
    }

    // Helper: check if game is ended for SORTING purposes
    // Uses captured sortTime for stability - a game is "ended" if:
    // 1. DB status is 'ended', OR
    // 2. Timer has expired (end_time <= sortTime)
    const isGameEndedForSort = (game: GameWithFinalPhaseTracking) => {
      return game.status === 'ended' || game.end_time <= sortTime
    }

    // Helper: check if game is in final phase (< 60s remaining)
    const isInFinalPhase = (game: GameWithFinalPhaseTracking) => {
      const timeLeft = game.end_time - sortTime
      return timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
    }

    // Apply sort - in ALL cases, ended games go to the END
    // NEW: Final phase games are prioritized, with newer ones (more time left) first
    switch (currentSort) {
      case 'ending_soon':
        filtered.sort((a, b) => {
          const aEnded = isGameEndedForSort(a)
          const bEnded = isGameEndedForSort(b)

          // Ended games ALWAYS go to the end
          if (aEnded && !bEnded) return 1
          if (!aEnded && bEnded) return -1

          // Both ended: sort by end_time descending (most recently ended first)
          if (aEnded && bEnded) {
            return b.end_time - a.end_time
          }

          // Check if in final phase
          const aFinal = isInFinalPhase(a)
          const bFinal = isInFinalPhase(b)

          // Final phase games come FIRST
          if (aFinal && !bFinal) return -1
          if (!aFinal && bFinal) return 1

          // Both in final phase: prioritize by ENTRY TIME (most recently entered first)
          // This keeps cards stable - they don't jump when timers reset from clicks
          if (aFinal && bFinal) {
            const aEntry = a.enteredFinalPhaseAt || 0
            const bEntry = b.enteredFinalPhaseAt || 0
            // Most recent entry first (higher timestamp = more recent = shown first)
            return bEntry - aEntry
          }

          // Both NOT in final phase: sort by end_time ascending (soonest first)
          return a.end_time - b.end_time
        })
        break
      case 'newest':
        filtered.sort((a, b) => {
          const aEnded = isGameEndedForSort(a)
          const bEnded = isGameEndedForSort(b)

          // Ended games ALWAYS go to the end in "all" filter
          if (currentFilter === 'all') {
            if (aEnded && !bEnded) return 1
            if (!aEnded && bEnded) return -1
          }

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
      case 'most_clicks':
        filtered.sort((a, b) => {
          const aEnded = isGameEndedForSort(a)
          const bEnded = isGameEndedForSort(b)

          // Ended games ALWAYS go to the end in "all" filter
          if (currentFilter === 'all') {
            if (aEnded && !bEnded) return 1
            if (!aEnded && bEnded) return -1
          }

          return b.total_clicks - a.total_clicks
        })
        break
      case 'highest_value':
        filtered = filtered.sort((a, b) => {
          const aEnded = isGameEndedForSort(a)
          const bEnded = isGameEndedForSort(b)

          // Ended games ALWAYS go to the end in "all" filter
          if (currentFilter === 'all') {
            if (aEnded && !bEnded) return 1
            if (!aEnded && bEnded) return -1
          }

          return (b.item?.retail_value ?? 0) - (a.item?.retail_value ?? 0)
        })
        break
    }

    return filtered
  }, [games, currentFilter, currentSort, searchQuery, favorites])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedGames.length / ITEMS_PER_PAGE)
  const paginatedGames = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedGames.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedGames, currentPage])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  // Stats for header
  const stats = useMemo(() => {
    const now = Date.now()

    // Active = timer > 1 minute (NOT in final phase, NOT ended, NOT waiting)
    const activeCount = games.filter((g) => {
      if (g.status === 'ended' || g.status === 'waiting') return false
      const timeLeft = g.end_time ? g.end_time - now : 0
      // Only count if timer > 1 minute (60000ms)
      return timeLeft > FINAL_PHASE_THRESHOLD
    }).length

    // Urgent = in final phase (< 60s remaining, but still active)
    const urgentCount = games.filter((g) => {
      if (g.status === 'ended' || g.status === 'waiting') return false
      const timeLeft = g.end_time ? calculateTimeLeft(g.end_time) : 0
      return timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
    }).length

    // Soon = waiting to go live (status = 'waiting' AND within 15min of start_time)
    const soonCount = games.filter((g) => {
      if (g.status !== 'waiting') return false
      if (!('start_time' in g) || !g.start_time) return true
      const startTime = new Date(g.start_time).getTime()
      const timeUntilStart = startTime - now
      return timeUntilStart > 0 && timeUntilStart <= SOON_THRESHOLD
    }).length

    const highValueCount = games.filter(
      (g) => (g.item?.retail_value ?? 0) >= HIGH_VALUE_THRESHOLD
    ).length

    // Ended = timer expired OR status is ended
    const endedCount = games.filter((g) => {
      const timeLeft = g.end_time ? g.end_time - now : 0
      return g.status === 'ended' || timeLeft <= 0
    }).length

    // Favorites count
    const favoritesCount = games.filter((g) => favorites.includes(g.id)).length

    return { activeCount, urgentCount, soonCount, highValueCount, endedCount, favoritesCount }
  }, [games, favorites])

  return {
    currentFilter,
    currentSort,
    setFilter,
    setSort,
    filteredGames: paginatedGames,
    allFilteredGames: filteredAndSortedGames,
    stats,
    // Pagination
    currentPage,
    totalPages,
    totalItems: filteredAndSortedGames.length,
    goToPage,
    nextPage,
    prevPage,
    itemsPerPage: ITEMS_PER_PAGE,
  }
}
