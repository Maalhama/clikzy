'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signInWithPassword, signInWithOAuth } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const floatVariants = {
  animate: {
    y: [-5, 5, -5],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

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
      // Redirect to OAuth provider
      window.location.href = result.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setIsOAuthLoading(null)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      {/* Mobile Background Effects */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        <motion.div
          variants={floatVariants}
          animate="animate"
          className="absolute top-[10%] left-[5%] w-32 h-32 bg-neon-purple/15 rounded-full blur-[60px]"
        />
        <motion.div
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
          className="absolute bottom-[20%] right-[5%] w-40 h-40 bg-neon-pink/15 rounded-full blur-[70px]"
        />
        <motion.div
          variants={floatVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-[50%] right-[20%] w-24 h-24 bg-neon-blue/10 rounded-full blur-[50px]"
        />
      </div>

      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-neon-pink/10 rounded-full blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <Logo size="lg" animated={false} href="/" />
          <h1 className="text-3xl font-bold text-white mt-6 mb-3">
            Le dernier clic gagne
          </h1>
          <p className="text-text-secondary text-lg mb-10">
            Rejoins des milliers de joueurs et tente ta chance pour gagner des objets incroyables.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '2K+', label: 'Joueurs actifs', color: 'text-neon-purple' },
              { value: '50K€', label: 'Distribués', color: 'text-success' },
              { value: '100%', label: 'Authentique', color: 'text-neon-pink' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={`text-2xl font-bold ${stat.color} mb-0.5`}>{stat.value}</div>
                <div className="text-xs text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:p-10 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <motion.div variants={itemVariants} className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" animated={true} href="/" />
          </motion.div>

          {/* Header - Mobile optimized */}
          <motion.div variants={itemVariants} className="text-center lg:text-left mb-8">
            <h2 className="text-2xl lg:text-2xl font-bold text-white mb-2">Connexion</h2>
            <p className="text-sm text-text-secondary">
              Connecte-toi pour rejoindre une partie
            </p>
          </motion.div>

          {/* Google OAuth - Larger touch target on mobile */}
          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading !== null || isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium transition-all active:bg-white/15 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isOAuthLoading === 'google' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="text-[15px]">Continuer avec Google</span>
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-bg-primary text-text-secondary text-xs">ou par email</span>
            </div>
          </motion.div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-2">
                Email
              </label>
              <motion.div
                animate={{
                  boxShadow: focusedField === 'email'
                    ? '0 0 0 2px rgba(155, 92, 255, 0.3), 0 0 20px rgba(155, 92, 255, 0.15)'
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl"
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="ton@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-medium text-text-secondary">
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-neon-purple hover:text-neon-pink transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <motion.div
                animate={{
                  boxShadow: focusedField === 'password'
                    ? '0 0 0 2px rgba(155, 92, 255, 0.3), 0 0 20px rgba(155, 92, 255, 0.15)'
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl"
              >
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Ton mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
                />
              </motion.div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-2">
              <Button
                type="submit"
                variant="neon-pink"
                className="w-full py-4 text-[15px] font-semibold rounded-2xl"
                isLoading={isLoading}
              >
                Se connecter
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[15px] text-text-secondary">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-neon-purple hover:text-neon-pink transition-colors font-semibold"
              >
                S&apos;inscrire
              </Link>
            </p>
          </motion.div>

          {/* Security badge */}
          <motion.div variants={itemVariants} className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary/60">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connexion sécurisée SSL
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
