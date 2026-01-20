export default function ProfileLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Background effects - reduced on mobile */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-neon-pink/5 rounded-full blur-[120px]" />
      </div>
      <div className="lg:hidden fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[20%] right-[5%] w-40 h-40 bg-neon-pink/5 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Hero Profile Skeleton */}
        <div className="mb-6">
          <div className="relative rounded-3xl overflow-hidden bg-bg-secondary/50 border border-white/10 p-6 md:p-8">
            {/* Credits badge skeleton */}
            <div className="flex justify-end mb-4">
              <div className="w-32 h-10 rounded-2xl bg-white/5 animate-pulse" />
            </div>

            {/* Main profile content */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar skeleton */}
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white/10 animate-pulse" />

              {/* User info skeleton */}
              <div className="flex-1 text-center md:text-left">
                <div className="h-10 w-48 mx-auto md:mx-0 bg-white/10 rounded-xl animate-pulse mb-3" />
                <div className="h-6 w-32 mx-auto md:mx-0 bg-white/5 rounded-lg animate-pulse mb-3" />
                <div className="h-2 w-full max-w-xs mx-auto md:mx-0 bg-white/10 rounded-full animate-pulse mb-4" />
                <div className="h-4 w-40 mx-auto md:mx-0 bg-white/5 rounded animate-pulse mb-4" />
                <div className="h-12 w-28 mx-auto md:mx-0 bg-neon-purple/20 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse mb-3" />
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Wins Section Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 w-40 bg-white/10 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/5 border border-white/10 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white/10 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-2" />
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-2" />
                    <div className="h-6 w-16 bg-white/10 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
