# Commande: /explore

Explore le codebase pour répondre à une question sans modifier le code.

## Argument

$ARGUMENTS = Question sur le codebase ou l'architecture

## Workflow

### Phase 1: Analyse de la question
Extrait :
- Les concepts clés
- Le scope (backend, frontend, database, libs, externe)
- Le niveau de détail attendu

Si la question est ambiguë, utilise `AskUserQuestion` pour clarifier.

### Phase 2: Exploration parallèle
Lance les agents appropriés simultanément :

| Scope | Agent |
|-------|-------|
| Code backend/frontend | `explore-codebase` |
| Base de données | `explore-db` |
| Documentation libs | `explore-docs` |
| Infos externes | `websearch` |

### Phase 3: Vérification
Après retour des agents, vérifie :
1. Toutes les infos nécessaires sont là ?
2. Des zones non explorées restent ?

Si des lacunes, relance les agents ciblés.

### Phase 4: Synthèse
Compile une réponse complète avec :

### Citations
Référence les fichiers sources : `fichier.ts:42`

### Patterns identifiés
Explique les conventions utilisées.

### Recommandations
Si pertinent, suggère des approches basées sur l'existant.

## Format de sortie

```markdown
# Exploration: [Question]

## Réponse courte
[Résumé en 2-3 phrases]

## Détails

### [Aspect 1]
Explication avec références : `src/module/file.ts:123`

### [Aspect 2]
Autre explication...

## Patterns observés
- Pattern 1 utilisé dans X fichiers
- Convention Y appliquée

## Fichiers clés
- `path/to/file1.ts` - Description
- `path/to/file2.ts` - Description

## Schéma (si applicable)
[Diagramme ASCII ou description]
```

## Principes

- **Parallélisation** : Plusieurs agents en un message
- **Citations** : Toute affirmation référence du code
- **Lecture seule** : Aucune modification
- **Complétude** : Vérifie les lacunes avant de répondre
