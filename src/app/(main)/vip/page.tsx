import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getVIPDetails } from '@/actions/stripe'
import VIPPageClient from './VIPPageClient'

export const metadata: Metadata = {
  title: 'V.I.P — 20 crédits/jour, −10% sur les packs',
  description: "Passe V.I.P sur Cleekzy : 20 crédits offerts chaque jour, −10% sur tous les packs, lots premium et badge exclusif. 12,99€/mois, annulable à tout moment.",
  alternates: { canonical: '/vip' },
}

// Page personnelle : on résout l'auth + le statut V.I.P CÔTÉ SERVEUR (plus de
// spinner plein écran ni de fetch au montage). Le client reçoit l'état initial.
export default async function VIPPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const vipResult = await getVIPDetails()
  const initialVipDetails = vipResult.success && vipResult.data ? vipResult.data : null

  return <VIPPageClient initialVipDetails={initialVipDetails} />
}
