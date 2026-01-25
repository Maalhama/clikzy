# Test Stripe - Guide Complet

## ✅ Vérifications Préalables

### 1. Variables d'Environnement Vercel

Vérifie sur Vercel que ces variables sont configurées :

```bash
# Stripe Core (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_live_xxx ou sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx ou pk_test_xxx

# Stripe Price IDs (NON UTILISÉS - voir note ci-dessous)
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_POPULAR=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
```

> **Note :** Les variables `STRIPE_PRICE_*` ne sont PAS utilisées dans le code actuel.
> Le code utilise `price_data` pour créer des prix dynamiques au lieu de Price IDs pré-configurés.
> Tu peux les retirer de Vercel si tu veux nettoyer.

### 2. Configuration Webhook Stripe

1. Va sur https://dashboard.stripe.com/test/webhooks
2. Créer un endpoint webhook pointant vers :
   ```
   https://cleekzy.com/api/stripe/webhook
   ```
3. Sélectionner les événements à écouter :
   - `checkout.session.completed` ✅ (paiement de crédits)
   - `customer.subscription.created` ✅ (nouvel abonnement VIP)
   - `customer.subscription.updated` ✅ (renouvellement VIP)
   - `customer.subscription.deleted` ✅ (annulation VIP)

4. Copier le `STRIPE_WEBHOOK_SECRET` (commence par `whsec_`)
5. L'ajouter dans Vercel

---

## 🧪 Tests à Effectuer

### Test 1 : Achat de Crédits (Checkout)

#### Étape 1 : Accéder à la boutique
1. Aller sur https://cleekzy.com/shop
2. Vérifier que les 3 packs sont affichés :
   - **Boost** : 50 crédits - 4.99€
   - **Turbo** : 150 crédits - 9.99€ (Populaire)
   - **Ultra** : 500 crédits - 24.99€

#### Étape 2 : Créer une session de paiement
1. Cliquer sur "Acheter" pour un pack
2. Vérifier la redirection vers Stripe Checkout
3. Vérifier que les infos sont correctes :
   - Montant correct
   - Description : "Pack X - Y crédits pour jouer"
   - Email pré-rempli

#### Étape 3 : Tester le paiement (Mode Test)
Utiliser une carte de test Stripe :
```
Numéro : 4242 4242 4242 4242
Expiration : n'importe quelle date future (ex: 12/34)
CVC : n'importe quel 3 chiffres (ex: 123)
```

#### Étape 4 : Vérifier la redirection
Après paiement, tu devrais être redirigé vers :
```
https://cleekzy.com/lobby?payment=success&credits=50
```

#### Étape 5 : Vérifier les crédits en BDD
```sql
SELECT id, username, credits, has_purchased_credits, earned_credits
FROM profiles
WHERE id = '[USER_ID]';
```

**Résultat attendu :**
- `credits` : ancien solde + crédits achetés
- `has_purchased_credits` : `true`
- `earned_credits` : inchangé

---

### Test 2 : Webhook de Paiement

#### Vérifier les logs Vercel
1. Aller sur Vercel > Projet Cleekzy > Functions
2. Trouver `/api/stripe/webhook`
3. Vérifier qu'il y a un appel récent avec :
   - Status : 200 OK
   - Event : `checkout.session.completed`
   - Logs : "Successfully credited X to user Y"

#### Tester l'échec de signature
1. Utiliser curl pour tester une signature invalide :
```bash
curl -X POST https://cleekzy.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid" \
  -d '{"type": "checkout.session.completed"}'
```

**Résultat attendu :** 400 Bad Request - "Invalid signature"

---

### Test 3 : Abonnement VIP

#### Étape 1 : Souscrire au VIP
1. Aller sur https://cleekzy.com/lobby
2. Cliquer sur "Devenir V.I.P" (ou équivalent)
3. Vérifier la redirection vers Stripe Checkout (mode subscription)
4. Vérifier le montant : **9.99€/mois**

#### Étape 2 : Tester le paiement
Utiliser la même carte de test :
```
4242 4242 4242 4242
```

#### Étape 3 : Vérifier le statut VIP
```sql
SELECT id, username, is_vip, vip_subscription_id, vip_expires_at
FROM profiles
WHERE id = '[USER_ID]';
```

**Résultat attendu :**
- `is_vip` : `true`
- `vip_subscription_id` : ID de l'abonnement Stripe (commence par `sub_`)
- `vip_expires_at` : Date de fin de période (1 mois)

#### Étape 4 : Tester l'annulation
1. Aller sur Stripe Dashboard > Subscriptions
2. Annuler l'abonnement du user
3. Vérifier dans la BDD que :
   - `is_vip` : `false`
   - `vip_subscription_id` : `null`
   - `vip_expires_at` : `null`

---

### Test 4 : Cas Limites

#### Test 4.1 : Utilisateur non connecté
1. Déconnecter l'utilisateur
2. Aller sur /shop
3. Cliquer sur "Acheter"

**Résultat attendu :** Erreur "Non authentifié" (401)

#### Test 4.2 : Pack invalide
```bash
curl -X POST https://cleekzy.com/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: [AUTH_COOKIE]" \
  -d '{"packId": "invalid"}'
```

**Résultat attendu :** 400 Bad Request - "Pack invalide"

#### Test 4.3 : Double abonnement VIP
1. Être déjà VIP actif
2. Essayer de souscrire à nouveau

**Résultat attendu :** Erreur "Vous êtes déjà abonné V.I.P"

#### Test 4.4 : Webhook sans signature
```bash
curl -X POST https://cleekzy.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "checkout.session.completed"}'
```

**Résultat attendu :** 400 Bad Request - "Missing signature"

---

## 🔍 Points de Vérification Spécifiques

### Vérification 1 : Les crédits ne sont pas reset après achat

Tester le workflow suivant :
1. Acheter 50 crédits
2. Vérifier `has_purchased_credits = true`
3. Attendre le lendemain (ou tester le cron reset)
4. Vérifier que les crédits achetés sont **toujours là**

```sql
-- Le cron ne devrait PAS toucher aux utilisateurs avec has_purchased_credits = true
SELECT credits FROM profiles WHERE id = '[USER_ID]';
```

### Vérification 2 : Les crédits s'ajoutent correctement

Test avec achat multiple :
1. Solde initial : 10 crédits
2. Acheter 50 crédits
3. Solde attendu : 60 crédits
4. Acheter encore 150 crédits
5. Solde attendu : 210 crédits

### Vérification 3 : Le webhook est bien appelé

Vérifier dans les logs Stripe :
1. Dashboard Stripe > Developers > Webhooks
2. Cliquer sur ton endpoint
3. Vérifier les "Recent deliveries"
4. Status devrait être : **200 OK**

Si status 500 ou 400 :
- Lire les logs Vercel
- Vérifier `STRIPE_WEBHOOK_SECRET`
- Vérifier les permissions Supabase (Service Role Key)

---

## 🐛 Debugging

### Problème : Les crédits n'arrivent pas après paiement

**Causes possibles :**
1. Webhook pas configuré sur Stripe
2. `STRIPE_WEBHOOK_SECRET` incorrect
3. Événement `checkout.session.completed` non écouté
4. Erreur dans les logs Vercel

**Solution :**
1. Vérifier les logs Vercel pour `/api/stripe/webhook`
2. Vérifier les logs Stripe > Webhooks > Recent deliveries
3. Tester le webhook manuellement via Stripe CLI :
```bash
stripe trigger checkout.session.completed
```

### Problème : Erreur "Service de paiement non configuré"

**Cause :** `STRIPE_SECRET_KEY` manquante ou invalide

**Solution :**
1. Vérifier que la variable existe sur Vercel
2. Vérifier qu'elle commence par `sk_live_` ou `sk_test_`
3. Redéployer après l'ajout

### Problème : Le webhook retourne 500

**Causes possibles :**
1. `SUPABASE_SERVICE_ROLE_KEY` incorrecte
2. Permissions RLS Supabase
3. User introuvable en BDD

**Solution :**
1. Vérifier les logs Vercel pour voir l'erreur exacte
2. Vérifier que le user existe en BDD
3. Vérifier les permissions Supabase

---

## 📋 Checklist de Test Complète

### Configuration
- [ ] `STRIPE_SECRET_KEY` configurée sur Vercel
- [ ] `STRIPE_WEBHOOK_SECRET` configurée sur Vercel
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurée sur Vercel
- [ ] Webhook configuré sur Stripe Dashboard
- [ ] Événements webhook corrects (checkout.session.completed, etc.)

### Tests Fonctionnels
- [ ] Affichage de la boutique avec les 3 packs
- [ ] Création de session checkout
- [ ] Paiement test réussi
- [ ] Redirection vers /lobby?payment=success
- [ ] Crédits ajoutés en BDD
- [ ] `has_purchased_credits = true` en BDD
- [ ] Logs webhook 200 OK

### Tests VIP
- [ ] Création d'abonnement VIP
- [ ] Paiement abonnement réussi
- [ ] `is_vip = true` en BDD
- [ ] `vip_subscription_id` renseigné
- [ ] `vip_expires_at` correct (1 mois)
- [ ] Annulation d'abonnement fonctionne

### Tests de Sécurité
- [ ] Webhook refuse les signatures invalides
- [ ] Webhook refuse les requêtes sans signature
- [ ] Action checkout refuse les utilisateurs non connectés
- [ ] Action checkout refuse les packId invalides
- [ ] VIP refuse les doubles abonnements

### Tests de Persistance
- [ ] Les crédits achetés ne sont pas reset le lendemain
- [ ] Les achats multiples s'additionnent correctement
- [ ] Le flag `has_purchased_credits` persiste

---

## 🎯 Résultat Attendu Final

Si tous les tests passent, tu devrais avoir :

1. ✅ Possibilité d'acheter des crédits depuis /shop
2. ✅ Paiement sécurisé via Stripe
3. ✅ Crédits ajoutés instantanément après paiement
4. ✅ Crédits achetés jamais supprimés
5. ✅ Abonnement VIP fonctionnel
6. ✅ Webhook sécurisé et robuste
7. ✅ Logs clairs pour le debugging

---

## 💡 Notes Importantes

### Prix Dynamiques vs Price IDs

**Actuellement :** Le code utilise `price_data` pour créer des prix à la volée.

**Avantages :**
- Flexibilité : tu peux changer les prix dans le code sans toucher à Stripe
- Pas besoin de créer des produits dans Stripe Dashboard

**Inconvénients :**
- Pas de suivi centralisé dans Stripe Dashboard
- Pas de gestion de TVA automatique par produit

**Alternative (si besoin) :**
Créer des Price IDs dans Stripe et les utiliser :
```typescript
line_items: [
  {
    price: pack.priceId, // au lieu de price_data
    quantity: 1,
  },
]
```

### Mode Test vs Production

**Test :**
- Clés commencent par `sk_test_`, `pk_test_`, `whsec_test_`
- Utilise des cartes de test
- Pas de vrais paiements

**Production :**
- Clés commencent par `sk_live_`, `pk_live_`, `whsec_`
- Vrais paiements
- TOUJOURS tester en mode test AVANT de passer en prod

### Monitoring

Pour suivre les paiements en production :
1. Stripe Dashboard > Payments (voir tous les paiements)
2. Stripe Dashboard > Webhooks (voir les événements reçus)
3. Vercel Logs (voir les logs de l'API webhook)
4. Supabase (vérifier les crédits en BDD)
