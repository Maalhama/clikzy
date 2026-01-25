# API Documentation - CLEEKZY

Documentation complète des endpoints API et Server Actions.

## 📋 Table des Matières

- [Server Actions](#server-actions)
  - [Game Actions](#game-actions)
  - [Credit Actions](#credit-actions)
  - [Referral Actions](#referral-actions)
  - [Badge Actions](#badge-actions)
  - [Mini-Game Actions](#mini-game-actions)
- [API Routes](#api-routes)
  - [Cron Jobs](#cron-jobs)
  - [Stripe Webhooks](#stripe-webhooks)
  - [Health Check](#health-check)

---

## Server Actions

Les Server Actions sont des fonctions côté serveur appelées depuis les composants React.

### Game Actions

#### `clickGame(gameId: string)`

Effectue un clic sur une partie en cours.

**Fichier** : `src/actions/game.ts`

**Paramètres** :
- `gameId` (string) : ID de la partie

**Retour** :
```typescript
{
  success: boolean
  data?: {
    newEndTime?: number      // Nouveau timestamp de fin (si phase finale)
    newBadges?: Badge[]      // Nouveaux badges obtenus
  }
  error?: string
}
```

**Comportement** :
1. Vérifie l'authentification
2. Vérifie les crédits disponibles (daily + earned)
3. Détecte la fraude (rate limiting, patterns suspects)
4. Déduit 1 crédit (daily d'abord, puis earned)
5. Enregistre le clic dans la DB
6. Reset le timer à 90s si < 1min30 restant
7. Met à jour les statistiques du joueur
8. Vérifie les nouveaux badges

**Erreurs** :
- `"Non authentifié"` : Utilisateur non connecté
- `"Crédits insuffisants"` : Plus de crédits disponibles
- `"Partie non trouvée"` : Game ID invalide
- `"Cette partie n'accepte plus de clics"` : Partie terminée
- `"Action bloquée pour raison de sécurité"` : Fraude détectée

**Exemple** :
```typescript
const result = await clickGame('game-123')

if (!result.success) {
  toast.error(result.error)
  return
}

if (result.data?.newBadges?.length) {
  toast.success(`Nouveau badge obtenu : ${result.data.newBadges[0].name}`)
}
```

#### `getActiveGames()`

Récupère toutes les parties actives.

**Retour** :
```typescript
{
  success: boolean
  data?: GameWithItem[]
  error?: string
}

type GameWithItem = Game & { item: Item }
```

#### `endGame(gameId: string)`

Termine une partie et désigne le gagnant (CRON uniquement).

---

### Credit Actions

#### `getUserCredits()`

Récupère le solde de crédits de l'utilisateur.

**Fichier** : `src/actions/credits.ts`

**Retour** :
```typescript
{
  dailyCredits: number       // Crédits gratuits (reset quotidien)
  earnedCredits: number      // Crédits gagnés (permanent)
  totalCredits: number       // dailyCredits + earnedCredits
  hasPurchased: boolean      // Si l'utilisateur a acheté des crédits
  isVip: boolean            // Si l'utilisateur est VIP
}
```

**Exemple** :
```typescript
const credits = await getUserCredits()
console.log(`Tu as ${credits.totalCredits} crédits`)
```

#### `purchaseCredits(packageId: string)`

Achète un pack de crédits via Stripe.

**Paramètres** :
- `packageId` : `"pack_50"`, `"pack_100"`, `"pack_250"`

**Retour** :
```typescript
{
  success: boolean
  data?: { checkoutUrl: string }
  error?: string
}
```

---

### Referral Actions

#### `applyReferralCode(code: string)`

Applique un code de parrainage (1 fois par utilisateur).

**Fichier** : `src/actions/referral.ts`

**Paramètres** :
- `code` (string) : Code de parrainage (4+ caractères)

**Retour** :
```typescript
{
  success: boolean
  creditsAwarded?: number   // 10 crédits ajoutés au parrain
  error?: string
}
```

**Erreurs** :
- `"Code invalide"` : Code trop court
- `"Non authentifié"` : Utilisateur non connecté
- `"Tu as déjà utilisé un code de parrainage"` : Code déjà appliqué
- `"Tu ne peux pas utiliser ton propre code"` : Code = propre code
- `"Code de parrainage introuvable"` : Code inexistant

**Comportement** :
- Ajoute 10 crédits à `earned_credits` du parrain (permanent)
- Incrémente `referral_count` du parrain
- Enregistre `referred_by` sur le filleul

**Exemple** :
```typescript
const result = await applyReferralCode('ABC123')

if (result.success) {
  toast.success('Code de parrainage appliqué !')
}
```

#### `getReferralStats()`

Récupère les statistiques de parrainage de l'utilisateur.

**Retour** :
```typescript
{
  referralCode: string | null
  referralCount: number
  creditsEarned: number
  referredBy: string | null
}
```

#### `getReferralLink()`

Génère le lien de parrainage personnalisé.

**Retour** : `string | null`

**Exemple** : `"https://cleekzy.com/register?ref=ABC123"`

---

### Badge Actions

#### `checkAndAwardBadges()`

Vérifie et attribue les badges au joueur.

**Fichier** : `src/actions/badges.ts`

**Retour** :
```typescript
{
  newBadges: Badge[]
  allBadges: Badge[]
}

type Badge = {
  id: string
  name: string
  description: string
  icon: string
  type: 'clicks' | 'wins' | 'referrals' | 'mini_games' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  requirement: number
  credits_reward: number
  awarded_at?: string
}
```

**Badges disponibles** :
- **Clicks** : 10, 50, 100, 500, 1000 clics
- **Wins** : 1, 5, 10, 25 victoires
- **Referrals** : 1, 5, 10 parrainages
- **Mini-Games** : 10, 50 parties jouées

**Exemple** :
```typescript
const { newBadges } = await checkAndAwardBadges()

if (newBadges.length > 0) {
  newBadges.forEach(badge => {
    toast.success(`Nouveau badge : ${badge.name} (+${badge.credits_reward} crédits)`)
  })
}
```

---

### Mini-Game Actions

#### `playMiniGame(gameType: string)`

Joue à un mini-jeu (1 partie gratuite/jour, puis payant).

**Fichier** : `src/actions/miniGames.ts`

**Paramètres** :
- `gameType` : `"slots"`, `"dice"`, `"coin_flip"`, `"wheel"`, `"scratch"`, `"number_guess"`

**Retour** :
```typescript
{
  success: boolean
  data?: {
    won: boolean
    amount: number           // Crédits gagnés/perdus
    result: unknown         // Résultat du jeu (dés, roue, etc.)
  }
  error?: string
}
```

**Erreurs** :
- `"Non authentifié"`
- `"Type de mini-jeu invalide"`
- `"Crédits insuffisants"` : Si pas de partie gratuite et pas de crédits
- `"Limite quotidienne atteinte"` : Plus de parties gratuites

---

## API Routes

### Cron Jobs

Toutes les routes cron nécessitent l'en-tête :
```
Authorization: Bearer <CRON_SECRET>
```

#### `POST /api/cron/bot-clicks`

**Fréquence** : Toutes les 1 minute

**Fonction** : Fait cliquer les bots pour maintenir la bataille en phase finale

**Comportement** :
- Récupère les parties en `final_phase`
- Vérifie si la bataille dure depuis 30-119 minutes
- Fait cliquer 1-3 bots aléatoires par partie
- Reset le timer à 90 secondes

**Réponse** :
```json
{
  "success": true,
  "processedGames": 3,
  "totalClicks": 5
}
```

#### `POST /api/cron/activate-games`

**Fréquence** : Toutes les 1 minute

**Fonction** : Active les parties en attente quand assez de joueurs

**Comportement** :
- Récupère les parties `waiting`
- Active celles avec ≥2 joueurs
- Définit `end_time` à maintenant + 24h

#### `POST /api/cron/create-rotation`

**Fréquence** : Toutes les 3 heures (:45 des heures 23,2,5,8,11,14,17,20)

**Fonction** : Crée une nouvelle rotation de parties

**Comportement** :
- Récupère les 8 items les plus populaires
- Crée une partie `waiting` pour chaque
- Garantit la variété des lots

#### `POST /api/cron/reset-credits`

**Fréquence** : Tous les jours à minuit UTC

**Fonction** : Reset les crédits quotidiens

**Comportement** :
- Reset `credits` à 10 pour les utilisateurs gratuits
- Reset `credits` à 10 pour les VIP (ils ont aussi +10 bonus à récolter)
- Ignore les utilisateurs ayant acheté des crédits (`has_purchased_credits = true`)

---

### Stripe Webhooks

#### `POST /api/stripe/webhook`

**Fonction** : Reçoit les événements Stripe

**Événements gérés** :
- `checkout.session.completed` : Ajoute les crédits achetés
- `customer.subscription.created` : Active le statut VIP
- `customer.subscription.deleted` : Désactive le statut VIP

**Sécurité** :
- Signature Stripe validée
- Replay attack protection

---

### Health Check

#### `GET /api/health`

**Fonction** : Vérifie l'état du service

**Réponse** :
```json
{
  "status": "ok",
  "timestamp": 1706123456789,
  "uptime": 123456
}
```

---

## Rate Limiting

Toutes les routes API sont rate-limitées :

| Type | Limite | Fenêtre |
|------|--------|---------|
| API générale | 60 requêtes | 1 minute |
| Paiement Stripe | 10 requêtes | 1 minute |
| Cron jobs | 10 requêtes | 1 minute |

**Header de réponse** (si limite dépassée) :
```
HTTP 429 Too Many Requests
Retry-After: 45
X-RateLimit-Remaining: 0
```

---

## Authentification

Toutes les Server Actions utilisent **Supabase Auth** :

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return { success: false, error: 'Non authentifié' }
}
```

Les API routes cron utilisent un **Bearer token** :
```typescript
const authHeader = request.headers.get('Authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## Codes d'Erreur

| Code | Signification |
|------|---------------|
| 400 | Bad Request - Paramètres invalides |
| 401 | Unauthorized - Non authentifié |
| 403 | Forbidden - Pas les permissions |
| 404 | Not Found - Ressource introuvable |
| 429 | Too Many Requests - Rate limit dépassé |
| 500 | Internal Server Error - Erreur serveur |

---

## Exemple Complet

```typescript
'use client'

import { useState } from 'react'
import { clickGame } from '@/actions/game'
import { getUserCredits } from '@/actions/credits'

export default function GameButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    // Vérifier les crédits
    const credits = await getUserCredits()
    if (credits.totalCredits < 1) {
      toast.error('Plus de crédits')
      setLoading(false)
      return
    }

    // Cliquer
    const result = await clickGame(gameId)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Clic enregistré !')

      // Afficher les nouveaux badges
      if (result.data?.newBadges?.length) {
        result.data.newBadges.forEach(badge => {
          toast.success(`Badge obtenu : ${badge.name}`)
        })
      }
    }

    setLoading(false)
  }

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Chargement...' : 'Cliquer'}
    </button>
  )
}
```

---

Pour plus d'informations, voir le code source dans `src/actions/` et `src/app/api/`.
