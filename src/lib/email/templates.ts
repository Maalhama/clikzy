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
