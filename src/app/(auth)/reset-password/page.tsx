'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { updatePassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'

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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const strength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsLoading(true)

    const result = await updatePassword(password)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/lobby')
      }, 2000)
    } else {
      setError(result.error || 'Une erreur est survenue')
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-[20%] left-[10%] w-40 h-40 bg-success/20 rounded-full blur-[80px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-3"
          >
            Mot de passe modifié !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary"
          >
            Redirection vers le lobby...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] left-[5%] w-32 h-32 bg-neon-purple/15 rounded-full blur-[60px]"
        />
        <motion.div
          animate={{ y: [5, -5, 5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[20%] right-[5%] w-40 h-40 bg-neon-pink/15 rounded-full blur-[70px]"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <Logo size="lg" animated={true} href="/" />
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-sm text-text-secondary">
            Choisis un nouveau mot de passe sécurisé
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-2">
              Nouveau mot de passe
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={isLoading}
                minLength={6}
                className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
              />
            </motion.div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength.score ? strength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-secondary">
                  Force : <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                </p>
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-text-secondary mb-2">
              Confirmer le mot de passe
            </label>
            <motion.div
              animate={{
                boxShadow: focusedField === 'confirmPassword'
                  ? '0 0 0 2px rgba(155, 92, 255, 0.3), 0 0 20px rgba(155, 92, 255, 0.15)'
                  : '0 0 0 0px transparent',
              }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl"
            >
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Répète ton mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={isLoading}
                className="w-full px-4 py-4 rounded-2xl bg-bg-secondary/50 border border-white/10 text-[15px] text-white placeholder-text-secondary/50 transition-colors focus:outline-none focus:border-neon-purple disabled:opacity-50"
              />
            </motion.div>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-danger mt-2">Les mots de passe ne correspondent pas</p>
            )}
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
              disabled={password.length < 6 || password !== confirmPassword}
            >
              Modifier le mot de passe
            </Button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link
            href="/login"
            className="text-[15px] text-text-secondary hover:text-white transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
