# CLIKZY

Plateforme d'enchères temps réel gamifiée. Le dernier joueur à cliquer avant la fin du timer remporte le produit.

## Fonctionnalités

- **Jeu temps réel** : Timer synchronisé, phase finale intense (< 1 min = reset à chaque clic)
- **Système de crédits** : 1 clic = 1 crédit, achat via Stripe
- **Abonnement VIP** : Bonus quotidiens, badges exclusifs, accès premium
- **Mini-jeux** : Slots, Dice, CoinFlip pour gagner des crédits bonus
- **Bots intelligents** : Simulation d'activité avec pseudos réalistes
- **Auth flexible** : Magic Link, Google, GitHub

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Paiements | Stripe |
| Emails | Resend |
| Monitoring | Sentry |
| Déploiement | Vercel |

## Installation

### Prérequis

- Node.js 18+
- npm ou pnpm
- Compte Supabase
- Compte Stripe (pour les paiements)

### 1. Cloner le projet

```bash
git clone https://github.com/Maalhama/clikzy.git
cd clikzy
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir les variables dans `.env.local` :

```env
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (pour les paiements)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Resend (pour les emails)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=CLIKZY <noreply@clikzy.fr>

# Cron (pour cron-job.org)
CRON_SECRET=your-secret

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run dev:mobile` | Serveur accessible sur le réseau local |
| `npm run build` | Build de production |
| `npm run start` | Lancer le build de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run type-check` | Vérifier les types TypeScript |
| `npm run test` | Tests unitaires (watch mode) |
| `npm run test:run` | Tests unitaires (une fois) |
| `npm run test:coverage` | Tests avec couverture |
| `npm run test:e2e` | Tests end-to-end Playwright |
| `npm run seed:items` | Peupler la base avec des produits |

## Architecture

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── (auth)/            # Pages d'authentification
│   ├── (main)/            # Pages protégées (lobby, game, profile)
│   ├── (legal)/           # Pages légales (CGU, CGV, etc.)
│   └── api/               # Routes API
│
├── actions/               # Server Actions
├── components/            # Composants React
├── hooks/                 # Hooks personnalisés
├── lib/                   # Utilitaires et configurations
└── types/                 # Types TypeScript
```

## Base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (crédits, VIP, stats) |
| `items` | Produits à gagner |
| `games` | Parties en cours et terminées |
| `clicks` | Historique des clics |
| `winners` | Historique des gagnants |

### Règles du jeu

1. **Phase normale** (> 1 min) : Les clics sont enregistrés mais n'affectent pas le timer
2. **Phase finale** (< 1 min) : Chaque clic remet le timer à 1 min 30
3. **Fin** : Timer = 0, le dernier clic gagne
4. **Restrictions** : Pas de double clic consécutif, cooldown de 1 seconde

## Crons

Les crons sont configurés sur [cron-job.org](https://cron-job.org) :

| Endpoint | Fréquence | Description |
|----------|-----------|-------------|
| `/api/cron/bot-clicks` | 1 min | Simulation bots + fin des jeux |
| `/api/cron/activate-games` | 1 min | Activation des jeux planifiés |
| `/api/cron/create-rotation` | Toutes les 3h | Création de nouveaux jeux |
| `/api/cron/reset-credits` | Minuit | Reset crédits utilisateurs gratuits |

Header requis : `Authorization: Bearer {CRON_SECRET}`

## Déploiement

### Vercel (recommandé)

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer

### Variables de production

S'assurer que `NEXT_PUBLIC_SITE_URL` pointe vers le domaine de production.

## Tests

```bash
# Tests unitaires
npm run test:run

# Tests E2E
npm run test:e2e

# Couverture
npm run test:coverage
```

## Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines de contribution.

## Documentation

- [API Documentation](docs/API.md)
- [Cron Jobs](docs/CRON_JOBS.md)
- [Système de bots](BOTS.md)
- [Features](CLIKZY_FEATURE.md)

## Licence

Propriétaire - Tous droits réservés
