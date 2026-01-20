import { GameCardSkeleton } from '@/components/lobby'

export default function LobbyLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <div className="py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 bg-white/10 rounded-lg w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded-lg w-64 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-white/10 rounded-xl w-24 animate-pulse" />
              <div className="h-10 bg-white/10 rounded-xl w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="px-4 md:px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-white/10 rounded-full w-24 flex-shrink-0 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Games grid skeleton */}
      <div className="px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <GameCardSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  )
}
