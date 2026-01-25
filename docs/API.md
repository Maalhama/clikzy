# Documentation API

Documentation des endpoints API de CLIKZY.

## Base URL

- **Développement** : `http://localhost:3000/api`
- **Production** : `https://clikzy.fr/api`

## Authentification

La plupart des endpoints nécessitent une session Supabase active. L'authentification est gérée automatiquement via les cookies de session.

Les endpoints cron nécessitent un header `Authorization: Bearer {CRON_SECRET}`.

---

## Endpoints publics

### Health Check

Vérifie l'état de l'API et de la base de données.

```
GET /api/health
```

**Réponse 200** (OK) :
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T12:00:00.000Z",
  "services": {
    "api": true,
    "database": true
  }
}
```

**Réponse 503** (Service Unavailable) :
```json
{
  "status": "error",
  "timestamp": "2026-01-25T12:00:00.000Z",
  "services": {
    "api": true,
    "database": false
  }
}
```

---

### Recent Clicks

Récupère les clics récents pour le feed temps réel.

```
GET /api/clicks/recent
```

**Query Parameters** :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `limit` | number | 20 | Nombre de clics (max: 50) |
| `game_id` | string | - | Filtrer par jeu |

**Exemple** :
```
GET /api/clicks/recent?limit=10&game_id=abc-123
```

**Réponse 200** :
```json
{
  "clicks": [
    {
      "id": "click-uuid",
      "username": "music.emma",
      "game_id": "game-uuid",
      "item_name": "iPhone 17 Pro",
      "is_bot": false,
      "timestamp": 1706180400000
    }
  ],
  "count": 10
}
```

---

## Endpoints de paiement (Stripe)

### Créer une session checkout

Crée une session Stripe pour l'achat de crédits.

```
POST /api/stripe/checkout
```

**Headers** :
- Session Supabase requise (cookie)

**Body** :
```json
{
  "packId": "starter" | "popular" | "premium"
}
```

**Packs disponibles** :

| ID | Crédits | Prix |
|----|---------|------|
| `starter` | 50 | 4,99 EUR |
| `popular` | 150 | 9,99 EUR |
| `premium` | 500 | 24,99 EUR |

**Réponse 200** :
```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxx"
}
```

**Réponse 401** :
```json
{
  "error": "Non authentifié"
}
```

**Réponse 400** :
```json
{
  "error": "Pack invalide"
}
```

---

### Webhook Stripe

Endpoint appelé par Stripe pour notifier les événements de paiement.

```
POST /api/stripe/webhook
```

**Headers** :
- `stripe-signature` : Signature Stripe

**Événements gérés** :

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Crédite l'utilisateur |
| `customer.subscription.created` | Active le VIP |
| `customer.subscription.updated` | Met à jour le VIP |
| `customer.subscription.deleted` | Désactive le VIP |

**Réponse 200** :
```json
{
  "received": true
}
```

---

## Endpoints Cron (protégés)

Tous les endpoints cron nécessitent le header :
```
Authorization: Bearer {CRON_SECRET}
```

### Bot Clicks

Gère le cycle de vie des jeux : activation, simulation bots, fin des parties.

```
GET /api/cron/bot-clicks
POST /api/cron/bot-clicks
```

**Actions effectuées** :
1. Active les jeux en attente (`waiting` → `active`)
2. Simule les clics des bots en phase normale
3. Maintient le timer en phase finale (bataille)
4. Termine les jeux quand timer = 0
5. Envoie les emails de victoire

**Réponse 200** :
```json
{
  "message": "Activated 2, checked 5 games, 1 ended",
  "activated": 2,
  "processed": 5,
  "ended": 1,
  "games": [
    {
      "gameId": "game-uuid",
      "action": "bot_click (music.emma)"
    }
  ]
}
```

---

### Activate Games

Active les jeux planifiés dont l'heure de démarrage est passée.

```
GET /api/cron/activate-games
```

**Réponse 200** :
```json
{
  "message": "Activated 3 games",
  "activated": 3,
  "games": ["game-1", "game-2", "game-3"]
}
```

---

### Create Rotation

Crée une nouvelle rotation de jeux à partir des items disponibles.

```
GET /api/cron/create-rotation
```

**Réponse 200** :
```json
{
  "message": "Created 6 games for rotation",
  "created": 6,
  "games": [
    {
      "id": "game-uuid",
      "itemName": "iPhone 17 Pro",
      "startTime": "2026-01-25T15:00:00.000Z"
    }
  ]
}
```

---

### Reset Credits

Remet les crédits à 10 pour les utilisateurs gratuits (ceux qui n'ont jamais acheté).

```
GET /api/cron/reset-credits
```

**Logique** :
- Ne touche pas aux utilisateurs avec `has_purchased_credits = true`
- Reset à 10 crédits les autres utilisateurs

**Réponse 200** :
```json
{
  "message": "Reset credits for 150 free users",
  "reset": 150
}
```

---

## Server Actions

Les actions principales sont des Server Actions Next.js (pas des routes API).

### Game Actions (`src/actions/game.ts`)

| Action | Description |
|--------|-------------|
| `getActiveGames()` | Liste les jeux actifs |
| `getGame(id)` | Détails d'un jeu |
| `click(gameId)` | Enregistre un clic |
| `joinGame(gameId)` | Rejoindre un jeu |

### Auth Actions (`src/actions/auth.ts`)

| Action | Description |
|--------|-------------|
| `signInWithMagicLink(email)` | Connexion par email |
| `signInWithOAuth(provider)` | Connexion OAuth |
| `signOut()` | Déconnexion |
| `updateProfile(data)` | Mise à jour profil |

### Credit Actions (`src/actions/credits.ts`)

| Action | Description |
|--------|-------------|
| `getCredits()` | Solde actuel |
| `useCredits(amount)` | Déduire des crédits |

---

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/api/clicks/recent` | 60 req/min |
| `/api/stripe/checkout` | 10 req/min |
| Server Actions (click) | 1 req/sec par user |

---

## Exemples d'intégration

### Fetch des clics récents

```typescript
const response = await fetch('/api/clicks/recent?limit=20')
const data = await response.json()

data.clicks.forEach(click => {
  console.log(`${click.username} a cliqué sur ${click.item_name}`)
})
```

### Créer une session de paiement

```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ packId: 'popular' }),
})

const { url } = await response.json()
window.location.href = url
```

### Vérifier la santé de l'API

```typescript
const response = await fetch('/api/health')
const health = await response.json()

if (health.status === 'ok') {
  console.log('API opérationnelle')
} else {
  console.error('Problème détecté:', health.services)
}
```
