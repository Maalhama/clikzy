'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/button'

interface ContactMethod {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
  color: string
}

const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Email',
    description: 'Réponse sous 2h en moyenne',
    action: 'support@clikzy.fr',
    href: 'mailto:support@clikzy.fr',
    color: '#9B5CFF',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Chat en direct',
    description: 'Disponible 24h/24, 7j/7',
    action: 'Démarrer le chat',
    href: '#',
    color: '#3CCBFF',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    title: 'Discord',
    description: 'Rejoins notre communauté',
    action: 'Rejoindre le serveur',
    href: '#',
    color: '#FF4FD8',
  },
]

const FAQ_QUICK = [
  {
    question: "Où en est ma livraison ?",
    answer: "Tu peux suivre ta livraison depuis ton profil, section 'Mes gains'. Un numéro de suivi t'est envoyé par email dès l'expédition.",
  },
  {
    question: "Je n'ai pas reçu mes crédits bonus",
    answer: "Les crédits sont crédités automatiquement. Si tu ne les vois pas, déconnecte-toi et reconnecte-toi. Si le problème persiste, contacte-nous.",
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Envoie-nous un email à support@clikzy.fr avec l'objet 'Suppression de compte' et nous traiterons ta demande sous 48h.",
  },
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate sending - in production, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, open mailto
    const mailtoUrl = `mailto:support@clikzy.fr?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Nom: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    )}`
    window.location.href = mailtoUrl

    setSuccess(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-dvh w-full relative overflow-y-auto bg-bg-primary">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-neon-pink/10 rounded-full blur-[100px]" />
        <div className="absolute top-[50%] right-[30%] w-64 h-64 bg-neon-blue/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" animated={false} href="/" />
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:border-neon-purple/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Support 24/7
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            COMMENT POUVONS-NOUS <span className="text-neon-purple">T'AIDER</span> ?
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Notre équipe est là pour répondre à toutes tes questions. Temps de réponse moyen : moins de 2 heures.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {CONTACT_METHODS.map((method, index) => (
            <a
              key={index}
              href={method.href}
              className="group p-6 rounded-2xl bg-bg-secondary/50 border border-white/10 hover:border-opacity-50 transition-all duration-300"
              style={{
                borderColor: `${method.color}30`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${method.color}20`, color: method.color }}
              >
                {method.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{method.title}</h3>
              <p className="text-white/50 text-sm mb-3">{method.description}</p>
              <span
                className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                style={{ color: method.color }}
              >
                {method.action}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <div className="p-6 md:p-8 rounded-2xl bg-bg-secondary/50 border border-white/10">
              <h2 className="text-xl md:text-2xl font-black mb-2">
                ENVOIE-NOUS UN <span className="text-neon-pink">MESSAGE</span>
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Décris ton problème et nous te répondrons rapidement.
              </p>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Message envoyé !</h3>
                  <p className="text-white/60 mb-4">Nous te répondrons sous 2 heures maximum.</p>
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setFormData({ name: '', email: '', subject: '', message: '' })
                    }}
                    className="text-neon-purple hover:text-neon-pink transition-colors text-sm font-medium"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-medium text-white/60 mb-2">
                        Ton nom
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/30 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-white/60 mb-2">
                        Ton email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="jean@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/30 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-medium text-white/60 mb-2">
                      Sujet
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50 appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff50'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                    >
                      <option value="">Sélectionne un sujet</option>
                      <option value="Problème de livraison">Problème de livraison</option>
                      <option value="Problème de compte">Problème de compte</option>
                      <option value="Problème de crédits">Problème de crédits</option>
                      <option value="Problème technique">Problème technique</option>
                      <option value="Signaler un bug">Signaler un bug</option>
                      <option value="Suggestion">Suggestion</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-white/60 mb-2">
                      Ton message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Décris ton problème en détail..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/30 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50 resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-sm font-semibold rounded-xl"
                    isLoading={isLoading}
                  >
                    Envoyer le message
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="order-1 lg:order-2">
            <h2 className="text-xl md:text-2xl font-black mb-2">
              QUESTIONS <span className="text-neon-blue">RAPIDES</span>
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Trouve peut-être ta réponse ici avant de nous contacter.
            </p>

            <div className="space-y-4">
              {FAQ_QUICK.map((item, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-bg-secondary/30 border border-white/10"
                >
                  <h3 className="font-bold text-white mb-2 flex items-start gap-2">
                    <span className="text-neon-blue">Q:</span>
                    {item.question}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed pl-5">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 mt-6 text-neon-purple hover:text-neon-pink transition-colors text-sm font-medium"
            >
              Voir toutes les FAQ
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Trust indicators */}
            <div className="mt-8 p-5 rounded-xl bg-success/5 border border-success/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Support vérifié</div>
                  <div className="text-xs text-white/50">Équipe française basée à Paris</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  En ligne maintenant
                </span>
                <span>Temps de réponse : ~2h</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/40">
            © 2024 CLIKZY. Tous droits réservés.
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <Link href="/lobby" className="hover:text-white transition-colors">Jouer</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
