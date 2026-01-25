# Commande: /refactor-clean

Refactoring et nettoyage de code selon les principes Clean Code et SOLID.

## Argument

$ARGUMENTS = [fichier ou dossier] [focus] (optionnel)
- focus : naming, extraction, duplication, solid, all
- Par défaut : all sur les fichiers modifiés récemment

## Workflow

### Phase 1: Analyse du code

**Métriques à collecter** :
- Longueur des fonctions (seuil : >20 lignes)
- Longueur des fichiers (seuil : >300 lignes)
- Complexité cyclomatique (seuil : >10)
- Profondeur d'imbrication (seuil : >3 niveaux)
- Duplication de code

**Code smells recherchés** :
- Fonctions/méthodes trop longues
- Classes/composants trop grands
- Noms peu explicites
- Magic numbers/strings
- Code mort (non utilisé)
- Commentaires obsolètes
- Couplage fort entre modules
- God objects/components

### Phase 2: Priorisation

Classe les problèmes par impact :

1. **Critique** (à corriger immédiatement)
   - Code dupliqué (DRY violation)
   - Noms trompeurs
   - Bugs potentiels

2. **Important** (amélioration significative)
   - Fonctions trop longues
   - Complexité excessive
   - Couplage fort

3. **Nice-to-have** (polish)
   - Nommage améliorable
   - Optimisations mineures
   - Formatage

### Phase 3: Plan de refactoring

**Présente le plan à l'utilisateur** :

```markdown
## Refactoring proposé

### Extractions de fonctions
- `fichier.ts:45-80` → Extraire `processUserData()`
- `fichier.ts:120-150` → Extraire `validateInput()`

### Renommages
- `x` → `userCount`
- `handleClick` → `handleSubmitForm`

### Suppressions
- `utils/old.ts` (non utilisé)
- `legacyFunction()` (code mort)

### Réorganisation
- Déplacer `helper.ts` vers `utils/`
- Séparer `BigComponent` en sous-composants
```

**Attends validation utilisateur.**

### Phase 4: Refactoring

**Ordre d'exécution** :
1. Renommages (le plus safe)
2. Extractions de fonctions
3. Extractions de composants
4. Suppression du code mort
5. Réorganisation des fichiers

**Règles** :
- Une modification à la fois
- Vérifier le build après chaque changement
- Garder les tests verts
- Pas de changement de comportement

### Phase 5: Vérification

1. **Build** : `npm run build`
2. **Lint** : `npm run lint`
3. **Tests** : `npm run test:run` (si disponible)
4. **Types** : Vérifier qu'il n'y a pas d'erreurs TypeScript

### Phase 6: Rapport

```markdown
# Refactoring Report

## Métriques avant/après
| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes de code | X | Y |
| Fonctions >20 lignes | X | Y |
| Complexité max | X | Y |
| Code dupliqué | X% | Y% |

## Changements effectués
- ✅ Extrait 3 fonctions
- ✅ Renommé 5 variables
- ✅ Supprimé 2 fichiers morts

## Tests
- Build : ✅
- Lint : ✅
- Tests : ✅
```

## Principes Clean Code appliqués

### Nommage
- Noms révélateurs d'intention
- Pas d'abréviations cryptiques
- Verbes pour les fonctions, noms pour les variables
- Cohérence dans tout le codebase

### Fonctions
- Une seule responsabilité
- Peu de paramètres (≤3 idéalement)
- Pas d'effets de bord cachés
- Niveau d'abstraction cohérent

### SOLID
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

## Anti-patterns à éviter

- ❌ Refactorer sans tests
- ❌ Plusieurs changements en un commit
- ❌ Changer le comportement pendant le refactoring
- ❌ Refactorer du code qu'on ne comprend pas
