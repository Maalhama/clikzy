'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileResult = {
  success: boolean
  error?: string
}

/**
 * Update username
 */
export async function updateUsername(newUsername: string): Promise<ProfileResult> {
  if (!newUsername || newUsername.length < 3) {
    return { success: false, error: 'Le pseudo doit contenir au moins 3 caractères' }
  }

  if (newUsername.length > 20) {
    return { success: false, error: 'Le pseudo ne peut pas dépasser 20 caractères' }
  }

  // Check username format (alphanumeric + underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
    return { success: false, error: 'Le pseudo ne peut contenir que des lettres, chiffres et underscores' }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', newUsername)
    .neq('id', user.id)
    .single()

  if (existingUser) {
    return { success: false, error: 'Ce pseudo est déjà pris' }
  }

  // Update username
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id)

  if (error) {
    console.error('Update username error:', error.message)
    return { success: false, error: 'Erreur lors de la mise à jour du pseudo' }
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Upload avatar
 */
export async function uploadAvatar(formData: FormData): Promise<ProfileResult & { avatarUrl?: string }> {
  const file = formData.get('avatar') as File

  if (!file || file.size === 0) {
    return { success: false, error: 'Aucun fichier sélectionné' }
  }

  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Le fichier ne doit pas dépasser 2 Mo' }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format non supporté. Utilise JPG, PNG, WebP ou GIF' }
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload avatar error:', uploadError.message)
    return { success: false, error: 'Erreur lors de l\'upload de l\'avatar' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath)

  // Update profile with new avatar URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('Update avatar URL error:', updateError.message)
    return { success: false, error: 'Erreur lors de la mise à jour du profil' }
  }

  revalidatePath('/profile')
  return { success: true, avatarUrl: publicUrl }
}

