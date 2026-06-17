'use client'

import dynamic from 'next/dynamic'

// ArenaAtmosphere est un décor d'arrière-plan animé via GSAP (~111 KB / 43 KB gzip).
// Statiquement importé dans les layouts (main) et (auth), il tirait GSAP dans le bundle
// initial de ~21 routes. On le charge en lazy + client-only (ssr:false) : le décor n'est
// pas critique et n'a pas besoin d'être rendu côté serveur.
const ArenaAtmosphere = dynamic(
  () => import('./ArenaAtmosphere').then((m) => ({ default: m.ArenaAtmosphere })),
  { ssr: false }
)

export function ArenaAtmosphereLazy({ simplified }: { simplified?: boolean }) {
  return <ArenaAtmosphere simplified={simplified} />
}
