import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { CollectionClient } from '@/components/collection/CollectionClient'

export const metadata = {
  title: 'Ma Collection',
  description: 'Ouvre tes coffres, équipe ton personnage et active tes bonus : casque, armure, anneau et artefact.',
}

export default async function CollectionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 reveal reveal-1">
        <span className="kicker mb-2">Progression</span>
        <h1 className="title-giant text-4xl text-white md:text-5xl">Collection</h1>
        <p className="text-sm text-white/50">Ouvre tes coffres, équipe ton personnage, deviens plus fort.</p>
      </div>
      <CollectionClient />
    </main>
  )
}
