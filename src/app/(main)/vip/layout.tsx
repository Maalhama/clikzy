import type { Metadata } from 'next'

// La page V.I.P est un client component : ses metadata vivent dans ce layout.
export const metadata: Metadata = {
  title: 'V.I.P - Avantages exclusifs',
  description:
    '20 crédits chaque jour, -10% sur les packs, badge doré et accès aux parties V.I.P réservées. Abonnement mensuel sans engagement.',
  alternates: { canonical: '/vip' },
}

export default function VipLayout({ children }: { children: React.ReactNode }) {
  return children
}
