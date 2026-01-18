# Commande: /oneshot

Implémentation rapide sans fichier de spécification complet.

## Argument

$ARGUMENTS = Description de la tâche à implémenter

## Workflow

### Phase 1: Exploration parallèle
Lance simultanément les agents pertinents :

- `explore-codebase` pour le code existant
- `explore-db` si database impliquée
- `explore-docs` pour les libs nécessaires
- `websearch` pour des infos externes

### Phase 2: Vérification post-exploration
Assure-toi d'avoir :
- Les patterns existants
- La structure du projet
- Les conventions de code
- Les dépendances disponibles

### Phase 3: Clarification
Résous les ambiguïtés avec l'utilisateur :
- Comportement en cas d'erreur ?
- Valeurs par défaut ?
- Règles de validation ?
- Feedback utilisateur (messages de succès/erreur) ?

Utilise `AskUserQuestion` si nécessaire.

### Phase 4: Plan
Documente le plan d'implémentation :
- Fichiers à créer/modifier
- Patterns à suivre
- Ordre d'exécution

### Phase 5: Validation
Présente le plan à l'utilisateur.

**Attends sa validation avant de coder.**

### Phase 6: Implémentation

**Ordre** :
1. Backend (si applicable)
   - Domain → Infrastructure → Application → Presentation
2. Frontend (si applicable)
   - Types → API → Hooks → Composants → Pages

**Règles** :
- Suis les patterns découverts
- Gestion complète des erreurs
- Pas de valeurs hardcodées
- TypeScript strict (pas de `any`)

### Phase 7: Vérification
1. Lance le build
2. Vérifie la compilation
3. Teste les fonctionnalités

## Différence avec /dev

| /oneshot | /dev |
|----------|------|
| Tâche isolée | Phase d'une feature |
| Pas de spec file | Suit une spec existante |
| Rapide | Méthodique |
| Petites modifications | Gros développements |

## Principes

- **Explore avant de planifier**
- **Valide toujours avec l'utilisateur**
- **Suis les patterns découverts**
- **Backend first, puis frontend**
- **Jamais de hardcoding**
