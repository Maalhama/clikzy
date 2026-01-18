'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-bg-tertiary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/lobby" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-neon-purple">CLIK</span>
              <span className="text-neon-pink">ZY</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/lobby"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Lobby
            </Link>
            <Link
              href="/profile"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Profil
            </Link>
          </nav>

          {/* User section */}
          <div className="flex items-center gap-4">
            {profile && (
              <>
                {/* Credits */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg">
                  <span className="text-neon-blue font-mono font-bold">
                    {profile.credits}
                  </span>
                  <span className="text-text-secondary text-sm">crédits</span>
                </div>

                {/* Username */}
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 text-text-primary hover:text-neon-purple transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <span className="text-neon-purple font-bold text-sm">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{profile.username}</span>
                </Link>
              </>
            )}

            {/* Sign out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
