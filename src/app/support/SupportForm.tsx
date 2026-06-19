'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { submitSupportTicket } from '@/actions/support'

/**
 * Formulaire de contact support — seule partie interactive de /support.
 * Extrait pour que la page reste un Server Component (metadata SEO + moins de JS).
 */
export function SupportForm() {
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
    const res = await submitSupportTicket(formData)
    setIsLoading(false)
    if (!res.success) {
      setError(res.error ?? 'Une erreur est survenue. Réessaie plus tard.')
      return
    }
    setSuccess(true)
  }

  return (
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
          <p className="text-white/60 mb-4">Nous avons bien reçu ta demande et te répondrons par email dès que possible.</p>
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
                className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/50 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
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
                className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/50 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50"
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
              className="w-full px-4 py-3 rounded-xl bg-bg-primary/50 border border-white/10 text-sm text-white placeholder-white/50 transition-colors focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 disabled:opacity-50 resize-none"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
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
  )
}
