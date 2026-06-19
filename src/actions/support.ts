'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendAdminAlertEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rateLimit'

// Tickets de support (#8 audit). Stocke la demande + alerte l'équipe par email.
// Lie l'user_id si le visiteur est connecté.

export async function submitSupportTicket(input: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const name = (input.name ?? '').trim()
  const email = (input.email ?? '').trim()
  const subject = (input.subject ?? '').trim()
  const message = (input.message ?? '').trim()

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { success: false, error: 'Email invalide' }
  if (!subject) return { success: false, error: 'Choisis un sujet' }
  if (message.length < 5) return { success: false, error: 'Ton message est trop court' }
  if (message.length > 4000) return { success: false, error: 'Ton message est trop long' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anti-spam : 3 tickets / minute par utilisateur (ou par IP si anonyme). Évite le
  // flood de la table + des alertes email. Fail-closed.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(`support:${user?.id ?? ip}`, 3, 60_000, true)
  if (!rl.success) {
    return { success: false, error: 'Trop de demandes. Réessaie dans une minute.' }
  }

  const svc = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('support_tickets').insert({
    user_id: user?.id ?? null,
    name: name || null,
    email,
    subject,
    message,
  })
  if (error) {
    console.error('[SUPPORT] insert error:', error)
    return { success: false, error: "Erreur lors de l'envoi. Réessaie plus tard." }
  }

  // Alerte équipe (best-effort, ne bloque pas la confirmation joueur).
  sendAdminAlertEmail(
    `Nouveau ticket support : ${subject}`,
    `De: ${name || 'Anonyme'} <${email}>${user ? ` (user ${user.id})` : ''}\n\n${message}`,
  ).catch((e) => console.error('[SUPPORT] admin alert failed:', e))

  return { success: true }
}
