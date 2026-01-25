# Commande: /tdd-cycle

Workflow Test-Driven Development complet : RED → GREEN → REFACTOR.

## Argument

$ARGUMENTS = Description de la fonctionnalité à développer en TDD

## Workflow

### Phase 1: RED (Écrire les tests qui échouent)

**Objectif** : Définir le comportement attendu AVANT d'écrire le code.

1. **Analyse des requirements**
   - Parse la fonctionnalité demandée
   - Identifie les cas nominaux
   - Identifie les cas limites (edge cases)
   - Identifie les cas d'erreur

2. **Écriture des tests**
   - Crée les fichiers de test (`.test.ts` ou `.spec.ts`)
   - Écris les tests pour TOUS les cas identifiés
   - Utilise des noms de tests descriptifs (`should_return_X_when_Y`)

3. **Validation RED**
   - Lance les tests : `npm run test:run` ou `vitest run`
   - **TOUS les tests doivent échouer**
   - Si un test passe → le supprimer ou le réécrire

**ARRÊT** : Attends validation utilisateur avant de passer à GREEN.

### Phase 2: GREEN (Implémentation minimale)

**Objectif** : Faire passer les tests avec le code le plus simple possible.

**Règles strictes** :
- ❌ Pas d'optimisation
- ❌ Pas de refactoring
- ❌ Pas de code "au cas où"
- ✅ Le minimum pour faire passer chaque test

1. **Implémentation incrémentale**
   - Fais passer un test à la fois
   - Lance les tests après chaque modification
   - Ne passe au test suivant que quand le précédent est vert

2. **Validation GREEN**
   - Lance tous les tests
   - **TOUS les tests doivent passer**
   - Coverage check : `npm run test:coverage` si disponible

### Phase 3: REFACTOR (Amélioration du code)

**Objectif** : Améliorer la qualité sans changer le comportement.

**Pré-requis** : Tous les tests passent (GREEN validé).

1. **Analyse du code**
   - Identifie les duplications
   - Identifie les méthodes trop longues (>20 lignes)
   - Identifie les noms peu clairs
   - Vérifie les principes SOLID

2. **Refactoring**
   - Applique les améliorations une par une
   - Lance les tests après CHAQUE modification
   - Si un test échoue → annule le dernier changement

3. **Validation REFACTOR**
   - Tous les tests passent toujours
   - Code plus lisible et maintenable
   - Pas de régression de coverage

## Anti-patterns interdits

- ❌ Écrire le code avant les tests
- ❌ Modifier un test pour qu'il passe
- ❌ Skipper la phase REFACTOR
- ❌ Implémenter plus que nécessaire en GREEN
- ❌ Refactorer pendant la phase GREEN

## Métriques de succès

- 100% des tests écrits AVANT l'implémentation
- Coverage ≥ 80% sur le nouveau code
- Temps d'exécution des tests < 5 secondes
- Complexité cyclomatique < 10 par fonction

## Format de sortie

```markdown
# TDD Cycle: [Fonctionnalité]

## Phase RED
- Tests créés : X
- Cas couverts : nominaux, edge cases, erreurs
- Statut : ❌ Tous échouent (attendu)

## Phase GREEN
- Tests passés : X/X
- Coverage : X%
- Statut : ✅ Tous passent

## Phase REFACTOR
- Améliorations : [liste]
- Tests : ✅ Toujours verts
- Code quality : améliorée
```
