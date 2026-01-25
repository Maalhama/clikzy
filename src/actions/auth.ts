'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'

export type AuthResult = {
  success: boolean
  error?: string
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email invalide' }
  }

  if (!password) {
    return { success: false, error: 'Mot de passe requis' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error.message)

    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email ou mot de passe incorrect' }
    }

    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Vérifie ton email pour confirmer ton compte' }
    }

    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Sign in with OAuth provider (Google, GitHub)
 * Returns the OAuth URL for client-side redirect
 */
export async function signInWithOAuth(provider: 'google' | 'github'): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    console.log('[OAuth] Starting OAuth flow for provider:', provider)

    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL
    console.log('[OAuth] Origin:', origin)

    const supabase = await createClient()
    console.log('[OAuth] Supabase client created')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=/lobby`,
      },
    })

    console.log('[OAuth] Supabase response:', { data, error })

    if (error) {
      console.error('[OAuth] Error:', error.message)
      return { success: false, error: error.message }
    }

    if (data.url) {
      console.log('[OAuth] Success, redirect URL:', data.url)
      return { success: true, url: data.url }
    }

    return { success: false, error: 'URL de redirection manquante' }
  } catch (err) {
    console.error('[OAuth] Unexpected error:', err)
    return { success: false, error: 'Erreur inattendue lors de la connexion' }
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email invalide' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' }
  }

  if (!username || username.length < 3) {
    return { success: false, error: 'Le pseudo doit contenir au moins 3 caractères' }
  }

  // Check username format (alphanumeric + underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, error: 'Le pseudo ne peut contenir que des lettres, chiffres et underscores' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username,
      },
    },
  })

  if (error) {
    console.error('Sign up error:', error.message)

    if (error.message.includes('already registered')) {
      return { success: false, error: 'Cet email est déjà utilisé' }
    }

    return { success: false, error: error.message }
  }

  // Send welcome email (non-blocking, don't fail signup if email fails)
  sendWelcomeEmail(email, username).catch((err) => {
    console.error('Failed to send welcome email:', err)
  })

  return { success: true }
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get current user with profile
 */
export async function getUserWithProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email invalide' }
  }

  const supabase = await createClient()
  // Toujours utiliser NEXT_PUBLIC_SITE_URL pour éviter les redirections vers localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cleekzy.com'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('Update password error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
