'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import VIPSubscriptionModal from '@/components/modals/VIPSubscriptionModal'
import { createVIPCheckoutSession } from '@/actions/stripe'

const VIP_TIERS = [
  {
    name: 'Bronze',
    emoji: '🥉',
    duration: 'Dès le 1er mois',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    benefits: [
      '+10 crédits bonus par jour',
      'Accès aux produits premium (+1000€)',
      'Badge V.I.P Bronze',
      'Support prioritaire',
    ],
  },
  {
    name: 'Silver',
    emoji: '🥈',
    duration: 'Après 3 mois',
    color: 'from-slate-300 to-slate-500',
    borderColor: 'border-slate-400/30',
    bgColor: 'bg-slate-400/10',
    textColor: 'text-slate-300',
    benefits: [
      '+15 crédits bonus par jour',
      'Tous les avantages Bronze',
      'Badge V.I.P Silver exclusif',
      'Accès anticipé aux nouveaux jeux',
    ],
  },
  {
    name: 'Gold',
    emoji: '🥇',
    duration: 'Après 6 mois',
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    benefits: [
      '+20 crédits bonus par jour',
      'Tous les avantages Silver',
      'Badge V.I.P Gold légendaire',
      'Accès aux événements exclusifs',
    ],
  },
]

const FAQ_ITEMS = [
  {
    question: 'Comment fonctionne l\'abonnement V.I.P ?',
    answer: 'L\'abonnement V.I.P est un paiement mensuel de 9,99€. Il se renouvelle automatiquement chaque mois. Tu peux annuler à tout moment depuis ton profil.',
  },
  {
    question: 'Les bonus de crédits sont-ils cumulés ?',
    answer: 'Les bonus de crédits remplacent le bonus du niveau précédent. Par exemple, au niveau Gold, tu reçois +20 crédits/jour (pas 10+15+20).',
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

export default function VIPPage() {
  const [showModal, setShowModal] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <>
      <div className="min-h-screen pb-20">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-purple/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Crown icon - Neon style */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_30px_rgba(234,179,8,0.5),0_0_60px_rgba(234,179,8,0.3)]">
                <svg className="w-10 h-10 text-[#0B0F1A] drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6l3.5 4.5L19 6l-2 10H7L5 6l3.5 4.5L12 6z" />
                  <circle cx="12" cy="4" r="1.5" />
                  <circle cx="5" cy="5" r="1.5" />
                  <circle cx="19" cy="5" r="1.5" />
                  <rect x="6" y="16" width="12" height="2" rx="0.5" />
                  <rect x="5" y="19" width="14" height="2" rx="0.5" />
                </svg>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
                  Deviens V.I.P
                </span>
              </h1>

              <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                Débloque des avantages exclusifs et progresse à travers les niveaux Bronze, Silver et Gold.
                Plus tu restes, plus tu gagnes !
              </p>

              {/* Price badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-bg-secondary/50 border border-yellow-500/20 backdrop-blur-sm">
                <span className="text-text-secondary">À partir de</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  9,99€
                </span>
                <span className="text-text-secondary">/mois</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* VIP Tiers */}
        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-center mb-12"
            >
              <span className="text-white">Niveaux </span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                V.I.P
              </span>
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-6">
              {VIP_TIERS.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl ${tier.bgColor} border ${tier.borderColor} backdrop-blur-sm`}
                >
                  {/* Tier header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl`}>
                      {tier.emoji}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${tier.textColor}`}>
                        {tier.name}
                      </h3>
                      <p className="text-sm text-text-secondary">{tier.duration}</p>
                    </div>
                  </div>

                  {/* Benefits list */}
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className={`w-5 h-5 ${tier.textColor} flex-shrink-0 mt-0.5`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-text-primary">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center p-8 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Prêt à devenir V.I.P ?
            </h2>
            <p className="text-text-secondary mb-6">
              Commence ton aventure V.I.P dès maintenant et profite de tous les avantages exclusifs.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-lg hover:from-yellow-400 hover:to-amber-500 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30"
            >
              <span>👑</span>
              <span>S&apos;abonner V.I.P</span>
              <span className="text-sm font-normal opacity-75">9,99€/mois</span>
            </button>
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
                    <svg
                      className={`w-5 h-5 text-text-secondary transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
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
