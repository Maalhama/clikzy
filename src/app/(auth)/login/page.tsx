'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithPassword, signInWithOAuth } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = new FormData()
    data.append('email', formData.email)
    data.append('password', formData.password)

    const result = await signInWithPassword(data)

    if (result.success) {
      router.push('/lobby')
    } else {
      setError(result.error || 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setIsOAuthLoading(provider)
    setError(null)

    const result = await signInWithOAuth(provider)

    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setIsOAuthLoading(null)
    }
  }

  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row relative overflow-y-auto" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
      {/* Mobile Background Effects - CSS only */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-neon-purple/15 rounded-full blur-[60px]" />
        <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-neon-pink/15 rounded-full blur-[70px]" />
      </div>

      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
        <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-neon-pink/10 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-md">
          <Logo size="lg" animated={false} href="/" />
          <h1 className="text-3xl font-bold text-white mt-6 mb-3">Content de te revoir !</h1>
          <p className="text-text-secondary text-lg mb-10">
            Connecte-toi pour acceder a tes parties et tes recompenses.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white text-sm">Tes credits t&apos;attendent</div>
                <div className="text-xs text-text-secondary">Reprends la ou tu t&apos;es arrete</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white text-sm">Parties en cours</div>
                <div className="text-xs text-text-secondary">Rejoins les parties actives</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:p-10 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo size="lg" animated={false} href="/" />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Se connecter</h2>
            <p className="text-sm text-text-secondary">
              Accede a ton compte pour jouer
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading !== null || isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium transition-all active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {isOAuthLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="text-[15px]">Continuer avec Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-bg-primary text-text-secondary text-xs">ou par email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="ton@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-medium text-text-secondary">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-xs text-neon-purple hover:text-neon-pink transition-colors">
                  Oublie ?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Ton mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="pt-1">
              <Button
                type="submit"
                variant="neon-pink"
                className="w-full py-4 text-[15px] font-semibold rounded-2xl"
                isLoading={isLoading}
              >
                Se connecter
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[15px] text-text-secondary">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-neon-purple hover:text-neon-pink transition-colors font-semibold">
                S&apos;inscrire
              </Link>
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary/60">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Connexion securisee
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
