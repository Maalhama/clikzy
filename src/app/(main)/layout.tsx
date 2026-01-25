import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BackgroundEffects } from '@/components/ui/BackgroundEffects'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import type { Profile } from '@/types/database'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // Total credits = daily credits + earned credits (from mini-games/purchases)
  const totalCredits = (profile?.credits ?? 0) + (profile?.earned_credits ?? 0)

  return (
    <ClientProviders
      initialCredits={totalCredits}
      userId={user.id}
    >
      <div className="min-h-screen flex flex-col bg-bg-primary">
        {/* Mobile lightweight background */}
        <div className="md:hidden fixed inset-0 -z-10">
          <div className="mobile-grid-bg" />
          <div className="mobile-glow-spot mobile-glow-spot-1" />
          <div className="mobile-glow-spot mobile-glow-spot-2" />
        </div>

        {/* Desktop animated background */}
        <div className="hidden md:block fixed inset-0 -z-10">
          <BackgroundEffects simplified />
        </div>

        {/* Header */}
        <Header profile={profile} />

        {/* Main content */}
        <main className="flex-1 relative z-10">
          {children}
        </main>

        {/* PWA Install Banner */}
        <InstallBanner />
      </div>
    </ClientProviders>
  )
}
