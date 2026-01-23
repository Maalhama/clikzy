'use server'

import { createClient } from '@/lib/supabase/server'
import type { CreditPackId } from '@/lib/stripe/config'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a Stripe Checkout session for purchasing credits
 */
export async function createCheckoutSession(
  packId: CreditPackId
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  try {
    // Call our API route to create the session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Erreur lors de la création de la session' }
    }

    const data = await response.json()
    return { success: true, data: { url: data.url } }
  } catch (error) {
    console.error('Checkout session error:', error)
    return { success: false, error: 'Erreur de connexion au serveur de paiement' }
  }
}
