'use server'

import { Resend } from 'resend'

// Lazy initialization to avoid build errors without env vars
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CLEEKZY <noreply@cleekzy.com>'

export interface EmailResult {
  success: boolean
  error?: string
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<EmailResult> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Bienvenue sur CLEEKZY, ${username} ! 🎮`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 900; margin: 0;">
        <span style="color: #9B5CFF;">CLIK</span><span style="color: #FF4FD8;">ZY</span>
      </h1>
    </div>

    <!-- Main content -->
    <div style="background: linear-gradient(135deg, rgba(155, 92, 255, 0.1), rgba(255, 79, 216, 0.1)); border: 1px solid rgba(155, 92, 255, 0.3); border-radius: 16px; padding: 32px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">🎮</div>
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">
        Bienvenue ${username} !
      </h2>
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; margin: 0 0 24px 0;">
        Ton compte CLEEKZY est prêt
      </p>

      <!-- Bonus credits -->
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0 0 8px 0;">
          Cadeau de bienvenue
        </p>
        <p style="color: #00FF88; font-size: 36px; font-weight: 900; margin: 0;">
          10 crédits offerts
        </p>
      </div>

      <!-- How it works -->
      <div style="text-align: left; background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #9B5CFF; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
          Comment ça marche ?
        </p>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0 0 8px 0;">
          1. Choisis un lot qui te plaît
        </p>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0 0 8px 0;">
          2. Clique pour relancer le chrono
        </p>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0;">
          3. Si personne ne clique après toi, tu gagnes !
        </p>
      </div>

      <!-- Referral info -->
      <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;">
        Parraine tes amis et gagne des crédits bonus !
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://cleekzy.com/lobby" style="display: inline-block; background: linear-gradient(90deg, #9B5CFF, #FF4FD8); color: #ffffff; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 12px; font-size: 16px;">
        Commencer à jouer
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">
        © 2026 CLEEKZY - Le dernier clic gagne<br>
        <a href="https://cleekzy.com/legal" style="color: rgba(255, 255, 255, 0.4);">Mentions légales</a> •
        <a href="https://cleekzy.com/privacy" style="color: rgba(255, 255, 255, 0.4);">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' }
  }
}

/**
 * Send winner notification email
 */
export async function sendWinnerEmail(
  to: string,
  username: string,
  itemName: string,
  itemValue: number
): Promise<EmailResult> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎉 Félicitations ${username} ! Tu as gagné sur CLEEKZY`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 900; margin: 0;">
        <span style="color: #9B5CFF;">CLIK</span><span style="color: #FF4FD8;">ZY</span>
      </h1>
    </div>

    <!-- Main content -->
    <div style="background: linear-gradient(135deg, rgba(155, 92, 255, 0.1), rgba(255, 79, 216, 0.1)); border: 1px solid rgba(155, 92, 255, 0.3); border-radius: 16px; padding: 32px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">
        Félicitations ${username} !
      </h2>
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; margin: 0 0 24px 0;">
        Tu as remporté le dernier clic !
      </p>

      <!-- Prize -->
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #9B5CFF; font-size: 20px; margin: 0 0 8px 0;">
          ${itemName}
        </h3>
        <p style="color: #00FF88; font-size: 28px; font-weight: 900; margin: 0;">
          ${itemValue}€
        </p>
      </div>

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;">
        Connecte-toi à ton profil pour renseigner ton adresse de livraison.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://cleekzy.com/profile" style="display: inline-block; background: linear-gradient(90deg, #9B5CFF, #FF4FD8); color: #ffffff; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 12px; font-size: 16px;">
        Voir mon profil
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">
        © 2026 CLEEKZY - Le dernier clic gagne<br>
        <a href="https://cleekzy.com/legal" style="color: rgba(255, 255, 255, 0.4);">Mentions légales</a> •
        <a href="https://cleekzy.com/privacy" style="color: rgba(255, 255, 255, 0.4);">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send winner email:', error)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' }
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseEmail(
  to: string,
  username: string,
  credits: number,
  amount: number
): Promise<EmailResult> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `✅ Achat confirmé - ${credits} crédits ajoutés`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 900; margin: 0;">
        <span style="color: #9B5CFF;">CLIK</span><span style="color: #FF4FD8;">ZY</span>
      </h1>
    </div>

    <!-- Main content -->
    <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h2 style="color: #ffffff; font-size: 24px; margin: 0;">
          Merci ${username} !
        </h2>
      </div>

      <!-- Receipt -->
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: rgba(255, 255, 255, 0.6); padding: 8px 0; font-size: 14px;">Pack de crédits</td>
            <td style="color: #ffffff; padding: 8px 0; text-align: right; font-weight: 600;">${credits} crédits</td>
          </tr>
          <tr>
            <td style="color: rgba(255, 255, 255, 0.6); padding: 8px 0; font-size: 14px;">Montant</td>
            <td style="color: #9B5CFF; padding: 8px 0; text-align: right; font-weight: 700;">${amount.toFixed(2)}€</td>
          </tr>
        </table>
      </div>

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; text-align: center; margin: 24px 0 0 0;">
        Tes crédits ont été ajoutés à ton compte. Bonne chance ! 🍀
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://cleekzy.com/lobby" style="display: inline-block; background: linear-gradient(90deg, #9B5CFF, #FF4FD8); color: #ffffff; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 12px; font-size: 16px;">
        Jouer maintenant
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">
        © 2026 CLEEKZY - Le dernier clic gagne<br>
        <a href="https://cleekzy.com/legal" style="color: rgba(255, 255, 255, 0.4);">Mentions légales</a> •
        <a href="https://cleekzy.com/privacy" style="color: rgba(255, 255, 255, 0.4);">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send purchase email:', error)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' }
  }
}

/**
 * Send shipping confirmation email
 */
export async function sendShippingEmail(
  to: string,
  username: string,
  itemName: string,
  trackingNumber?: string
): Promise<EmailResult> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `📦 Ton lot a été expédié !`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 900; margin: 0;">
        <span style="color: #9B5CFF;">CLIK</span><span style="color: #FF4FD8;">ZY</span>
      </h1>
    </div>

    <!-- Main content -->
    <div style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(155, 92, 255, 0.1)); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 16px; padding: 32px; text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">📦</div>
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">
        Bonne nouvelle ${username} !
      </h2>
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; margin: 0 0 24px 0;">
        Ton lot a été expédié
      </p>

      <!-- Item -->
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #9B5CFF; font-size: 18px; font-weight: 600; margin: 0;">
          ${itemName}
        </p>
        ${trackingNumber ? `
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 16px 0 0 0;">
          N° de suivi : <strong style="color: #ffffff;">${trackingNumber}</strong>
        </p>
        ` : ''}
      </div>

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;">
        Livraison estimée : 5-7 jours ouvrés
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0;">
        © 2026 CLEEKZY - Le dernier clic gagne<br>
        <a href="https://cleekzy.com/legal" style="color: rgba(255, 255, 255, 0.4);">Mentions légales</a> •
        <a href="https://cleekzy.com/privacy" style="color: rgba(255, 255, 255, 0.4);">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send shipping email:', error)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' }
  }
}
