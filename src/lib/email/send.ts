import { resend, EMAIL_FROM } from './resend'
import {
  welcomeEmailHtml,
  winnerEmailHtml,
  shippingEmailHtml,
  vipPaymentFailedEmailHtml,
  streakReminderEmailHtml,
} from './templates'

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured, skipping welcome email')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Bienvenue sur Cleekzy, ${username} ! 🎉`,
      html: welcomeEmailHtml(username),
    })

    if (error) {
      console.error('[EMAIL] Error sending welcome email:', error)
      return false
    }

    console.log(`[EMAIL] Welcome email sent to ${email}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Exception sending welcome email:', err)
    return false
  }
}

export async function sendWinnerEmail(
  email: string,
  username: string,
  itemName: string,
  itemValue: number
): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured, skipping winner email')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `🏆 Tu as gagné ${itemName} sur Cleekzy !`,
      html: winnerEmailHtml(username, itemName, itemValue),
    })

    if (error) {
      console.error('[EMAIL] Error sending winner email:', error)
      return false
    }

    console.log(`[EMAIL] Winner email sent to ${email} for ${itemName}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Exception sending winner email:', err)
    return false
  }
}

export async function sendShippingEmail(
  email: string,
  username: string,
  itemName: string,
  trackingNumber: string,
  carrier?: string,
): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured, skipping shipping email')
    return false
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `📦 ${itemName} est en route !`,
      html: shippingEmailHtml(username, itemName, trackingNumber, carrier),
    })
    if (error) {
      console.error('[EMAIL] Error sending shipping email:', error)
      return false
    }
    console.log(`[EMAIL] Shipping email sent to ${email} (${trackingNumber})`)
    return true
  } catch (err) {
    console.error('[EMAIL] Exception sending shipping email:', err)
    return false
  }
}

export async function sendVipPaymentFailedEmail(email: string, username: string): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured, skipping VIP payment-failed email')
    return false
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Action requise : ton paiement V.I.P a échoué',
      html: vipPaymentFailedEmailHtml(username),
    })
    if (error) {
      console.error('[EMAIL] Error sending VIP payment-failed email:', error)
      return false
    }
    console.log(`[EMAIL] VIP payment-failed email sent to ${email}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Exception sending VIP payment-failed email:', err)
    return false
  }
}

export async function sendStreakReminderEmail(email: string, username: string, streakDays: number): Promise<boolean> {
  if (!resend) return false
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `🔥 Ta série de ${streakDays} jours t'attend`,
      html: streakReminderEmailHtml(username, streakDays),
    })
    if (error) {
      console.error('[EMAIL] Error sending streak email:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[EMAIL] Exception sending streak email:', err)
    return false
  }
}
