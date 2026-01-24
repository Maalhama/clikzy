'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { applyReferralCode } from '@/actions/referral'

interface ReferralSectionProps {
  referralCode: string | null
  referralCount: number
  creditsEarned: number
  hasReferrer: boolean
}

export function ReferralSection({ referralCode, referralCount, creditsEarned, hasReferrer }: ReferralSectionProps) {
  const [showApplyCode, setShowApplyCode] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`
    : null

  async function handleCopyLink() {
    if (!referralLink) return

    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = referralLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopyCode() {
    if (!referralCode) return

    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  async function handleApplyCode() {
    if (!inputCode.trim()) return

    setIsApplying(true)
    setError(null)

    const result = await applyReferralCode(inputCode.trim())

    if (result.success) {
      setSuccess(true)
      setShowApplyCode(false)
      setInputCode('')
    } else {
      setError(result.error || 'Erreur')
    }

    setIsApplying(false)
  }

  async function handleShare() {
    if (!referralLink) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins CLEEKZY !',
          text: 'Gagne des produits incroyables gratuitement ! Utilise mon code de parrainage.',
          url: referralLink,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-gradient-to-br from-neon-purple/10 via-bg-secondary/50 to-neon-pink/10 border border-neon-purple/30 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-lg shadow-neon-purple/30">
          <GiftIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold">Parrainage</h3>
          <p className="text-white/50 text-xs">Invite tes amis, gagne des crédits</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-2xl font-bold text-neon-purple">{referralCount}</div>
          <div className="text-white/40 text-xs">Filleul{referralCount > 1 ? 's' : ''}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <div className="text-2xl font-bold text-success">+{creditsEarned}</div>
          <div className="text-white/40 text-xs">Crédits gagnés</div>
        </div>
      </div>

      {/* Referral Code */}
      {referralCode && (
        <div className="mb-4">
          <div className="text-white/50 text-xs mb-2">Ton code de parrainage</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-bg-primary border border-white/10 font-mono text-lg font-bold text-white tracking-wider">
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {copied ? <CheckIcon className="w-5 h-5 text-success" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-neon-purple/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ShareIcon className="w-5 h-5" />
        Partager mon lien
      </button>

      {/* Apply Code Section (if user hasn't been referred yet) */}
      {!hasReferrer && !success && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {!showApplyCode ? (
            <button
              onClick={() => setShowApplyCode(true)}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
            >
              Tu as un code de parrainage ?
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-bg-primary border border-white/20 text-white font-mono uppercase tracking-wider placeholder:text-white/30 focus:outline-none focus:border-neon-purple transition-colors"
                  />
                  <button
                    onClick={handleApplyCode}
                    disabled={isApplying || !inputCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white font-bold disabled:opacity-50 transition-all"
                  >
                    {isApplying ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'OK'
                    )}
                  </button>
                </div>
                {error && <p className="text-danger text-xs">{error}</p>}
                <button
                  onClick={() => { setShowApplyCode(false); setError(null); setInputCode('') }}
                  className="text-white/40 hover:text-white text-xs transition-colors"
                >
                  Annuler
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 rounded-xl bg-success/20 border border-success/30 text-success text-sm text-center"
        >
          Code appliqué ! Ton parrain a reçu 10 crédits.
        </motion.div>
      )}
    </motion.div>
  )
}

// Icons
function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}
