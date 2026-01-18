# Commande: /dev

Exécute une phase de développement à partir d'une spécification.

## Argument

$ARGUMENTS = Chemin vers le fichier de spec OU description de la phase à exécuter

## Workflow

### Phase 1: Compréhension
1. Lis le fichier de spécification
2. Identifie la phase courante à exécuter
3. Extrait les fichiers et librairies concernés

### Phase 2: Exploration parallèle

Selon le scope de la phase :

**Backend** :
- Lance `explore-codebase` pour le code backend
- Lance `explore-db` pour les infos database

**Frontend** :
- Lance `explore-codebase` pour les composants

**Librairies** :
- Lance `explore-docs` pour chaque lib nécessaire

### Phase 3: Validation post-exploration
Vérifie la complétude :
- [ ] Infos database complètes ?
- [ ] Documentation libs complète ?
- [ ] Patterns du codebase identifiés ?

Si non, relance les agents manquants.

### Phase 4: Plan enrichi
Présente le plan d'implémentation détaillé :
- Fichiers à créer/modifier
- Patterns à réutiliser
- Ordre d'exécution

**Attends la validation utilisateur.**

### Phase 5: Implémentation

Ordre d'implémentation :

**Backend** (si applicable) :
1. Domain (entités, interfaces)
2. Application (use cases, DTOs)
3. Infrastructure (repositories)
4. Presentation (handlers, middleware)

**Frontend** (si applicable) :
1. Types
2. API/Services
3. Hooks
4. Composants
5. Pages

### Phase 6: Vérification
1. Lance le build : `npm run build` ou équivalent
2. Vérifie la compilation
3. Teste les endpoints/fonctionnalités

### Phase 7: Documentation
Met à jour le fichier de spec :
- Coche les items complétés
- Note les problèmes rencontrés

## Règles

- **Explore avant de coder**
- **Réutilise les patterns existants**
- **Valide avec l'utilisateur avant d'implémenter**
- **Reste dans le scope de la phase**
- **Gestion complète des erreurs**
- **Pas de valeurs hardcodées**
