'use client'

import dynamic from 'next/dynamic'

// InstallBanner (+ IOSInstallTour) tire framer-motion. Importé statiquement dans le
// layout (main), il réinjectait framer (~40 KB gz) dans le bundle de BASE de toutes
// les routes connectées. On le charge en lazy + client-only : c'est un bandeau
// d'installation PWA non critique, qui n'a pas besoin d'être rendu côté serveur.
const InstallBanner = dynamic(
  () => import('./InstallBanner').then((m) => ({ default: m.InstallBanner })),
  { ssr: false }
)

export function InstallBannerLazy() {
  return <InstallBanner />
}
