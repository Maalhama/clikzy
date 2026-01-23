'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { updateShippingAddress, type ShippingAddress } from '@/actions/shipping'

interface ShippingAddressFormProps {
  initialData?: ShippingAddress | null
  onSuccess?: () => void
  compact?: boolean
}

export function ShippingAddressForm({ initialData, onSuccess, compact = false }: ShippingAddressFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    firstname: initialData?.firstname || '',
    lastname: initialData?.lastname || '',
    address: initialData?.address || '',
    address2: initialData?.address2 || '',
    postalCode: initialData?.postalCode || '',
    city: initialData?.city || '',
    country: initialData?.country || 'France',
    phone: initialData?.phone || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await updateShippingAddress(formData)

    if (result.success) {
      setSuccess(true)
      onSuccess?.()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }

    setIsSubmitting(false)
  }

  const inputClass = `w-full px-4 py-3 rounded-xl bg-bg-primary border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-neon-purple transition-colors ${compact ? 'text-sm py-2.5' : ''}`
  const labelClass = `block text-white/60 text-sm mb-1.5 ${compact ? 'text-xs mb-1' : ''}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstname" className={labelClass}>Prénom *</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            className={inputClass}
            placeholder="Jean"
            required
          />
        </div>
        <div>
          <label htmlFor="lastname" className={labelClass}>Nom *</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            className={inputClass}
            placeholder="Dupont"
            required
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className={labelClass}>Adresse *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={inputClass}
          placeholder="123 Rue de la Paix"
          required
        />
      </div>

      {/* Address 2 */}
      <div>
        <label htmlFor="address2" className={labelClass}>Complément d'adresse</label>
        <input
          type="text"
          id="address2"
          name="address2"
          value={formData.address2}
          onChange={handleChange}
          className={inputClass}
          placeholder="Appartement, bâtiment, étage..."
        />
      </div>

      {/* Postal code & City row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="postalCode" className={labelClass}>Code postal *</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className={inputClass}
            placeholder="75001"
            maxLength={5}
            required
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="city" className={labelClass}>Ville *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={inputClass}
            placeholder="Paris"
            required
          />
        </div>
      </div>

      {/* Country (read-only for now) */}
      <div>
        <label htmlFor="country" className={labelClass}>Pays</label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country}
          className={`${inputClass} bg-white/5 cursor-not-allowed`}
          disabled
        />
        <p className="text-white/30 text-xs mt-1">Livraison en France métropolitaine uniquement</p>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>Téléphone *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={inputClass}
          placeholder="06 12 34 56 78"
          required
        />
        <p className="text-white/30 text-xs mt-1">Pour la livraison</p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm"
        >
          ✓ Adresse enregistrée avec succès
        </motion.div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-3 rounded-xl font-bold transition-all
          bg-gradient-to-r from-neon-purple to-neon-pink text-white
          hover:shadow-lg hover:shadow-neon-purple/30
          disabled:opacity-50 disabled:cursor-not-allowed
          ${compact ? 'py-2.5 text-sm' : ''}
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enregistrement...
          </span>
        ) : (
          'Enregistrer l\'adresse'
        )}
      </button>
    </form>
  )
}
