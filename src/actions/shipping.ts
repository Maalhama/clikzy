'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ShippingAddress {
  firstname: string
  lastname: string
  address: string
  address2?: string
  postalCode: string
  city: string
  country: string
  phone: string
}

export interface ShippingResult {
  success: boolean
  error?: string
}

/**
 * Update user's shipping address
 */
export async function updateShippingAddress(data: ShippingAddress): Promise<ShippingResult> {
  // Validation
  if (!data.firstname || data.firstname.length < 2) {
    return { success: false, error: 'Prénom requis (minimum 2 caractères)' }
  }
  if (!data.lastname || data.lastname.length < 2) {
    return { success: false, error: 'Nom requis (minimum 2 caractères)' }
  }
  if (!data.address || data.address.length < 5) {
    return { success: false, error: 'Adresse requise' }
  }
  if (!data.postalCode || !/^\d{5}$/.test(data.postalCode)) {
    return { success: false, error: 'Code postal invalide (5 chiffres)' }
  }
  if (!data.city || data.city.length < 2) {
    return { success: false, error: 'Ville requise' }
  }
  if (!data.phone || !/^(\+33|0)[1-9](\d{8})$/.test(data.phone.replace(/\s/g, ''))) {
    return { success: false, error: 'Numéro de téléphone invalide' }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Update profile with shipping address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      shipping_firstname: data.firstname.trim(),
      shipping_lastname: data.lastname.trim(),
      shipping_address: data.address.trim(),
      shipping_address2: data.address2?.trim() || null,
      shipping_postal_code: data.postalCode.trim(),
      shipping_city: data.city.trim(),
      shipping_country: data.country || 'France',
      shipping_phone: data.phone.replace(/\s/g, '').trim(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Update shipping address error:', error.message)
    return { success: false, error: 'Erreur lors de la mise à jour de l\'adresse' }
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Get user's shipping address
 */
export async function getShippingAddress(): Promise<ShippingAddress | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('shipping_firstname, shipping_lastname, shipping_address, shipping_address2, shipping_postal_code, shipping_city, shipping_country, shipping_phone')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.shipping_firstname) {
    return null
  }

  return {
    firstname: profile.shipping_firstname as string,
    lastname: profile.shipping_lastname as string,
    address: profile.shipping_address as string,
    address2: (profile.shipping_address2 as string) || undefined,
    postalCode: profile.shipping_postal_code as string,
    city: profile.shipping_city as string,
    country: (profile.shipping_country as string) || 'France',
    phone: profile.shipping_phone as string,
  }
}
