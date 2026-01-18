# Commande: /plan-feature

Crée un plan de développement complet pour une nouvelle fonctionnalité.

## Argument

$ARGUMENTS = Description de la fonctionnalité à planifier

## Workflow

### Phase 1: Compréhension
Lis attentivement la description de la fonctionnalité. Identifie :
- L'objectif principal
- Les sous-fonctionnalités
- Le scope (backend, frontend, ou les deux)

### Phase 2: Clarification
Avant d'explorer, clarifie avec l'utilisateur :
- Comportement en cas d'erreur ?
- Messages de succès ?
- Valeurs par défaut ?
- Règles de validation ?
- Permissions requises ?

Utilise `AskUserQuestion` si des points sont ambigus.

### Phase 3: Exploration parallèle
Lance les agents appropriés selon le scope :

**Backend** :
- `explore-codebase` pour le code backend
- `explore-db` pour le schéma de base de données

**Frontend** :
- `explore-codebase` pour les composants existants

**Librairies** :
- `explore-docs` pour la documentation des libs nécessaires

### Phase 4: Validation post-exploration
Vérifie :
1. Infos database complètes ?
2. Documentation des libs complète ?
3. Patterns existants identifiés ?

Si non, relance les agents nécessaires.

### Phase 5: Architecture
Présente l'architecture proposée à l'utilisateur :
- Fichiers à créer/modifier
- Patterns à réutiliser
- Ordre d'exécution

**Attends la validation de l'utilisateur avant de continuer.**

### Phase 6: Spécification
Crée un fichier `{FEATURE_NAME}_FEATURE.md` avec :

```markdown
# Feature: [Nom]

## Vue d'ensemble
Description de la fonctionnalité.

## Spécifications fonctionnelles
- Comportement attendu
- Cas d'usage
- Gestion des erreurs

## Architecture technique

### Backend
- Fichiers à créer/modifier
- Endpoints API
- Logique métier

### Frontend
- Composants
- State management
- UI/UX

### Database
- Tables/modifications
- Migrations
- Policies RLS

## Plan d'exécution

### Phase 1: Backend
- [ ] Tâche 1
- [ ] Tâche 2 (max 5 items par phase)

### Phase 2: Frontend
- [ ] Tâche 1
- [ ] Tâche 2

## Notes
Points d'attention particuliers.
```

## Contraintes

- **Max 5 items par phase de dev**
- **Chaque phase doit compiler indépendamment**
- **Backend avant Frontend**
- **Validation utilisateur obligatoire avant implémentation**
