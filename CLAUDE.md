# Guidelines de Développement - Cleekzy

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

### 5. Persistance des données joueur (CRITIQUE)

**RÈGLE ABSOLUE** : Les données importantes des joueurs ne sont JAMAIS supprimées ou réinitialisées.

| Donnée | Champ | Reset quotidien ? | Supprimée ? |
|--------|-------|-------------------|-------------|
| Victoires | `profiles.total_wins` | JAMAIS | JAMAIS |
| Total clics | `profiles.total_clicks` | JAMAIS | JAMAIS |
| Crédits gagnés | `profiles.earned_credits` | JAMAIS | JAMAIS |
| Badges | `user_badges` | JAMAIS | JAMAIS |
| Historique victoires | `winners` | JAMAIS | JAMAIS |
| Parrainages | `profiles.referral_count` | JAMAIS | JAMAIS |
| Mini-jeux joués | `mini_game_plays` | JAMAIS | JAMAIS |
| Crédits quotidiens | `profiles.credits` | OUI (free only) | Non |

**Ce qui EST reset quotidiennement :**
- `profiles.credits` → Reset à 10 pour les utilisateurs gratuits ET VIP
- Compteur de parties gratuites mini-jeux (1/jour)

**Qui N'EST PAS reset :**
- Utilisateurs ayant acheté des crédits (`has_purchased_credits = true`) → Gardent leurs crédits à vie

**Bonus V.I.P :**
- Les VIP reçoivent 10 crédits gratuits comme tout le monde (reset quotidien)
- PLUS +10 crédits bonus à récolter manuellement sur leur dashboard VIP
- Soit 20 crédits par jour au total (10 auto + 10 à cliquer)

**Ce qui n'est JAMAIS reset :**
- Tous les compteurs permanents (wins, clicks, earned_credits)
- Tous les badges obtenus
- Tout l'historique de victoires
- Données de parrainage
- Informations de profil (username, avatar, adresse)

**Quand tu ajoutes des crédits comme récompense (badges, mini-jeux, parrainages) :**
```typescript
// CORRECT - Ajoute aux earned_credits (permanent)
.update({ earned_credits: profile.earned_credits + reward })

// INCORRECT - Serait reset le lendemain
.update({ credits: profile.credits + reward })
```

## Priorité de documentation

1. **Context7 MCP** pour la doc des librairies
2. **WebSearch** pour les patterns récents
3. **WebFetch** pour des pages de doc spécifiques

## Choix du modèle

| Contexte | Modèle |
|----------|--------|
| Discussion simple, questions | **Sonnet** (moins cher) |
| Tâche complexe, implémentation | Opus |
| `/ultrathink`, architecture | Opus |

**Par défaut** : Utiliser Sonnet pour les échanges conversationnels.

## Workflow de développement

### Cycle recommandé
```
Explore → Plan → Validate → Implement → Verify
```

### Règle d'or
**Une phase de dev = un chat frais**

Garde le contexte propre en démarrant un nouveau chat pour chaque phase majeure.

## Détection automatique - Skills & Agents

**RÈGLE ABSOLUE** : Détecter automatiquement ce dont l'utilisateur a besoin depuis son langage naturel. Ne JAMAIS demander "voulez-vous que je lance X ?" - LANCER directement.

### Détection → Skills

| L'utilisateur dit... | Action |
|---------------------|--------|
| "c'est quoi ce code", "explique-moi", "comment ça marche" | `/explore` |
| "je veux ajouter", "nouvelle feature", "on fait un truc pour..." | `/plan-feature` |
| "code ça", "implémente", "développe", "fais-le" | `/dev` |
| "y'a un bug", "ça marche pas", "corrige", "fix" | `/hotfix` |
| "regarde mon code", "check ça", "c'est bien ?", "review" | `/review` |
| "commit", "push", "envoie ça" | `/commits` |
| "fais vite", "quick", "juste ça rapidement" | `/oneshot` |
| "fais tout le cycle", "explore plan code test" | `/epct` |
| "problème complexe", "réfléchis bien", "analyse en profondeur" | `/ultrathink` |
| "c'est quoi le meilleur agent", "aide-moi à choisir" | `/smart-agent` |
| "sécurité", "vulnérabilités", "audit sécu" | `/security-scan` |
| "refacto", "nettoie le code", "améliore la qualité" | `/refactor-clean` |
| "debug", "trace", "comprends pas pourquoi" | `/debug-trace` |
| "dépendances", "npm audit", "packages obsolètes" | `/deps-audit` |
| "documente", "génère la doc", "README" | `/doc-generate` |
| "TDD", "test first", "red green refactor" | `/tdd-cycle` |
| "architecture", "décision technique", "design system" | `/architect` |

### Détection → Agents (lancement automatique)

**IMPORTANT** : Lancer les agents AUTOMATIQUEMENT sans demander permission. Prendre l'initiative.

| Contexte détecté | Agent(s) à lancer |
|------------------|-------------------|
| Besoin de comprendre du code existant | `explore-codebase` |
| Question sur la BDD, tables, schéma | `explore-db` |
| Utilisation d'une librairie externe | `explore-docs` |
| Info non trouvée dans le code | `websearch` |
| Bug à corriger | `debugger` → `implementer` |
| Code à implémenter | `implementer` |
| Refactoring demandé | `refactorer` |
| Tests à écrire | `test-writer` |
| Review de code | `code-reviewer` + `security-auditor` |
| Audit sécurité | `security-auditor` |

### Combinaisons automatiques

| Tâche complexe | Agents en parallèle |
|----------------|---------------------|
| Nouvelle feature | `explore-codebase` + `explore-docs` → `implementer` |
| Bug mystérieux | `explore-codebase` + `debugger` → `implementer` |
| Refacto sécurisé | `code-reviewer` + `refactorer` |
| Feature avec tests | `test-writer` + `implementer` |

### Règle d'or

```
L'utilisateur décrit son besoin en français
        ↓
Claude détecte automatiquement
        ↓
Lance le skill OU l'agent approprié
        ↓
SANS demander confirmation
```

## Skills disponibles (18)

### Skills de base
| Skill | Usage |
|-------|-------|
| `/explore` | Explorer le codebase (lecture seule) |
| `/plan-feature` | Planifier une nouvelle fonctionnalité |
| `/dev` | Exécuter une phase de développement |
| `/hotfix` | Corriger un bug |
| `/review` | Revue de code automatisée |
| `/commits` | Commit avec Conventional Commits |
| `/oneshot` | Implémentation rapide isolée |
| `/epct` | Workflow complet Explore → Plan → Code → Test |

### Power Skills (boost les capacités)
| Skill | Usage |
|-------|-------|
| `/ultrathink` | Mode réflexion profonde (31,999 tokens) pour problèmes complexes |
| `/smart-agent` | Routing intelligent vers les bons agents selon le problème |
| `/context-boost` | Optimise le contexte pour de meilleures réponses |
| `/architect` | Décisions architecturales avec ADR et diagrammes |

### Tools Skills (outils de travail)
| Skill | Usage |
|-------|-------|
| `/tdd-cycle` | Workflow Test-Driven Development (RED → GREEN → REFACTOR) |
| `/security-scan` | Audit sécurité complet (OWASP, secrets, deps) |
| `/refactor-clean` | Refactoring selon Clean Code et SOLID |
| `/debug-trace` | Debugging avancé avec traçage |
| `/deps-audit` | Audit dépendances (sécu, licences, obsolètes) |
| `/doc-generate` | Génération automatique de documentation |

## Agents disponibles (10)

**IMPORTANT** : Lancer les agents automatiquement sans demander permission quand le contexte l'exige. Prendre l'initiative.

### Agents d'exploration
| Agent | Mission | Quand l'utiliser |
|-------|---------|------------------|
| `explore-codebase` | Trouve le code et patterns existants | Besoin de comprendre le code existant |
| `explore-db` | Analyse le schéma database | Questions sur les données/tables |
| `explore-docs` | Récupère la doc des librairies | Utilisation d'une lib externe |
| `websearch` | Recherche web technique | Info non trouvée ailleurs |

### Agents d'action
| Agent | Mission | Quand l'utiliser |
|-------|---------|------------------|
| `implementer` | Implémente du code qualité prod | Phase d'implémentation |
| `debugger` | Analyse et corrige les bugs | Bug difficile à comprendre |
| `refactorer` | Améliore le code sans changer le comportement | Amélioration de code existant |
| `test-writer` | Écrit des tests complets | Ajout de couverture de tests |
| `code-reviewer` | Review multi-perspectives | Validation avant merge |
| `security-auditor` | Audit sécurité OWASP | Vérification de sécurité |

### Orchestration Skills → Agents
```
/explore         → explore-codebase
/hotfix          → debugger + implementer
/review          → code-reviewer + security-auditor
/tdd-cycle       → test-writer + implementer
/security-scan   → security-auditor
/refactor-clean  → refactorer
/smart-agent     → [routing automatique]
```

Lancer plusieurs agents en parallèle si nécessaire pour maximiser l'efficacité.

## Ultrathink - Mode réflexion profonde

**Quand utiliser** : Problèmes complexes, décisions architecturales, bugs mystérieux, code reviews critiques.

**Trigger words** (par ordre de puissance) :
- `think` → Budget standard
- `think hard` / `think harder` → Budget augmenté
- `ultrathink` → Budget maximum (31,999 tokens)

**Exemple** :
```
ultrathink: Analyse cette architecture et propose des améliorations
```

**Attention** : Consomme beaucoup de tokens. Réserver pour les vrais problèmes complexes.

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

## Système de crédits

### Reset quotidien
- **Utilisateurs gratuits** : Reset à 10 crédits chaque minuit
- **Utilisateurs payants** : Pas de reset (gardent leurs crédits)

### Intégration paiement (Stripe ou autre)
Quand un utilisateur achète des crédits, exécuter :

```sql
UPDATE profiles
SET has_purchased_credits = true, credits = credits + [NB_CREDITS_ACHETÉS]
WHERE id = '[USER_ID]';
```

Le flag `has_purchased_credits = true` désactive le reset quotidien pour cet utilisateur.

## Système de crons (cron-job.org)

Les crons sont configurés sur **cron-job.org** (pas GitHub Actions) :

| Cron | Fréquence | URL |
|------|-----------|-----|
| Bot Clicks | 1 min | `/api/cron/bot-clicks` |
| Activate Games | 1 min | `/api/cron/activate-games` |
| Create Rotation | :45 aux heures 23,2,5,8,11,14,17,20 | `/api/cron/create-rotation` |

Header requis : `Authorization: Bearer [CRON_SECRET]`

## TODO - À faire

- [x] **Resend** : Configuré avec le domaine cleekzy.com

## Notes

### Notifications audio
Les fichiers `.claude/song/finish.mp3` et `.claude/song/need-human.mp3` sont configurés pour les notifications.

### Configuration MCP
- Context7 (documentation des librairies) - `claude mcp add context7 npx -y @anthropics/context7-mcp`