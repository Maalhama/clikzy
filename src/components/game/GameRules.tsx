// Bloc « Règles du jeu » partagé entre les layouts mobile et desktop de la page de jeu
// (contenu identique ; seul le conteneur externe diffère -> prop className). Anti-duplication.
export function GameRules({ className = '', beginnersOnly = false }: { className?: string; beginnersOnly?: boolean }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white font-display font-semibold text-xs uppercase tracking-[0.18em]">Règles du jeu</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Enchère « débutants » : réservée aux joueurs sans victoire (Lot G — confiance) */}
        {beginnersOnly && (
          <div className="flex items-start gap-3 rounded-lg bg-neon-blue/10 border border-neon-blue/25 p-2.5">
            <div className="w-7 h-7 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-3.5 0-6 2.5-6 6 0 2 1 3.5 2.5 5C10 15.5 11 17 11 19h2c0-2 1-3.5 2.5-5C17 12.5 18 11 18 9c0-3.5-2.5-6-6-6z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Enchère débutants</p>
              <p className="text-white/50 text-xs">Réservée aux joueurs sans aucune victoire — une vraie première chance face aux habitués</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Clique pour participer</p>
            <p className="text-white/50 text-xs">Chaque clic coûte 1 crédit</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Le dernier clic gagne</p>
            <p className="text-white/50 text-xs">Quand le timer atteint 0, le dernier cliqueur remporte le lot</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Phase finale</p>
            <p className="text-white/50 text-xs">Quand il reste moins d&apos;1min30, chaque clic remet le timer à 1min30</p>
          </div>
        </div>
        {/* Limites de gains « équité » : plafonds PUBLICS, identiques pour tous (Lot G — confiance) */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Limites d&apos;équité</p>
            <p className="text-white/50 text-xs">Maximum 8 gains par semaine et 12 par an sur un même produit — chacun sa chance</p>
          </div>
        </div>
      </div>
    </div>
  )
}
