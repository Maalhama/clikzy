'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signInWithEmail, signInWithOAuth } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/lobby'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)

    const result = await signInWithEmail(formData)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Une erreur est survenue')
    }

    setIsLoading(false)
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setIsOAuthLoading(provider)
    setError(null)

    const result = await signInWithOAuth(provider)

    if (!result.success) {
      setError(result.error || 'Une erreur est survenue')
      setIsOAuthLoading(null)
    }
  }

  if (success) {
    return (
      <div className="h-full w-full flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Verifie ta boite mail</h1>
          <p className="text-text-secondary text-sm mb-5">
            Un lien de connexion a ete envoye a <strong className="text-neon-purple">{email}</strong>
          </p>
          <p className="text-xs text-text-secondary/60 mb-5">
            Le lien expire dans 1 heure
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
            Utiliser une autre adresse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col lg:flex-row">
      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-neon-pink/10 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-md">
          <Logo size="lg" animated={false} href="/" />
          <h1 className="text-3xl font-bold text-white mt-6 mb-3">
            Le dernier clic gagne
          </h1>
          <p className="text-text-secondary text-lg mb-10">
            Rejoins des milliers de joueurs et tente ta chance pour gagner des objets incroyables.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-neon-purple mb-0.5">2K+</div>
              <div className="text-xs text-text-secondary">Joueurs actifs</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-success mb-0.5">50K€</div>
              <div className="text-xs text-text-secondary">Distribues</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-neon-pink mb-0.5">100%</div>
              <div className="text-xs text-text-secondary">Authentique</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-5 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo size="md" animated={false} href="/" />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Connexion</h2>
            <p className="text-sm text-text-secondary">
              Connecte-toi pour rejoindre une partie
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {isOAuthLoading === 'google' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continuer avec Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-bg-primary text-text-secondary text-xs">ou par email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary/50 border border-white/10 text-sm text-white placeholder-text-secondary/50 transition-all focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="neon-pink"
              className="w-full py-3 text-sm"
              isLoading={isLoading}
            >
              Recevoir un lien magique
            </Button>
          </form>

          {/* Info */}
          <p className="mt-3 text-[11px] text-text-secondary/60 text-center">
            Un lien de connexion sera envoye a ton adresse email
          </p>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-sm text-text-secondary">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-neon-purple hover:text-neon-pink transition-colors font-semibold">
                S&apos;inscrire
              </Link>
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-secondary/60">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connexion securisee SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
