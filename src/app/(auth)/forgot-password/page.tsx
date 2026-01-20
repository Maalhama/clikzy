'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { resetPassword } from '@/actions/auth'
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await resetPassword(email)

    if (result.success) {
      setSuccess(true)
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
            className="absolute top-[20%] left-[10%] w-40 h-40 bg-neon-blue/20 rounded-full blur-[80px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-[30%] right-[10%] w-32 h-32 bg-neon-purple/15 rounded-full blur-[60px]"
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
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-bg-secondary flex items-center justify-center">
              <svg className="w-10 h-10 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-3"
          >
            Email envoyé !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary mb-6"
          >
            Si un compte existe avec cet email, tu recevras un lien pour réinitialiser ton mot de passe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/login">
              <Button variant="outline" className="px-8 py-3 rounded-2xl">
                Retour à la connexion
              </Button>
            </Link>
          </motion.div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h2>
          <p className="text-sm text-text-secondary">
            Entre ton email pour recevoir un lien de réinitialisation
          </p>
        </motion.div>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
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
              Envoyer le lien
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
