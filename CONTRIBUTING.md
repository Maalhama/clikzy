# Guide de Contribution - CLEEKZY

Merci de vouloir contribuer à CLEEKZY ! Ce document explique comment participer au développement du projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Setup Développement](#setup-développement)
- [Standards de Code](#standards-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Conventions de Commit](#conventions-de-commit)
- [Tests](#tests)

## 🤝 Code de Conduite

- Sois respectueux et professionnel
- Accepte les critiques constructives
- Focus sur ce qui est le mieux pour le projet

## 🚀 Comment Contribuer

### Signaler un Bug

Crée une issue avec :
- **Titre clair** : "Bug: Le timer ne se reset pas en phase finale"
- **Description** : Étapes pour reproduire le bug
- **Comportement attendu** vs **Comportement actuel**
- **Environnement** : Navigateur, OS, version

### Proposer une Feature

Crée une issue avec :
- **Titre clair** : "Feature: Ajouter un système de succès"
- **Description** : Explication de la feature et pourquoi elle est utile
- **Mockups** : Si c'est une feature UI, ajoute des screenshots/maquettes

### Améliorer la Documentation

Les PRs pour améliorer la doc sont toujours bienvenues !

## 💻 Setup Développement

### 1. Fork & Clone

\`\`\`bash
# Fork le repo sur GitHub
# Puis clone ton fork
git clone https://github.com/TON_USERNAME/Clikzy.git
cd Clikzy
\`\`\`

### 2. Installation

\`\`\`bash
npm install
\`\`\`

### 3. Variables d'Environnement

Copie \`.env.example\` vers \`.env.local\` et remplis les valeurs :

\`\`\`bash
cp .env.example .env.local
\`\`\`

Variables requises :
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`STRIPE_SECRET_KEY\`
- \`NEXT_PUBLIC_SITE_URL\`

### 4. Lancer en Développement

\`\`\`bash
npm run dev
\`\`\`

Le site sera disponible sur \`http://localhost:3000\`

## 📏 Standards de Code

### TypeScript

- **Strict mode** activé (pas de \`any\`)
- Toujours typer les paramètres et retours de fonction
- Utiliser les types de \`@/types/database\` pour les données Supabase

### React

- **Server Components par défaut** (pas de \`'use client'\` sauf nécessaire)
- Utiliser les Server Actions pour les mutations

### Base de Données

- **JAMAIS de queries SQL directes** (utiliser Supabase client)
- Toujours utiliser RLS (Row Level Security)
- Utiliser les RPC functions pour la logique complexe

## 🔄 Process de Pull Request

### 1. Créer une Branche

\`\`\`bash
git checkout -b feature/nom-de-la-feature
# ou
git checkout -b fix/nom-du-bug
\`\`\`

### 2. Vérifications Avant PR

\`\`\`bash
# Linting
npm run lint

# Tests
npm run test:run

# Build
npm run build
\`\`\`

Tout doit passer ✅

### 3. Commit

Utilise [Conventional Commits](https://www.conventionalcommits.org/) :

\`\`\`bash
git commit -m "feat: ajouter système de succès quotidiens"
git commit -m "fix: corriger le reset du timer en phase finale"
\`\`\`

## 📝 Conventions de Commit

| Type | Description | Exemple |
|------|-------------|---------|
| \`feat\` | Nouvelle feature | \`feat: ajouter mini-jeu roulette\` |
| \`fix\` | Bug fix | \`fix: corriger le calcul des crédits\` |
| \`docs\` | Documentation | \`docs: ajouter guide contribution\` |
| \`test\` | Tests | \`test: ajouter tests pour badges\` |
| \`refactor\` | Refactoring | \`refactor: simplifier logique\` |
| \`chore\` | Maintenance | \`chore: update dependencies\` |

## 🧪 Tests

### Lancer les Tests

\`\`\`bash
# Mode watch
npm run test

# Run une fois
npm run test:run
\`\`\`

Objectif : **>70% de couverture** sur le code critique

## 🆘 Besoin d'Aide ?

- **Issues** : Pour questions techniques sur GitHub
- **Email** : contact@cleekzy.com

Merci de contribuer à CLEEKZY ! 🎮✨
