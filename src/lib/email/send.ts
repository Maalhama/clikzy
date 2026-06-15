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

/** Alerte admin sur événement critique (paiement non honoré, etc.). */
export async function sendAdminAlertEmail(subject: string, detail: string): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend non configuré, alerte admin ignorée')
    return false
  }
  const to = process.env.ADMIN_ALERT_EMAIL || 'support@cleekzy.com'
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `[CLEEKZY ALERTE] ${subject}`,
      html: `<div style="font-family:sans-serif;padding:16px;max-width:560px"><h2 style="margin:0 0 8px">Alerte Cleekzy</h2><p style="font-weight:600;margin:0 0 12px">${subject}</p><pre style="background:#f4f4f4;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px">${detail}</pre><p style="color:#888;font-size:12px">${new Date().toISOString()}</p></div>`,
    })
    if (error) {
      console.error('[EMAIL] Erreur alerte admin:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[EMAIL] Exception alerte admin:', err)
    return false
  }
}

/** Confirmation d'achat de crédits (après grant réussi côté webhook). */
export async function sendPurchaseConfirmationEmail(email: string, credits: number, doubled: boolean): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend non configuré, confirmation achat ignorée')
    return false
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Tes ${credits} crédits Cleekzy sont là`,
      html: `<div style="font-family:sans-serif;background:#0B0F1A;color:#fff;padding:32px;border-radius:16px;max-width:480px">
        <h1 style="color:#9B5CFF;margin:0 0 8px;font-size:22px">Paiement confirmé</h1>
        <p style="color:#cbd5e1;line-height:1.5">Merci pour ton achat ! <strong style="color:#fff">${credits} crédits</strong> ont été ajoutés à ton compte${doubled ? ' <span style="color:#FF4FD8">(bonus x2 du 1er achat du mois inclus !)</span>' : ''}.</p>
        <a href="https://www.cleekzy.com/lobby" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#9B5CFF,#FF4FD8);color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600">Retour à l'arène</a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Joue de façon responsable. Réservé aux 18 ans et plus. cleekzy.com</p>
      </div>`,
    })
    if (error) {
      console.error('[EMAIL] Erreur confirmation achat:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[EMAIL] Exception confirmation achat:', err)
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
