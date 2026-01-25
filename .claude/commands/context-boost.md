---
description: Optimise le contexte pour de meilleures réponses
argument-hint: [optionnel: focus spécifique]
---

# Commande: /context-boost

Collecte et optimise le contexte du projet pour améliorer la qualité des réponses.

## Argument

$ARGUMENTS = Focus spécifique (optionnel : architecture, patterns, conventions, stack)

## Objectif

Maximiser la compréhension du projet avec un minimum de tokens pour des réponses plus précises et pertinentes.

## Workflow

### Phase 1: Collecte du contexte essentiel

**Fichiers critiques à lire** :
1. `package.json` - Stack, scripts, dépendances
2. `tsconfig.json` - Configuration TypeScript
3. `CLAUDE.md` - Instructions existantes
4. `.env.example` - Variables d'environnement
5. Structure des dossiers principaux

**Architecture** :
- Structure des dossiers (`app/`, `components/`, `lib/`, etc.)
- Pattern de routing (App Router / Pages Router)
- Organisation des composants

### Phase 2: Extraction des patterns

**Patterns de code** :
- Comment sont structurés les composants ?
- Comment sont gérées les erreurs ?
- Comment sont faits les appels API ?
- Quels hooks custom existent ?

**Conventions** :
- Nommage des fichiers
- Structure des imports
- Style de code (formatters, linters)

### Phase 3: Synthèse du contexte

Génère un résumé structuré :

```markdown
## Project Context Summary

### Stack
- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript (strict)
- **Styling** : Tailwind CSS
- **Database** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth

### Architecture
```
app/
├── (public)/      # Pages sans auth
├── (protected)/   # Pages avec auth
├── api/          # API Routes
components/
├── ui/           # Composants de base (shadcn)
├── features/     # Composants métier
lib/
├── supabase/     # Client Supabase
├── utils/        # Utilitaires
hooks/            # Hooks React custom
```

### Patterns utilisés
- **Data fetching** : Server Components + Supabase
- **Forms** : React Hook Form + Zod
- **State** : useState/useReducer (pas de Redux)
- **Error handling** : try/catch + toast notifications

### Conventions
- **Nommage** : PascalCase composants, camelCase fonctions
- **Imports** : Alias `@/` pour src/
- **Components** : 1 composant par fichier
- **Types** : Interfaces pour les props, Types pour les données

### Scripts disponibles
- `npm run dev` - Dev server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run test:run` - Vitest

### Points d'attention
- [Spécificité 1 du projet]
- [Spécificité 2 du projet]
```

### Phase 4: Mise à jour du CLAUDE.md (optionnel)

Si des patterns importants ne sont pas documentés :

```markdown
## Propositions pour CLAUDE.md

### À ajouter
- [ ] Pattern X découvert mais non documenté
- [ ] Convention Y utilisée partout

### À clarifier
- [ ] Instruction Z ambiguë
```

## Techniques de context engineering

### 1. Minimal Token Footprint
- Résumés concis plutôt que code verbeux
- Patterns plutôt qu'exemples exhaustifs
- Structure plutôt que détails

### 2. Hierarchical Context
```
Projet → Architecture → Module → Fichier → Fonction
```

### 3. Relevant Context Only
- Ne charger que ce qui est pertinent pour la tâche
- Éviter le bruit (node_modules, builds, etc.)

### 4. Pattern Extraction
Au lieu de montrer 10 composants similaires, extraire le pattern commun.

## Commandes associées

```bash
# Voir le contexte actuel
/context-boost

# Focus sur l'architecture
/context-boost architecture

# Focus sur les patterns de code
/context-boost patterns

# Focus sur les conventions
/context-boost conventions
```

## Utilisation recommandée

1. **Début de session** : Lance `/context-boost` pour charger le contexte
2. **Nouvelle feature** : `/context-boost patterns` avant de coder
3. **Debug** : `/context-boost` + zone spécifique
4. **Review** : `/context-boost conventions` pour vérifier la cohérence

## Output

Le contexte collecté est utilisé implicitement pour :
- Générer du code cohérent avec l'existant
- Respecter les conventions du projet
- Réutiliser les patterns établis
- Éviter de réinventer la roue
