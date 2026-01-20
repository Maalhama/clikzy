# Guidelines de Développement - Clikzy

## Principes fondamentaux

### 1. Database First
Toutes les interactions avec la base de données passent par les outils appropriés (MCP Supabase si disponible, sinon ORM/Query Builder du projet).

### 2. Réutilisation du code
**TOUJOURS** chercher l'existant avant de créer :
- Vérifie les composants existants
- Cherche les hooks/utils disponibles
- Regarde les patterns déjà utilisés

### 3. Pas de hardcoding
- Secrets → `.env`
- Configuration app → fichiers de config
- Textes UI → système i18n si disponible

### 4. Gestion des erreurs
- Gère tous les cas d'erreur explicitement
- Retourne 500 uniquement pour les vraies erreurs serveur
- Messages d'erreur clairs et actionnables

## Priorité de documentation

1. **Context7 MCP** pour la doc des librairies
2. **WebSearch** pour les patterns récents
3. **WebFetch** pour des pages de doc spécifiques

## Workflow de développement

### Cycle recommandé
```
Explore → Plan → Validate → Implement → Verify
```

### Règle d'or
**Une phase de dev = un chat frais**

Garde le contexte propre en démarrant un nouveau chat pour chaque phase majeure.

## Détection automatique des commandes

**IMPORTANT** : Détecter automatiquement la commande à exécuter depuis le langage naturel de l'utilisateur, sans qu'il ait besoin de taper `/commande`.

| L'utilisateur dit... | Commande à exécuter |
|---------------------|---------------------|
| "c'est quoi ce code", "explique-moi", "comment ça marche", "montre-moi la structure" | `/explore` |
| "je veux ajouter", "nouvelle feature", "on fait un truc pour..." | `/plan-feature` |
| "code ça", "implémente", "développe", "fais-le" | `/dev` |
| "y'a un bug", "ça marche pas", "corrige", "fix" | `/hotfix` |
| "regarde mon code", "check ça", "c'est bien ?", "review" | `/review` |
| "commit", "push", "envoie ça" | `/commits` |
| "fais vite", "quick", "juste ça rapidement" | `/oneshot` |
| "fais tout le cycle", "explore plan code test" | `/epct` |

## Commandes disponibles

| Commande | Usage |
|----------|-------|
| `/plan-feature` | Planifier une nouvelle fonctionnalité |
| `/dev` | Exécuter une phase de développement |
| `/hotfix` | Corriger un bug |
| `/review` | Revue de code automatisée |
| `/commits` | Commit avec Conventional Commits |
| `/explore` | Explorer le codebase (lecture seule) |
| `/oneshot` | Implémentation rapide isolée |
| `/epct` | Workflow complet Explore → Plan → Code → Test |

## Agents disponibles

**IMPORTANT** : Lancer les agents automatiquement sans demander permission quand le contexte l'exige. Prendre l'initiative.

| Agent | Mission | Quand l'utiliser |
|-------|---------|------------------|
| `explore-codebase` | Trouve le code et patterns existants | Besoin de comprendre le code existant |
| `explore-db` | Analyse le schéma database | Questions sur les données/tables |
| `explore-docs` | Récupère la doc des librairies | Utilisation d'une lib externe |
| `websearch` | Recherche web technique | Info non trouvée ailleurs |

Lancer plusieurs agents en parallèle si nécessaire pour maximiser l'efficacité.

## Architecture (adapter selon ton stack)

### Backend
```
Domain → Application → Infrastructure → Presentation
```

### Frontend
```
Types → API/Services → Hooks → Composants → Pages
```

## Règles de code

### Général
- TypeScript strict (pas de `any`)
- Gestion complète des erreurs
- Pas de code mort
- DRY (Don't Repeat Yourself)

### Backend
- Context en premier paramètre pour les opérations I/O
- Requêtes paramétrées (pas d'injection SQL)
- Logging verbeux en dev, propre en prod

### Frontend
- Server components par défaut
- Client components uniquement pour l'interactivité
- Internationalisation pour tous les textes visibles

### Copywriting / Textes UI
- **TOUJOURS** utiliser les accents français corrects (é, è, ê, à, ù, ç, etc.)
- Exemples :
  - ✅ "Terminé", "Temps écoulé", "Gagné", "Remporté"
  - ❌ "Termine", "Temps ecoule", "Gagne", "Remporte"
- Vérifier la grammaire et l'orthographe française
- Les textes UI doivent être naturels et professionnels en français

## Checklist Production (5 etapes)

**IMPORTANT** : Quand l'utilisateur dit "prepare pour la prod", "rends ca production-ready", ou "on met en ligne", executer ces 5 etapes dans l'ordre.

### Etape 1 : Securite
- [ ] `npm audit` - 0 vulnerabilites
- [ ] Headers securite dans `next.config.ts` (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] `.env.example` documente avec toutes les variables
- [ ] `.gitignore` protege les fichiers sensibles (.env, .env.local)
- [ ] Pas de secrets dans le code

### Etape 2 : Tests
- [ ] Tests unitaires (Vitest) pour les fonctions critiques
- [ ] Tests API routes
- [ ] Couverture minimale sur les validations et services
- [ ] Tous les tests passent

### Etape 3 : Build/Lint
- [ ] `npm run lint` - 0 erreurs (warnings acceptes)
- [ ] `npm run build` - succes
- [ ] Pas d'erreurs TypeScript
- [ ] Code qui permet le build sans secrets (lazy initialization)

### Etape 4 : CI/CD
- [ ] `.github/workflows/ci.yml` (lint, test, build)
- [ ] `.github/workflows/e2e.yml` (Playwright)
- [ ] `.github/dependabot.yml` (maj auto des deps)
- [ ] `.github/pull_request_template.md`
- [ ] `.github/ISSUE_TEMPLATE/` (bug_report, feature_request)
- [ ] `.github/CODEOWNERS`
- [ ] Workflows passent sur GitHub

### Etape 5 : Documentation
- [ ] `README.md` complet (install, scripts, architecture)
- [ ] `CONTRIBUTING.md` (guide contribution)
- [ ] `docs/API.md` (documentation des endpoints)

### Commande rapide
Quand l'utilisateur dit "verifie la prod" ou "check production", lancer :
```bash
npm audit && npm run lint && npm run test:run && npm run build
```

## Notes

### Notifications audio
Les fichiers `.claude/song/finish.mp3` et `.claude/song/need-human.mp3` sont configurés pour les notifications.

### Configuration MCP
Voir la section MCP de la documentation pour configurer :
- Context7 (documentation des librairies)
- Supabase (si tu utilises Supabase)
