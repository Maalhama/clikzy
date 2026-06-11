export default function MiniGamesLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-64 mx-auto skeleton rounded-lg  mb-4" />
          <div className="h-5 w-96 mx-auto skeleton rounded " />
        </div>

        {/* Games grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-white/5"
            >
              {/* Icon skeleton */}
              <div className="w-16 h-16 mx-auto mb-4 skeleton rounded-full " />

              {/* Title skeleton */}
              <div className="h-6 w-40 mx-auto skeleton rounded  mb-3" />

              {/* Description skeleton */}
              <div className="h-4 w-full skeleton rounded  mb-2" />
              <div className="h-4 w-3/4 mx-auto skeleton rounded  mb-6" />

              {/* Button skeleton */}
              <div className="h-12 w-full skeleton rounded-lg " />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
