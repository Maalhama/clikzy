'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { VIPDashboard } from '@/components/vip/VIPDashboard'
import VIPSubscriptionModal from '@/components/modals/VIPSubscriptionModal'
import { createVIPCheckoutSession, getVIPDetails, createBillingPortalSession, type VIPTier } from '@/actions/stripe'
import { Coins, Percent, Gamepad2, Gift, Sparkles, LifeBuoy } from 'lucide-react'

// Neon Medal Icons for VIP tiers
const BronzeMedalIcon = () => (
  <svg className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="9" r="6" />
    <path d="M8 15l-2 7 6-3 6 3-2-7" />
  </svg>
)

const SilverMedalIcon = () => (
  <svg className="w-6 h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.6)]" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="9" r="6" />
    <path d="M8 15l-2 7 6-3 6 3-2-7" />
  </svg>
)

const GoldMedalIcon = () => (
  <svg className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="9" r="6" />
    <path d="M8 15l-2 7 6-3 6 3-2-7" />
  </svg>
)

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="19" cy="5" r="1.5" />
    <rect x="6" y="16" width="12" height="2" rx="0.5" />
    <rect x="5" y="19" width="14" height="2" rx="0.5" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const LoadingSpinner = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const VIP_TIERS = [
  {
    name: 'Bronze',
    icon: BronzeMedalIcon,
    hex: '#CD7F32',
    duration: 'Dès le 1er mois',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    benefits: [
      'Tous les avantages V.I.P débloqués',
      'Badge V.I.P Bronze',
      'Support prioritaire',
    ],
  },
  {
    name: 'Silver',
    icon: SilverMedalIcon,
    hex: '#C0C8D8',
    duration: 'Après 3 mois',
    color: 'from-slate-300 to-slate-500',
    borderColor: 'border-slate-400/30',
    bgColor: 'bg-slate-400/10',
    textColor: 'text-slate-300',
    benefits: [
      'Badge V.I.P Silver exclusif',
      'Accès anticipé aux nouveaux jeux',
      'Tous les avantages Bronze',
    ],
  },
  {
    name: 'Gold',
    icon: GoldMedalIcon,
    hex: '#FFD700',
    duration: 'Après 6 mois',
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    benefits: [
      'Badge V.I.P Gold légendaire',
      'Accès aux événements exclusifs',
      'Tous les avantages Silver',
    ],
  },
]

const VIP_PERKS = [
  { icon: Coins, title: '20 crédits chaque jour', desc: 'Le double des joueurs gratuits, crédités automatiquement à minuit.' },
  { icon: Percent, title: '−10% sur tous les packs', desc: 'Une remise permanente sur chaque achat de crédits, tant que tu es V.I.P.' },
  { icon: Gamepad2, title: '2× mini-jeux gratuits', desc: 'Double tes parties quotidiennes et farme encore plus de crédits.' },
  { icon: Gift, title: 'Lots premium réservés', desc: 'Accède aux produits exclusifs (+1000€) hors de portée des autres.' },
  { icon: Sparkles, title: 'Badge & cosmétique exclusifs', desc: 'Affiche ton statut avec un badge V.I.P et un cosmétique rien qu\'à toi.' },
  { icon: LifeBuoy, title: 'Support prioritaire', desc: 'Tes messages passent devant. Une question, une réponse rapide.' },
]

const FAQ_ITEMS = [
  {
    question: 'Comment fonctionne l\'abonnement V.I.P ?',
    answer: 'L\'abonnement V.I.P est un paiement mensuel de 12,99€. Il se renouvelle automatiquement chaque mois. Tu peux annuler à tout moment depuis ton profil.',
  },
  {
    question: 'Comment fonctionnent les crédits V.I.P ?',
    answer: 'En tant que V.I.P, tu reçois 20 crédits gratuits chaque jour (le double des 10 standards), crédités automatiquement — plus -10% sur tous les packs. Pour stocker davantage de crédits, les packs restent la solution.',
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer: 'Oui, tu peux annuler ton abonnement à tout moment. Tu conserveras tes avantages V.I.P jusqu\'à la fin de la période payée.',
  },
  {
    question: 'Comment passer au niveau supérieur ?',
    answer: 'Les niveaux progressent automatiquement avec la durée de ton abonnement. Après 3 mois consécutifs tu passes Silver, après 6 mois tu deviens Gold !',
  },
]

// VIP Details state type
type VIPDetailsState = {
  isVip: boolean
  tier: VIPTier
  memberSince: string
  daysUntilNextTier: number
  totalCreditsEarned: number
  currentCredits: number
  subscriptionId: string | null
} | null

export default function VIPPage() {
  const [showModal, setShowModal] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingVIP, setIsCheckingVIP] = useState(true)
  const [vipDetails, setVipDetails] = useState<VIPDetailsState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  // Page personnelle : rediriger les visiteurs non connectés
  useEffect(() => {
    createBrowserClient().auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
    }).catch(() => {})
  }, [router])

  // Check VIP status on mount
  useEffect(() => {
    async function checkVIP() {
      try {
        const vipResult = await getVIPDetails()
        if (vipResult.success && vipResult.data) {
          setVipDetails(vipResult.data)
        }
      } catch {
        // non-VIP ou non connecté : état géré par l'UI
      } finally {
        setIsCheckingVIP(false)
      }
    }
    checkVIP()
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const result = await createVIPCheckoutSession()
      if (result.success && result.data?.url) {
        window.location.href = result.data.url
      } else {
        console.error('Failed to create checkout session:', result.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const result = await createBillingPortalSession()
      if (result.success && result.data?.url) {
        window.location.href = result.data.url
      } else {
        // Fallback: show message if no billing portal available
        setActionError('Pour gérer ton abonnement, contacte le support.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating billing portal session:', error)
      alert('Pour gérer ton abonnement, contacte le support.')
      setIsLoading(false)
    }
  }

  // Loading state
  if (isCheckingVIP) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <span className="text-text-secondary">Chargement...</span>
        </div>
      </div>
    )
  }

  // VIP User Dashboard
  if (vipDetails) {
    return (
      <div className="min-h-screen pb-20 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <VIPDashboard
            tier={vipDetails.tier}
            memberSince={vipDetails.memberSince}
            daysUntilNextTier={vipDetails.daysUntilNextTier}
            totalCreditsEarned={vipDetails.totalCreditsEarned}
            currentCredits={vipDetails.currentCredits}
            onManageSubscription={handleManageSubscription}
          />
        </div>
      </div>
    )
  }

  // Non-VIP User: Subscription Page
  return (
    <>
      {actionError && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-md"
          onClick={() => setActionError(null)}
        >
          {actionError}
        </div>
      )}
      <div className="min-h-screen pb-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-12 pt-16">
          {/* Aura dorée + halo premium */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-amber-600/10 blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 h-56 w-56 rounded-full bg-neon-purple/10 blur-[110px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Kicker */}
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/5 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-yellow-300/90">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Abonnement premium
              </span>

              {/* Couronne — médaillon doré + halo pulsant */}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400/20 blur-2xl" aria-hidden />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 shadow-[0_0_40px_-4px_rgba(234,179,8,0.7),inset_0_2px_8px_rgba(255,255,255,0.45),inset_0_-6px_12px_rgba(120,53,15,0.45)]">
                  <span className="absolute inset-[3px] rounded-[1.4rem] border border-white/30" aria-hidden />
                  <CrownIcon className="relative h-11 w-11 text-[#3a2a06] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]" />
                </div>
              </div>

              <h1 className="title-giant mb-4 text-4xl md:text-6xl">
                <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
                  Deviens V.I.P
                </span>
              </h1>

              <p className="mx-auto mb-8 max-w-xl text-lg text-text-secondary">
                Le statut qui change tout : plus de crédits chaque jour, des remises permanentes
                et des lots premium réservés. Plus tu restes, plus tu montes en rang.
              </p>

              {/* Prix + CTA hero */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => setShowModal(true)}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-7 py-3.5 font-display text-base font-bold text-[#2a1e04] shadow-[0_0_28px_-6px_rgba(234,179,8,0.7)] transition-all hover:scale-[1.03] hover:shadow-[0_0_38px_-4px_rgba(234,179,8,0.85)]"
                >
                  <CrownIcon className="h-5 w-5" />
                  Devenir V.I.P
                  <span className="rounded-md bg-black/15 px-2 py-0.5 text-sm font-bold">12,99€<span className="font-medium opacity-70">/mois</span></span>
                </button>
                <span className="text-sm text-text-secondary/70">Annulable à tout moment</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Avantages premium — la vraie valeur V.I.P, mise en avant */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-10 text-center"
            >
              <h2 className="text-2xl font-bold md:text-3xl">
                <span className="text-white">Tout ce que débloque le </span>
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">statut V.I.P</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
                Des avantages concrets, actifs dès la première seconde de ton abonnement.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VIP_PERKS.map((perk, index) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="group relative overflow-hidden rounded-2xl border border-yellow-500/15 bg-bg-secondary/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/35"
                >
                  {/* Lueur dorée au survol */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                  <div className="relative mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-600/10 ring-1 ring-yellow-500/25">
                    <perk.icon className="h-5 w-5 text-yellow-400" aria-hidden />
                  </div>
                  <h3 className="relative font-display text-base font-bold text-white">{perk.title}</h3>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-text-secondary">{perk.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* VIP Tiers */}
        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-2xl font-bold md:text-3xl">
                <span className="text-white">Tes rangs de </span>
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">fidélité</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary">
                Plus tu restes V.I.P, plus ton rang grimpe — et avec lui des badges et des accès exclusifs. Sans rien payer de plus.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {VIP_TIERS.map((tier, index) => {
                const isGold = tier.name === 'Gold'
                return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative rounded-2xl border-2 bg-bg-secondary/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 ${tier.borderColor} ${isGold ? 'lg:scale-[1.04]' : ''}`}
                  style={{ boxShadow: `0 0 ${isGold ? 48 : 34}px -10px ${tier.hex}55` }}
                >
                  {/* Trophée : emblème sur piédestal lumineux */}
                  <div className="relative mb-5 flex flex-col items-center pt-2">
                    <div className="hero-stage-floor absolute bottom-0 left-1/2 h-7 w-32 -translate-x-1/2" aria-hidden />
                    <div
                      className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 bg-bg-primary transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1"
                      style={{ borderColor: tier.hex, boxShadow: `0 0 24px -2px ${tier.hex}, inset 0 0 14px -6px ${tier.hex}` }}
                    >
                      <span
                        className="absolute inset-1.5 rounded-full border"
                        style={{ borderColor: `${tier.hex}44` }}
                        aria-hidden
                      />
                      <tier.icon />
                    </div>
                  </div>

                  {/* Nom + durée */}
                  <div className="mb-5 text-center">
                    <h3 className={`font-display text-2xl font-bold ${tier.textColor}`}>
                      {tier.name}
                    </h3>
                    <span
                      className="mt-1.5 inline-block rounded-full border px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/60"
                      style={{ borderColor: `${tier.hex}40`, background: `${tier.hex}14` }}
                    >
                      {tier.duration}
                    </span>
                  </div>

                  {/* Benefits list */}
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckIcon className={`w-5 h-5 ${tier.textColor} flex-shrink-0 mt-0.5`} />
                        <span className="text-text-primary">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )})}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/[0.12] via-bg-secondary/40 to-amber-600/[0.12] p-8 text-center backdrop-blur-sm md:p-10"
          >
            {/* Halos dorés */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-yellow-500/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-600/15 blur-3xl" aria-hidden />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_26px_-4px_rgba(234,179,8,0.7)]">
                <CrownIcon className="h-7 w-7 text-[#2a1e04]" />
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold md:text-3xl">
                <span className="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">Prends ta place de V.I.P</span>
              </h2>
              <p className="mx-auto mb-7 max-w-md text-text-secondary">
                Rejoins le cercle, profite de chaque avantage dès aujourd&apos;hui et grimpe les rangs mois après mois.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 font-display text-lg font-bold text-[#2a1e04] shadow-[0_0_30px_-6px_rgba(234,179,8,0.75)] transition-all hover:scale-[1.04] hover:shadow-[0_0_42px_-4px_rgba(234,179,8,0.9)]"
              >
                <CrownIcon className="h-6 w-6" />
                <span>S&apos;abonner V.I.P</span>
                <span className="rounded-md bg-black/15 px-2 py-0.5 text-sm font-bold">12,99€/mois</span>
              </button>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-secondary/70">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Paiement sécurisé Stripe · Annulable à tout moment
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-center mb-8"
            >
              Questions fréquentes
            </motion.h2>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 overflow-hidden bg-bg-secondary/30"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{item.question}</span>
                    <ChevronIcon
                      className={`w-5 h-5 text-text-secondary transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-5 pb-4 text-sm text-text-secondary">
                      {item.answer}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* VIP Subscription Modal */}
      <VIPSubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubscribe={handleSubscribe}
        isLoading={isLoading}
      />
    </>
  )
}
