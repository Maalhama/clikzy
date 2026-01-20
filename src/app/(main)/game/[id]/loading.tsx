export default function GameLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Game area */}
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          {/* Timer skeleton */}
          <div className="mb-6">
            <div className="h-16 w-40 bg-white/10 rounded-2xl animate-pulse" />
          </div>

          {/* Product image skeleton */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-white/5 border border-white/10 animate-pulse mb-6" />

          {/* Product info skeleton */}
          <div className="text-center mb-6">
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
            <div className="h-6 w-24 bg-white/5 rounded-lg animate-pulse mx-auto" />
          </div>

          {/* Click button skeleton */}
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-neon-purple/20 animate-pulse" />
        </div>

        {/* Sidebar skeleton (desktop) */}
        <div className="hidden lg:block w-80 border-l border-white/10 p-4">
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
