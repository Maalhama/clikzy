import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { ShopClient } from './ShopClient'

export const metadata: Metadata = {
  title: 'Boutique - Crédits, Passe d\'Arène et V.I.P',
  description: 'Achète des crédits pour jouer, débloque le Passe d\'Arène ou passe V.I.P. Paiement sécurisé Stripe, crédits instantanés.',
  alternates: { canonical: '/shop' },
}

async function getCredits(): Promise<number> {
  const user = await getCurrentUser()

  if (!user) return 0

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('credits, earned_credits')
    .eq('id', user.id)
    .single()

  const profile = data as { credits: number; earned_credits: number } | null
  return (profile?.credits ?? 0) + (profile?.earned_credits ?? 0)
}

export default async function ShopPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const credits = await getCredits()

  return <ShopClient currentCredits={credits} />
}
