'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { CrownIcon } from '@/components/ui/GamingIcons'
import { useIsMobile } from '@/hooks/useIsMobile'

interface LeaderboardEntry {
  rank: number
  username: string
  wins: number
  totalValue: number
  avatar?: string
}

interface RealWinner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[]
  realWinners?: RealWinner[]
  title?: string
  period?: 'today' | 'week' | 'month' | 'all'
  className?: string
}

// Bot winners data - realistic winners with diverse usernames
// Different players for each period to show variety
const BOT_WINNERS_DATA = {
  today: [
    { rank: 1, username: 'Djibril_sn', wins: 2, totalValue: 2499, items: ['MacBook Pro 14"'] },
    { rank: 2, username: 'ClaraMusic', wins: 1, totalValue: 1229, items: ['iPhone 15 Pro'] },
    { rank: 3, username: 'Rayan_mtl', wins: 1, totalValue: 549, items: ['PlayStation 5'] },
    { rank: 4, username: 'MelinaParis', wins: 1, totalValue: 379, items: ['Sony WH-1000XM5'] },
    { rank: 5, username: 'Abdou_221', wins: 1, totalValue: 279, items: ['AirPods Pro 2'] },
  ],
  week: [
    { rank: 1, username: 'Yasmine_dz', wins: 5, totalValue: 4507, items: ['MacBook Pro', 'iPhone 15 Pro', 'AirPods Pro'] },
    { rank: 2, username: 'TomGamer78', wins: 4, totalValue: 3728, items: ['MacBook Pro', 'iPhone 15 Pro'] },
    { rank: 3, username: 'Fatou_ndiaye', wins: 3, totalValue: 1377, items: ['PlayStation 5', 'Steam Deck', 'AirPods Pro'] },
    { rank: 4, username: 'Alex_Lyon', wins: 2, totalValue: 1608, items: ['iPhone 15 Pro', 'Sony WH-1000XM5'] },
    { rank: 5, username: 'Ines_bzh', wins: 2, totalValue: 1048, items: ['Xbox Series X', 'Meta Quest 3'] },
  ],
  month: [
    { rank: 1, username: 'Moussa_pro', wins: 12, totalValue: 8686, items: ['MacBook Pro x2', 'iPhone 15 Pro x3'] },
    { rank: 2, username: 'JulieStyle', wins: 8, totalValue: 5957, items: ['MacBook Pro', 'Samsung Galaxy S24 x2'] },
    { rank: 3, username: 'Karim_tunis', wins: 6, totalValue: 3327, items: ['PlayStation 5 x2', 'iPhone 15 Pro'] },
    { rank: 4, username: 'LenaGaming', wins: 5, totalValue: 2987, items: ['iPhone 15 Pro', 'Sony WH-1000XM5 x2'] },
    { rank: 5, username: 'Omar_casa', wins: 4, totalValue: 1656, items: ['Nintendo Switch', 'AirPods Max x2'] },
  ],
}

// Get bot winners for leaderboard (no generation needed, direct data)
function getBotWinnersLeaderboard(period: string): LeaderboardEntry[] {
  const data = BOT_WINNERS_DATA[period as keyof typeof BOT_WINNERS_DATA] || BOT_WINNERS_DATA.month
  return data.map(({ rank, username, wins, totalValue }) => ({
    rank,
    username,
    wins,
    totalValue,
  }))
}

// Filter winners by period
function filterWinnersByPeriod(winners: RealWinner[], period: string): RealWinner[] {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      return winners // 'all' - no filter
  }

  return winners.filter(w => new Date(w.won_at) >= startDate)
}

// Convert real winners to leaderboard format (for when real DB data exists)
function convertRealWinnersToLeaderboard(winners: RealWinner[]): LeaderboardEntry[] {
  // Agreger par utilisateur
  const userStats = new Map<string, { username: string; wins: number; totalValue: number }>()

  for (const winner of winners) {
    const existing = userStats.get(winner.username)
    if (existing) {
      existing.wins += 1
      existing.totalValue += winner.item_value
    } else {
      userStats.set(winner.username, {
        username: winner.username,
        wins: 1,
        totalValue: winner.item_value,
      })
    }
  }

  // Trier par totalValue et retourner le top 5
  return Array.from(userStats.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)
    .map((stats, index) => ({
      rank: index + 1,
      username: stats.username,
      wins: stats.wins,
      totalValue: stats.totalValue,
    }))
}

export function Leaderboard({
  entries,
  realWinners,
  title = 'LES PLUS CHANCEUX',
  period: initialPeriod = 'week',
  className = '',
}: LeaderboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>(initialPeriod)
  const isMobile = useIsMobile()

  // Convert real winners to leaderboard format if available (filtered by period)
  const realLeaderboard = useMemo(() => {
    if (realWinners && realWinners.length > 0) {
      const filteredWinners = filterWinnersByPeriod(realWinners, selectedPeriod)
      if (filteredWinners.length > 0) {
        return convertRealWinnersToLeaderboard(filteredWinners)
      }
    }
    return null
  }, [realWinners, selectedPeriod])

  // Get bot winners data for the selected period
  const botWinnersData = useMemo(() => getBotWinnersLeaderboard(selectedPeriod), [selectedPeriod])

  // Use: provided entries > real winners from DB > bot winners data
  const displayedEntries = entries || realLeaderboard || botWinnersData

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [isVisible])

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return "Aujourd'hui"
      case 'week':
        return 'Cette semaine'
      case 'month':
        return 'Ce mois'
      case 'all':
        return 'Tous les temps'
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-transparent',
          border: 'border-yellow-500/30',
          hoverBorder: 'hover:border-yellow-500/60',
          badge: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          text: 'text-yellow-400',
          glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]',
          badgeGlow: '0 0 15px rgba(234, 179, 8, 0.5)',
          hex: '#EAB308',
        }
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400/20 to-transparent',
          border: 'border-gray-400/30',
          hoverBorder: 'hover:border-gray-400/60',
          badge: 'bg-gradient-to-br from-gray-300 to-gray-500',
          text: 'text-gray-300',
          glow: 'hover:shadow-[0_0_20px_rgba(156,163,175,0.3)]',
          badgeGlow: '0 0 15px rgba(156, 163, 175, 0.5)',
          hex: '#9CA3AF',
        }
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-600/20 to-transparent',
          border: 'border-amber-600/30',
          hoverBorder: 'hover:border-amber-600/60',
          badge: 'bg-gradient-to-br from-amber-500 to-amber-700',
          text: 'text-amber-500',
          glow: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]',
          badgeGlow: '0 0 15px rgba(217, 119, 6, 0.5)',
          hex: '#D97706',
        }
      default:
        return {
          bg: '',
          border: 'border-white/5',
          hoverBorder: 'hover:border-neon-purple/30',
          badge: 'bg-white/10',
          text: 'text-white/60',
          glow: 'hover:shadow-[0_0_15px_rgba(155,92,255,0.2)]',
          badgeGlow: 'none',
          hex: '#9B5CFF',
        }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-bg-secondary/50 backdrop-blur-sm rounded-xl overflow-hidden group/leaderboard ${className}`}
    >
      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover/leaderboard:border-yellow-500/30 transition-colors duration-500" />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover/leaderboard:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(234, 179, 8, 0.15), inset 0 0 40px rgba(234, 179, 8, 0.03)',
        }}
      />

      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Crown icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full" />
              <CrownIcon className="w-7 h-7 text-yellow-400 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider">{title}</h3>
              <p className="text-xs text-white/50">{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`
                  px-3 py-1.5 text-xs font-bold uppercase rounded-lg
                  transition-all duration-300 cursor-pointer
                  ${selectedPeriod === p
                    ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_15px_rgba(155,92,255,0.4)]'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10 hover:border-neon-purple/30'
                  }
                `}
              >
                {p === 'today' ? 'Jour' : p === 'week' ? 'Sem' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard entries */}
      <div key={selectedPeriod} className="relative p-4 space-y-2">
        {displayedEntries.map((entry, index) => {
          const style = getRankStyle(entry.rank)
          return (
            <div
              key={`${selectedPeriod}-${entry.rank}`}
              className={`
                leaderboard-row relative flex items-center gap-4 p-4
                ${style.bg} border ${style.border} ${style.hoverBorder}
                rounded-lg
                ${style.glow}
                ${isMobile ? '' : 'transition-all duration-300'}
                group/row
                ${isMobile ? 'opacity-100' : (isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8')}
              `}
              style={{
                transitionDelay: isMobile ? '0ms' : (isVisible ? `${index * 100}ms` : '0ms'),
              }}
            >
              {/* Rank badge with glow */}
              <div
                className={`
                  relative w-10 h-10 rounded-lg ${style.badge}
                  flex items-center justify-center
                  font-black text-lg
                  ${entry.rank <= 3 ? 'text-bg-primary' : 'text-white'}
                  transition-transform duration-300 group-hover/row:scale-110
                `}
                style={{
                  boxShadow: entry.rank <= 3 ? style.badgeGlow : 'none',
                }}
              >
                {entry.rank}
              </div>

              {/* Avatar with glow */}
              <div className="relative group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/50 to-neon-pink/50 rounded-lg blur-md opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Username & wins */}
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate group-hover/row:text-white transition-colors">{entry.username}</div>
                <div className="text-xs text-white/50">{entry.wins} victoires</div>
              </div>

              {/* Total value with glow */}
              <div className="text-right">
                <div
                  className={`font-black ${style.text} transition-all duration-300`}
                  style={{
                    textShadow: entry.rank <= 3 ? `0 0 15px ${style.hex}60` : 'none',
                  }}
                >
                  {entry.totalValue.toLocaleString()}€
                </div>
                <div className="text-xs text-white/40">total</div>
              </div>

              {/* Animated bottom border on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-lg">
                <div
                  className="h-full w-0 group-hover/row:w-full transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${style.hex}, transparent)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
