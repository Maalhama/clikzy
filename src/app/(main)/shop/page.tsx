import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './ShopClient'

export const metadata: Metadata = {
  title: 'Boutique | Cleekzy',
  description: 'Achète des crédits pour jouer et gagner des produits tech premium.',
}

async function getCredits(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { data } = await supabase
    .from('profiles')
    .select('credits, earned_credits')
    .eq('id', user.id)
    .single()

  const profile = data as { credits: number; earned_credits: number } | null
  return (profile?.credits ?? 0) + (profile?.earned_credits ?? 0)
}

export default async function ShopPage() {
  const credits = await getCredits()

  return <ShopClient currentCredits={credits} />
}
