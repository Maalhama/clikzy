'use client'

import { memo, useState, useCallback } from 'react'
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  type FilterType,
  type SortType,
} from '@/hooks/lobby/useLobbyFilters'

interface GameFiltersProps {
  currentFilter: FilterType
  currentSort: SortType
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: SortType) => void
  onSearch?: (query: string) => void
  urgentCount?: number
  soonCount?: number
  endedCount?: number
  favoritesCount?: number
}

// SVG Icons pour les filtres
const FilterIcons: Record<FilterType, React.ReactNode> = {
  all: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  favorites: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  urgent: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  soon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  high_value: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ended: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export const GameFilters = memo(function GameFilters({
  currentFilter,
  currentSort,
  onFilterChange,
  onSortChange,
  onSearch,
  urgentCount = 0,
  soonCount = 0,
  endedCount = 0,
  favoritesCount = 0,
}: GameFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }, [onSearch])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    onSearch?.('')
  }, [onSearch])
  return (
    <div className="flex-1">
      {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Filter grid - 3 columns on mobile */}
          <div className="grid grid-cols-3 gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = currentFilter === option.value
              const showUrgentBadge = option.value === 'urgent' && urgentCount > 0
              const showSoonBadge = option.value === 'soon' && soonCount > 0
              const showEndedBadge = option.value === 'ended' && endedCount > 0
              const showFavoritesBadge = option.value === 'favorites' && favoritesCount > 0
              const isUrgentFilter = option.value === 'urgent'
              const isSoonFilter = option.value === 'soon'
              const isEndedFilter = option.value === 'ended'
              const isFavoritesFilter = option.value === 'favorites'

              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`
                    relative flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold
                    transition-all duration-300 min-h-[70px]
                    ${
                      isActive
                        ? isUrgentFilter
                          ? 'bg-danger text-white border-2 border-danger'
                          : isSoonFilter
                          ? 'bg-amber-500 text-white border-2 border-amber-500'
                          : isEndedFilter
                          ? 'bg-success text-white border-2 border-success'
                          : isFavoritesFilter
                          ? 'bg-neon-pink text-white border-2 border-neon-pink'
                          : 'bg-gradient-to-br from-neon-purple to-neon-pink text-white border-2 border-neon-purple/50'
                        : 'bg-bg-secondary/80 text-white/70 border border-white/10 active:scale-95'
                    }
                  `}
                  style={
                    isActive
                      ? {
                          boxShadow: isUrgentFilter
                            ? '0 0 15px rgba(255, 68, 68, 0.4)'
                            : isSoonFilter
                            ? '0 0 15px rgba(245, 158, 11, 0.4)'
                            : isEndedFilter
                            ? '0 0 15px rgba(34, 197, 94, 0.4)'
                            : isFavoritesFilter
                            ? '0 0 15px rgba(255, 79, 216, 0.4)'
                            : '0 0 15px rgba(155, 92, 255, 0.4)',
                        }
                      : undefined
                  }
                >
                  <span className={isActive ? 'scale-110' : ''}>{FilterIcons[option.value]}</span>
                  <span className="leading-tight">{option.label}</span>
                  {showUrgentBadge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/30' : 'bg-danger text-white'}`}>
                      {urgentCount}
                    </span>
                  )}
                  {showSoonBadge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/30' : 'bg-amber-500 text-white'}`}>
                      {soonCount}
                    </span>
                  )}
                  {showEndedBadge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/30' : 'bg-success text-white'}`}>
                      {endedCount}
                    </span>
                  )}
                  {showFavoritesBadge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/30' : 'bg-neon-pink text-white'}`}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + Sort row - mobile */}
          <div className="flex items-center gap-2 bg-bg-secondary/50 rounded-xl p-2 border border-white/5">
            {/* Search input or button */}
            {isSearchExpanded ? (
              <div className="flex items-center gap-2 flex-1 bg-bg-tertiary rounded-lg px-2">
                <svg className="w-4 h-4 text-neon-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Rechercher..."
                  className="flex-1 py-1.5 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={handleClearSearch} className="text-white/40 hover:text-white p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button onClick={() => setIsSearchExpanded(false)} className="text-white/40 hover:text-white p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <div className="h-5 w-px bg-white/10" />
                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <select
                  value={currentSort}
                  onChange={(e) => onSortChange(e.target.value as SortType)}
                  className="
                    flex-1 px-2 py-1.5 rounded-lg text-sm font-medium
                    bg-bg-tertiary text-white border-none
                    focus:outline-none focus:ring-1 focus:ring-neon-purple/50
                    transition-all cursor-pointer
                  "
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-bg-secondary text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = currentFilter === option.value
              const showUrgentBadge = option.value === 'urgent' && urgentCount > 0
              const showSoonBadge = option.value === 'soon' && soonCount > 0
              const showEndedBadge = option.value === 'ended' && endedCount > 0
              const showFavoritesBadge = option.value === 'favorites' && favoritesCount > 0
              const isUrgentFilter = option.value === 'urgent'
              const isSoonFilter = option.value === 'soon'
              const isEndedFilter = option.value === 'ended'
              const isFavoritesFilter = option.value === 'favorites'

              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    whitespace-nowrap transition-all duration-300
                    ${
                      isActive
                        ? isUrgentFilter
                          ? 'bg-danger text-white border border-danger'
                          : isSoonFilter
                          ? 'bg-amber-500 text-white border border-amber-500'
                          : isEndedFilter
                          ? 'bg-success text-white border border-success'
                          : isFavoritesFilter
                          ? 'bg-neon-pink text-white border border-neon-pink'
                          : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white border border-neon-purple/50'
                        : 'bg-bg-secondary/80 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                    }
                  `}
                  style={
                    isActive && isUrgentFilter
                      ? { boxShadow: '0 0 20px rgba(255, 68, 68, 0.4), 0 0 40px rgba(255, 68, 68, 0.2)' }
                      : isActive && isSoonFilter
                      ? { boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2)' }
                      : isActive && isEndedFilter
                      ? { boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)' }
                      : isActive && isFavoritesFilter
                      ? { boxShadow: '0 0 20px rgba(255, 79, 216, 0.4), 0 0 40px rgba(255, 79, 216, 0.2)' }
                      : isActive
                      ? { boxShadow: '0 0 20px rgba(155, 92, 255, 0.4), 0 0 40px rgba(155, 92, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }
                      : undefined
                  }
                >
                  {FilterIcons[option.value]}
                  <span>{option.label}</span>
                  {showUrgentBadge && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20' : 'bg-danger text-white'}`}>
                      {urgentCount}
                    </span>
                  )}
                  {showSoonBadge && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20' : 'bg-amber-500 text-white'}`}>
                      {soonCount}
                    </span>
                  )}
                  {showEndedBadge && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20' : 'bg-success text-white'}`}>
                      {endedCount}
                    </span>
                  )}
                  {showFavoritesBadge && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20' : 'bg-neon-pink text-white'}`}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex items-center">
              {isSearchExpanded ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary/80 border border-neon-purple/30 min-w-[200px]"
                  style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.2)' }}
                >
                  <svg className="w-4 h-4 text-neon-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none min-w-[120px]"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={handleClearSearch} className="text-white/40 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button onClick={() => setIsSearchExpanded(false)} className="text-white/40 hover:text-white ml-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary/50 border border-white/10 hover:border-neon-purple/30 transition-colors"
                >
                  <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-white/50 text-sm">Rechercher</span>
                </button>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-white/10" />

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <select
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value as SortType)}
                className="
                  px-3 py-2 rounded-xl text-sm font-medium
                  bg-bg-secondary/80 text-white border border-white/10
                  hover:border-neon-purple/50 focus:border-neon-purple/50
                  focus:outline-none focus:ring-2 focus:ring-neon-purple/20
                  transition-all cursor-pointer
                "
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-bg-secondary text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
    </div>
  )
})
