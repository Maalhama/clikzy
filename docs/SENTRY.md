# Configuration Sentry - Cleekzy

## Prérequis

1. Compte sur [Sentry.io](https://sentry.io) (gratuit jusqu'à 5000 erreurs/mois)

## Étapes de configuration

### 1. Créer un projet Sentry

1. Aller sur https://sentry.io
2. Se connecter ou créer un compte
3. Créer une nouvelle organisation (si pas déjà fait)
4. Créer un nouveau projet :
   - **Platform** : Next.js
   - **Nom** : `cleekzy`

### 2. Récupérer le DSN

1. Dans le projet, aller dans **Settings** → **Client Keys (DSN)**
2. Copier le DSN (format : `https://xxx@o123.ingest.sentry.io/456`)

### 3. Configurer sur Vercel

1. Aller sur https://vercel.com/[ton-équipe]/clikzy/settings/environment-variables
2. Ajouter la variable :
   - **Nom** : `NEXT_PUBLIC_SENTRY_DSN`
   - **Valeur** : Le DSN copié
   - **Environnements** : Production (au minimum)

### 4. Redéployer

Après avoir ajouté la variable, redéployer le projet pour que Sentry soit actif.

## Configuration actuelle

Les fichiers Sentry sont déjà configurés dans le projet :

- `sentry.client.config.ts` - Configuration client (navigateur)
- `sentry.server.config.ts` - Configuration serveur
- `sentry.edge.config.ts` - Configuration edge functions
- `instrumentation.ts` - Hook d'initialisation

### Paramètres optimisés

```typescript
// Performance : 10% des transactions tracées (économise le quota)
tracesSampleRate: 0.1

// Replay désactivé (économise le quota)
replaysSessionSampleRate: 0

// Actif uniquement en production
enabled: process.env.NODE_ENV === "production"

// Erreurs ignorées (bruit inutile)
ignoreErrors: [
  "ResizeObserver loop",
  "Network request failed",
  "Load failed",
  "ChunkLoadError",
]
```

## Vérification

Pour vérifier que Sentry fonctionne :

1. Aller sur le site en production
2. Ouvrir la console du navigateur
3. Taper : `throw new Error('Test Sentry')`
4. Aller sur Sentry → Issues → L'erreur doit apparaître

## Alertes recommandées

Dans Sentry, configurer des alertes pour :

- **Nouvelles erreurs** : Email immédiat
- **Spike d'erreurs** : Email si > 10 erreurs en 1h
- **Erreurs critiques** : Email pour les erreurs 500
