export default function GameLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton " />
            <div className="h-6 w-32 skeleton rounded-lg " />
          </div>
          <div className="h-10 w-28 skeleton rounded-xl " />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Game area */}
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          {/* Timer skeleton */}
          <div className="mb-6">
            <div className="h-16 w-40 skeleton rounded-2xl " />
          </div>

          {/* Product image skeleton */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl skeleton border border-white/10  mb-6" />

          {/* Product info skeleton */}
          <div className="text-center mb-6">
            <div className="h-8 w-48 skeleton rounded-lg  mx-auto mb-2" />
            <div className="h-6 w-24 skeleton rounded-lg  mx-auto" />
          </div>

          {/* Click button skeleton */}
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-neon-purple/20 animate-pulse" />
        </div>

        {/* Sidebar skeleton (desktop) */}
        <div className="hidden lg:block w-80 border-l border-white/10 p-4">
          <div className="h-6 w-32 skeleton rounded-lg  mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full skeleton " />
                <div className="flex-1">
                  <div className="h-4 w-24 skeleton rounded  mb-1" />
                  <div className="h-3 w-16 skeleton rounded " />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
