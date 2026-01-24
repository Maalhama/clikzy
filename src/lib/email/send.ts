import { resend, EMAIL_FROM } from './resend'
import { welcomeEmailHtml, winnerEmailHtml } from './templates'

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
