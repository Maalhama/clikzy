'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  className?: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "C'est vraiment gratuit ?",
    answer: "Oui ! Tu reçois 10 clics gratuits chaque jour, sans aucun paiement requis. Tu peux jouer et gagner des lots sans jamais dépenser un centime. Les crédits supplémentaires sont optionnels.",
  },
  {
    question: "Comment fonctionne le jeu ?",
    answer: "C'est simple : choisis un lot, clique pour participer. Chaque clic relance le timer quand il passe sous 1min30. Quand le timer atteint zéro, le dernier joueur à avoir cliqué remporte le lot.",
  },
  {
    question: "Est-ce un jeu de hasard ?",
    answer: "Non. CLIKZY est un jeu d'adresse et de timing. Il n'y a pas de tirage au sort ni d'algorithme aléatoire. Le gagnant est toujours le dernier à avoir cliqué avant la fin du timer. Tout est transparent.",
  },
  {
    question: "Comment sont livrés les lots ?",
    answer: "Les lots sont expédiés gratuitement en France métropolitaine sous 5-7 jours ouvrés. Tu reçois un numéro de suivi dès l'expédition. Tous les produits sont neufs et sous garantie.",
  },
  {
    question: "Acheter des crédits augmente mes chances ?",
    answer: "Non. Les crédits supplémentaires te permettent de jouer plus longtemps, mais n'augmentent pas tes chances de gagner. Seul le timing compte : être le dernier à cliquer.",
  },
  {
    question: "Comment contacter le support ?",
    answer: "Notre équipe est disponible 24h/24 par chat en direct sur le site ou par email à support@clikzy.fr. Temps de réponse moyen : moins de 2 heures.",
  },
]

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function FAQItemComponent({ item, isOpen, onToggle, index, isMobile }: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
  index: number
  isMobile: boolean
}) {
  const colors = ['#9B5CFF', '#3CCBFF', '#FF4FD8', '#00FF88']
  const color = colors[index % colors.length]

  return (
    <div
      className="border rounded-xl overflow-hidden transition-all duration-300"
      style={{
        borderColor: isOpen ? `${color}50` : 'rgba(255,255,255,0.1)',
        background: isOpen ? `linear-gradient(135deg, ${color}08, transparent)` : 'transparent',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-sm md:text-base pr-4">{item.question}</span>
        <span style={{ color }}>
          <ChevronIcon isOpen={isOpen} />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={isMobile ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={isMobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: isMobile ? 0.1 : 0.3, ease: 'easeInOut' }}
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5">
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ({ className = '' }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const isMobile = useIsMobile()

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-6 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-xs md:text-sm font-medium mb-3 md:mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          FAQ
        </div>
        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3">
          QUESTIONS <span className="text-neon-purple">FRÉQUENTES</span>
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
          Tout ce que tu dois savoir avant de jouer
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto">
        {FAQ_ITEMS.map((item, index) => (
          <FAQItemComponent
            key={index}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => toggleItem(index)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-6 md:mt-10 text-center">
        <p className="text-white/50 text-sm mb-3">
          Tu as d'autres questions ?
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:border-neon-purple/50 hover:bg-neon-purple/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Contacter le support
        </Link>
      </div>
    </div>
  )
}
