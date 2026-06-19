// Email templates for Cleekzy

export function welcomeEmailHtml(username: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">
        <span style="color: #9B5CFF;">CLEEK</span><span style="color: #FF4FD8;">ZY</span>
      </span>
    </div>
    
    <!-- Card -->
    <div style="background: linear-gradient(135deg, rgba(155, 92, 255, 0.1), rgba(255, 79, 216, 0.1)); border: 1px solid rgba(155, 92, 255, 0.3); border-radius: 16px; padding: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
        Bienvenue ${username} ! 🎉
      </h1>
      
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Ton compte Cleekzy est prêt. Tu as reçu <strong style="color: #9B5CFF;">10 crédits gratuits</strong> pour commencer à jouer !
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://cleekzy.com/lobby" style="display: inline-block; background: linear-gradient(135deg, #9B5CFF, #FF4FD8); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Jouer maintenant →
        </a>
      </div>
      
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px; margin-top: 24px;">
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; text-align: center; margin: 0;">
          💡 Astuce : Joue aux <a href="https://cleekzy.com/mini-games" style="color: #9B5CFF;">mini-jeux gratuits</a> pour gagner encore plus de crédits !
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: rgba(255, 255, 255, 0.3); font-size: 12px; margin: 0;">
        © 2026 Cleekzy. Le dernier clic gagne.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function winnerEmailHtml(username: string, itemName: string, itemValue: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">
        <span style="color: #9B5CFF;">CLEEK</span><span style="color: #FF4FD8;">ZY</span>
      </span>
    </div>
    
    <!-- Card -->
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 64px;">🏆</span>
      </div>
      
      <h1 style="color: #10B981; font-size: 28px; margin: 0 0 16px 0; text-align: center;">
        Félicitations ${username} !
      </h1>
      
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 18px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        Tu as remporté le lot :
      </p>
      
      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">
          ${itemName}
        </p>
        <p style="color: #10B981; font-size: 28px; font-weight: 800; margin: 0;">
          ${itemValue}€
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://cleekzy.com/profile" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Voir mes gains →
        </a>
      </div>

      <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px; margin-top: 24px;">
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; text-align: center; margin: 0;">
          📦 Renseigne ton adresse de livraison dans ton profil pour recevoir ton lot !
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: rgba(255, 255, 255, 0.3); font-size: 12px; margin: 0;">
        © 2026 Cleekzy. Le dernier clic gagne.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Base commune : logo + carte (couleur d'accent) + footer.
function shell(accentRgba: string, accentBorder: string, inner: string, unsubscribeUrl?: string): string {
  const unsub = unsubscribeUrl
    ? `<p style="color: rgba(255, 255, 255, 0.25); font-size: 11px; margin: 8px 0 0;">
        Tu reçois cet email parce que tu joues sur Cleekzy. <a href="${unsubscribeUrl}" style="color: rgba(255, 255, 255, 0.4); text-decoration: underline;">Se désabonner de ces rappels</a>.
      </p>`
    : ''
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">
        <span style="color: #9B5CFF;">CLEEK</span><span style="color: #FF4FD8;">ZY</span>
      </span>
    </div>
    <div style="background: ${accentRgba}; border: 1px solid ${accentBorder}; border-radius: 16px; padding: 32px;">
      ${inner}
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: rgba(255, 255, 255, 0.3); font-size: 12px; margin: 0;">
        © 2026 Cleekzy. Le dernier clic gagne.
      </p>
      ${unsub}
    </div>
  </div>
</body>
</html>
  `.trim()
}

function cta(href: string, label: string, gradient: string): string {
  return `<div style="text-align: center; margin: 32px 0 8px 0;">
    <a href="${href}" style="display: inline-block; background: ${gradient}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">${label}</a>
  </div>`
}

// Expédition du lot — avec numéro de suivi
export function shippingEmailHtml(username: string, itemName: string, trackingNumber: string, carrier?: string): string {
  const carrierLine = carrier ? `<span style="color: rgba(255,255,255,0.55);">${carrier} · </span>` : ''
  return shell(
    'linear-gradient(135deg, rgba(60, 203, 255, 0.1), rgba(27, 110, 140, 0.1))',
    'rgba(60, 203, 255, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">📦</span></div>
    <h1 style="color: #3CCBFF; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Ton lot est en route, ${username} !</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Bonne nouvelle : <strong style="color:#ffffff;">${itemName}</strong> vient d'être expédié.
    </p>
    <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 8px;">
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Numéro de suivi</p>
      <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 1px;">${carrierLine}${trackingNumber}</p>
    </div>
    ${cta('https://cleekzy.com/profile', 'Voir le suivi →', 'linear-gradient(135deg, #3CCBFF, #1B6E8C)')}
    `,
  )
}

// Échec de paiement V.I.P — relance (dunning)
export function vipPaymentFailedEmailHtml(username: string): string {
  return shell(
    'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(234, 179, 8, 0.08))',
    'rgba(255, 184, 0, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">⚠️</span></div>
    <h1 style="color: #FFB800; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Ton paiement V.I.P a échoué</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
      Salut ${username}, on n'a pas pu débiter ta carte pour ton abonnement V.I.P.
      Tes avantages restent actifs encore quelques jours — mets à jour ton moyen de paiement pour ne rien perdre.
    </p>
    ${cta('https://cleekzy.com/vip', 'Mettre à jour ma carte →', 'linear-gradient(135deg, #FFB800, #FF8C00)')}
    `,
  )
}

// Rappel série (streak) en danger
export function streakReminderEmailHtml(username: string, streakDays: number, unsubscribeUrl?: string): string {
  return shell(
    'linear-gradient(135deg, rgba(255, 122, 26, 0.1), rgba(194, 65, 12, 0.08))',
    'rgba(255, 122, 26, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">🔥</span></div>
    <h1 style="color: #FF7A1A; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Ta série de ${streakDays} jours est en jeu !</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
      ${username}, tu n'as pas encore réclamé ton bonus du jour. Passe avant minuit pour garder ta série et ton multiplicateur de récompenses.
    </p>
    ${cta('https://cleekzy.com/lobby', 'Garder ma série →', 'linear-gradient(135deg, #FF7A1A, #C2410C)')}
    `,
    unsubscribeUrl,
  )
}

// Conversion d'une jauge abandonnée en avoir crédit (transactionnel : info sur le solde)
export function gaugeConvertedEmailHtml(username: string, itemName: string, credits: number): string {
  return shell(
    'linear-gradient(135deg, rgba(155, 92, 255, 0.1), rgba(255, 79, 216, 0.08))',
    'rgba(155, 92, 255, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">💜</span></div>
    <h1 style="color: #9B5CFF; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Ta progression est devenue des crédits</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
      ${username}, ta jauge sur <strong style="color:#ffffff;">${itemName}</strong> était inactive depuis un moment. Rien n'est perdu chez Cleekzy : on l'a convertie en <strong style="color:#9B5CFF;">${credits} crédits</strong> utilisables sur le lot de ton choix.
    </p>
    ${cta('https://cleekzy.com/lobby', 'Utiliser mes crédits →', 'linear-gradient(135deg, #9B5CFF, #FF4FD8)')}
    `,
  )
}

// Relance : gagnant qui n'a pas renseigné son adresse de livraison (transactionnel)
export function addressReminderEmailHtml(username: string, itemName: string): string {
  return shell(
    'linear-gradient(135deg, rgba(60, 203, 255, 0.1), rgba(27, 110, 140, 0.08))',
    'rgba(60, 203, 255, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">🎁</span></div>
    <h1 style="color: #3CCBFF; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Ton lot t'attend, ${username} !</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
      Tu as remporté <strong style="color:#ffffff;">${itemName}</strong> mais on n'a pas encore ton adresse de livraison. Renseigne-la pour qu'on te l'envoie au plus vite.
    </p>
    ${cta('https://cleekzy.com/profile', 'Renseigner mon adresse →', 'linear-gradient(135deg, #3CCBFF, #1B6E8C)')}
    `,
  )
}

// Relance panier abandonné (session de paiement expirée sans achat) — email marketing :
// porte un lien de désabonnement.
export function checkoutReminderEmailHtml(username: string, unsubscribeUrl?: string): string {
  return shell(
    'linear-gradient(135deg, rgba(155, 92, 255, 0.1), rgba(255, 79, 216, 0.08))',
    'rgba(155, 92, 255, 0.3)',
    `
    <div style="text-align: center; margin-bottom: 16px;"><span style="font-size: 56px;">🛒</span></div>
    <h1 style="color: #9B5CFF; font-size: 26px; margin: 0 0 12px 0; text-align: center;">Tu y étais presque, ${username} !</h1>
    <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
      Ta commande n'a pas été finalisée. Tes crédits t'attendent pour repartir à l'assaut des lots.
    </p>
    ${cta('https://cleekzy.com/lobby', 'Reprendre →', 'linear-gradient(135deg, #9B5CFF, #FF4FD8)')}
    `,
    unsubscribeUrl,
  )
}
