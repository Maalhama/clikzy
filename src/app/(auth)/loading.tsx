export default function AuthLoading() {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-6">
      {/* Spinner */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Chargement...</p>
      </div>
    </div>
  )
}
