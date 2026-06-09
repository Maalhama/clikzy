import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CollectionClient } from '@/components/collection/CollectionClient'

export const metadata = { title: 'Collection · Cleekzy' }

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Collection</h1>
        <p className="text-sm text-white/50">Ouvre tes coffres, équipe ton personnage, deviens plus fort.</p>
      </div>
      <CollectionClient />
    </main>
  )
}
