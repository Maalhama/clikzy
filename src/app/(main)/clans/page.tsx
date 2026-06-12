import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClansClient } from '@/components/clans/ClansClient'

export const metadata = {
  title: 'Clans',
  description: 'Crée ton clan ou rejoins-en un : le total d\'XP de ses membres le fait grimper au classement collectif.',
}

export default async function ClansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 reveal reveal-1">
        <span className="kicker mb-2">Communauté</span>
        <h1 className="title-giant text-4xl text-white md:text-5xl">Clans</h1>
        <p className="text-sm text-white/55">Rejoins une équipe, cumulez vos XP et grimpez ensemble au classement.</p>
      </div>
      <ClansClient />
    </main>
  )
}
