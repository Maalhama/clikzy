import Link from 'next/link'

/**
 * Footer minimal des pages app : ancre les pages courtes (clans, classement)
 * et expose en permanence le légal + jeu responsable (signal de confiance,
 * au même niveau visuel que le reste — pas caché).
 */
export function AppFooter() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center md:flex-row md:justify-between md:px-6 md:text-left">
        <div className="flex flex-col gap-1">
          <span className="font-display text-sm font-bold tracking-wide text-white/70">CLEEKZY</span>
          <span className="text-xs text-white/40">Le dernier clic gagne. Lots réels, livrés chez toi.</span>
        </div>

        <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <Link href="/terms" className="text-white/55 transition-colors hover:text-white">Conditions</Link>
          <Link href="/cgv" className="text-white/55 transition-colors hover:text-white">CGV</Link>
          <Link href="/privacy" className="text-white/55 transition-colors hover:text-white">Confidentialité</Link>
          <Link href="/legal" className="text-white/55 transition-colors hover:text-white">Mentions légales</Link>
          <Link href="/support" className="text-white/55 transition-colors hover:text-white">Support</Link>
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="font-display text-[0.6rem] font-bold text-white/70">18+</span>
          <span className="text-[0.65rem] text-white/45">Joue de façon responsable</span>
        </div>
      </div>
    </footer>
  )
}
