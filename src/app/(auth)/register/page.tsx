'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp, signInWithOAuth } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    data.append('username', formData.username)

    const result = await signUp(data)

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
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-5xl mb-4">🎉</div>
            <CardTitle>Compte créé !</CardTitle>
            <CardDescription>
              Un email de confirmation a été envoyé à <strong className="text-neon-purple">{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary text-sm">
              Clique sur le lien dans l&apos;email pour activer ton compte et commencer à jouer.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login">
              <Button variant="outline">
                Retour à la connexion
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary -z-10" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl font-bold">
              <span className="text-neon-purple">CLIK</span>
              <span className="text-neon-pink">ZY</span>
            </span>
          </Link>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Inscris-toi et reçois <span className="text-success font-semibold">10 crédits gratuits</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('google')}
              isLoading={isOAuthLoading === 'google'}
              disabled={isOAuthLoading !== null}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('github')}
              isLoading={isOAuthLoading === 'github'}
              disabled={isOAuthLoading !== null}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continuer avec GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-bg-tertiary" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-secondary text-text-secondary">ou</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="username"
              label="Pseudo"
              placeholder="ton_pseudo"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
            />

            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="ton@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              name="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              minLength={6}
            />

            {error && (
              <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Créer mon compte
            </Button>
          </form>

          <p className="text-xs text-text-secondary text-center">
            En créant un compte, tu acceptes nos conditions d&apos;utilisation.
          </p>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-text-secondary">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-neon-purple hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
