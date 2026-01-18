import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { Profile, Winner, Item } from '@/types/database'

type WinnerWithItem = Winner & {
  item: Item
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // Get user's recent wins
  const { data: winsData } = await supabase
    .from('winners')
    .select('*, item:items(*)')
    .eq('user_id', user.id)
    .order('won_at', { ascending: false })
    .limit(5)

  const wins = winsData as WinnerWithItem[] | null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="mb-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-neon-purple/20 flex items-center justify-center border-2 border-neon-purple">
            <span className="text-4xl font-bold text-neon-purple">
              {profile?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              {profile?.username || 'Joueur'}
            </h1>
            <p className="text-text-secondary">
              Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Crédits"
          value={profile?.credits ?? 0}
          icon="💰"
          color="text-neon-blue"
        />
        <StatCard
          label="Victoires"
          value={profile?.total_wins ?? 0}
          icon="🏆"
          color="text-success"
        />
        <StatCard
          label="Clics totaux"
          value={profile?.total_clicks ?? 0}
          icon="👆"
          color="text-neon-purple"
        />
      </div>

      {/* Recent wins */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières victoires</CardTitle>
          <CardDescription>
            Les objets que tu as remportés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wins && wins.length > 0 ? (
            <div className="space-y-4">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg"
                >
                  <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">
                      {win.item_name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Gagné le {new Date(win.won_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {win.item_value && (
                    <div className="text-success font-bold">
                      {win.item_value.toFixed(0)}€
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-text-secondary">
                Tu n&apos;as pas encore gagné de partie. Continue de jouer !
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{icon}</div>
          <div>
            <div className={`text-2xl font-bold ${color}`}>
              {value.toLocaleString()}
            </div>
            <div className="text-sm text-text-secondary">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
