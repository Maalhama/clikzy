# Templates d'emails d'authentification Cleekzy (Supabase Auth)

À coller dans **Supabase → Authentication → Emails → Templates**, un template par onglet.
Branding Cleekzy (dark + néon violet/rose), français, sans emoji.
Les variables `{{ .ConfirmationURL }}` sont injectées par Supabase — **ne pas les modifier**.

Prérequis : custom SMTP Resend activé (sinon les mails partent du sender Supabase par défaut).

---

## 1. Confirm signup
**Subject** : `Confirme ton compte Cleekzy`

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:32px;font-weight:900;letter-spacing:-1px;"><span style="color:#9B5CFF;">CLEEK</span><span style="color:#FF4FD8;">ZY</span></span>
    </div>
    <div style="background:linear-gradient(135deg,rgba(155,92,255,0.1),rgba(255,79,216,0.1));border:1px solid rgba(155,92,255,0.3);border-radius:16px;padding:32px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px 0;text-align:center;">Bienvenue dans l'arène</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;text-align:center;">Confirme ton adresse pour activer ton compte et recevoir tes <strong style="color:#9B5CFF;">10 crédits gratuits</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#9B5CFF,#FF4FD8);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Confirmer mon compte</a>
      </div>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;margin:0;">Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>
    </div>
    <div style="text-align:center;margin-top:32px;"><p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">© 2026 Cleekzy. Le dernier clic gagne.</p></div>
  </div>
</body></html>
```

---

## 2. Magic Link
**Subject** : `Ta connexion à Cleekzy`

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:32px;font-weight:900;letter-spacing:-1px;"><span style="color:#9B5CFF;">CLEEK</span><span style="color:#FF4FD8;">ZY</span></span>
    </div>
    <div style="background:linear-gradient(135deg,rgba(155,92,255,0.1),rgba(255,79,216,0.1));border:1px solid rgba(155,92,255,0.3);border-radius:16px;padding:32px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px 0;text-align:center;">Connexion à Cleekzy</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;text-align:center;">Clique pour te connecter. Ce lien est valable une seule fois.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#9B5CFF,#FF4FD8);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Me connecter</a>
      </div>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;margin:0;">Si tu n'as pas demandé cette connexion, ignore cet email.</p>
    </div>
    <div style="text-align:center;margin-top:32px;"><p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">© 2026 Cleekzy. Le dernier clic gagne.</p></div>
  </div>
</body></html>
```

---

## 3. Reset Password
**Subject** : `Réinitialise ton mot de passe Cleekzy`

```html
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:32px;font-weight:900;letter-spacing:-1px;"><span style="color:#9B5CFF;">CLEEK</span><span style="color:#FF4FD8;">ZY</span></span>
    </div>
    <div style="background:linear-gradient(135deg,rgba(155,92,255,0.1),rgba(255,79,216,0.1));border:1px solid rgba(155,92,255,0.3);border-radius:16px;padding:32px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px 0;text-align:center;">Réinitialisation du mot de passe</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;text-align:center;">Clique pour choisir un nouveau mot de passe.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#9B5CFF,#FF4FD8);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Réinitialiser</a>
      </div>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;margin:0;">Si tu n'as pas demandé cette réinitialisation, ignore cet email — ton mot de passe reste inchangé.</p>
    </div>
    <div style="text-align:center;margin-top:32px;"><p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">© 2026 Cleekzy. Le dernier clic gagne.</p></div>
  </div>
</body></html>
```
