import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ArenaAtmosphere } from '@/components/ui/ArenaAtmosphere'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { AppFooter } from '@/components/layout/AppFooter'
import { CosmeticsProvider } from '@/components/cosmetics/CosmeticsProvider'
import type { Profile } from '@/types/database'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Auth OPTIONNELLE : le lobby et les pages de jeu sont consultables sans compte
  // (rétention). Les pages personnelles (profil, collection, vip, mini-jeux, shop)
  // se protègent elles-mêmes via leur propre redirect.
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  let totalCredits = 0
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData as Profile | null
    totalCredits = (profile?.credits ?? 0) + (profile?.earned_credits ?? 0)
  }

  return (
    <ClientProviders
      initialCredits={totalCredits}
      userId={user?.id ?? null}
    >
      <div className="min-h-screen flex flex-col bg-bg-primary">
        {/* Atmosphère aurora commune (CSS pur, aucun coût JS) */}
        <div className="arcade-atmosphere -z-10" aria-hidden="true" />

        {/* Mobile lightweight background */}
        <div className="md:hidden fixed inset-0 -z-10">
          <div className="mobile-glow-spot mobile-glow-spot-1" />
          <div className="mobile-glow-spot mobile-glow-spot-2" />
        </div>

        {/* Desktop animated background */}
        <div className="hidden md:block fixed inset-0 -z-10">
          <ArenaAtmosphere simplified />
        </div>

        {/* Header */}
        <Header profile={profile} />

        {/* PWA : bandeau d'installation fermable, juste sous le header */}
        <InstallBanner />

        {/* Main content */}
        <main className="flex-1 relative z-10">
          {children}
        </main>

        {/* Footer minimal : légal + jeu responsable, ancre les pages courtes */}
        <AppFooter />

        {/* Cosmétiques globaux : curseur + traînée de clic */}
        {profile && (
          <CosmeticsProvider
            cursor={(profile as { cosmetic_cursor?: string }).cosmetic_cursor ?? 'cursor_default'}
            trail={(profile as { cosmetic_trail?: string }).cosmetic_trail ?? 'trail_none'}
          />
        )}

      </div>
    </ClientProviders>
  )
}
