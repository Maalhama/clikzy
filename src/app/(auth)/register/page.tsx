'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { signUp, signInWithOAuth } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

// Check if mobile for disabling animations
const getAnimationVariants = (isMobile: boolean) => {
  if (isMobile) {
    return {
      container: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
      item: { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } },
      float: { animate: {} },
      success: { hidden: { opacity: 1, scale: 1 }, visible: { opacity: 1, scale: 1 } },
    }
  }
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
      },
    },
    float: {
      animate: {
        y: [-5, 5, -5],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
      },
    },
    success: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
      },
    },
  }
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0

  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Faible', color: 'bg-danger' }
  if (score <= 2) return { score, label: 'Moyen', color: 'bg-warning' }
  if (score <= 3) return { score, label: 'Bon', color: 'bg-neon-blue' }
  return { score, label: 'Excellent', color: 'bg-success' }
}

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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Always disable animations on mobile for instant display
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const variants = getAnimationVariants(isMobile)

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

    if (result.success && result.url) {
      // Redirect to OAuth provider
      window.location.href = result.url
    } else {
      setError(result.error || 'Une erreur est survenue')
      setIsOAuthLoading(null)
    }
  }

  // Success state with animation
  if (success) {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-[20%] left-[10%] w-40 h-40 bg-success/20 rounded-full blur-[80px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-[30%] right-[10%] w-32 h-32 bg-neon-blue/15 rounded-full blur-[60px]"
          />
        </div>

        <motion.div
          variants={variants.success}
          initial="hidden"
          animate="visible"
          className="text-center max-w-sm relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative w-24 h-24 mx-auto mb-6"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-success/30 to-neon-blue/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-bg-secondary flex items-center justify-center">
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-10 h-10 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </motion.svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-3"
          >
            Compte créé !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary mb-6"
          >
            Un email de confirmation a été envoyé à{' '}
            <strong className="text-neon-purple block mt-1">{formData.email}</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/login">
              <Button variant="neon-pink" className="px-8 py-3 rounded-2xl">
                Se connecter
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row relative overflow-y-auto" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
      {/* Mobile Background Effects */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        <motion.div
          variants={variants.float}
          animate="animate"
          className="absolute top-[5%] right-[10%] w-32 h-32 bg-neon-purple/15 rounded-full blur-[60px]"
        />
        <motion.div
          variants={variants.float}
          animate="animate"
          style={{ animationDelay: '1s' }}
          className="absolute bottom-[15%] left-[5%] w-40 h-40 bg-neon-pink/15 rounded-full blur-[70px]"
        />
        <motion.div
          variants={variants.float}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-[40%] left-[20%] w-24 h-24 bg-success/10 rounded-full blur-[50px]"
        />
      </div>

      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-neon-pink/10 rounded-full blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <Logo size="lg" animated={false} href="/" />
          <h1 className="text-3xl font-bold text-white mt-6 mb-3">
            Rejoins l&apos;aventure
          </h1>
          <p className="text-text-secondary text-lg mb-10">
            Crée ton compte et reçois 10 crédits gratuits pour commencer à jouer.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '10 crédits offerts',
                desc: "A l'inscription, sans engagement",
                color: 'success',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Parties en temps réel',
                desc: 'Affronte des joueurs du monde entier',
                color: 'neon-purple',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: '100% authentique',
                desc: 'Tous les objets sont vérifiés',
                color: 'neon-pink',
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg bg-${benefit.color}/10 border border-${benefit.color}/20 flex items-center justify-center flex-shrink-0`}>
                  {benefit.icon}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{benefit.title}</div>
                  <div className="text-xs text-text-secondary">{benefit.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:p-10 relative z-10">
        <motion.div
          variants={variants.container}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <motion.div variants={variants.item} className="lg:hidden flex justify-center mb-6">
            <Logo size="lg" animated={true} href="/" />
          </motion.div>

          {/* Header - Mobile optimized */}
          <motion.div variants={variants.item} className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Créer un compte</h2>
            <p className="text-sm text-text-secondary">
              Inscris-toi et reçois{' '}
              <span className="inline-flex items-center gap-1 text-success font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                10 crédits gratuits
              </span>
            </p>
          </motion.div>

          {/* Google OAuth - Larger touch target on mobile */}
          <motion.button
            variants={variants.item}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading !== null || isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium transition-all active:bg-white/15 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
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
          <motion.div variants={variants.item} className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-bg-primary text-text-secondary text-xs">ou par email</span>
            </div>
          </motion.div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <motion.div variants={variants.item}>
              <label htmlFor="username" className="block text-xs font-medium text-text-secondary mb-2">
                Pseudo
              </label>
              <motion.div
                animate={{
                  boxShadow: focusedField === 'username'
                    ? '0 0 0 2px rgba(155, 92, 255, 0.3), 0 0 20px rgba(155, 92, 255, 0.15)'
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl"
              >
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="ton_pseudo"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                  className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={variants.item}>
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

            <motion.div variants={variants.item}>
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-2">
                Mot de passe
              </label>
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
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
                />
              </motion.div>

              {/* Password strength indicator */}
              {formData.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const strength = getPasswordStrength(formData.password)
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= strength.score ? strength.color : 'bg-white/10'
                          }`}
                        />
                      )
                    })}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Force : <span className={`font-medium ${getPasswordStrength(formData.password).color.replace('bg-', 'text-')}`}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </p>
                </motion.div>
              )}
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={variants.item} className="pt-1">
              <Button
                type="submit"
                variant="neon-pink"
                className="w-full py-4 text-[15px] font-semibold rounded-2xl"
                isLoading={isLoading}
              >
                Créer mon compte
              </Button>
            </motion.div>
          </form>

          {/* Terms */}
          <motion.p variants={variants.item} className="mt-4 text-xs text-text-secondary/60 text-center">
            En créant un compte, tu acceptes nos{' '}
            <Link href="/terms" className="text-neon-purple/80 hover:underline">
              conditions d&apos;utilisation
            </Link>
          </motion.p>

          {/* Footer */}
          <motion.div variants={variants.item} className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[15px] text-text-secondary">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-neon-purple hover:text-neon-pink transition-colors font-semibold"
              >
                Se connecter
              </Link>
            </p>
          </motion.div>

          {/* Security badge */}
          <motion.div variants={variants.item} className="mt-5 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary/60">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Données protégées
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
