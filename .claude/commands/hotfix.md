# Commande: /hotfix

Corrige un bug ou modifie une fonctionnalité existante.

## Argument

$ARGUMENTS = Description du bug ou de la modification

## Workflow

### Phase 1: Analyse
Parse le problème :
- Zone fonctionnelle affectée
- Type de bug (erreur, comportement, performance)
- Couches impactées (frontend, backend, database)
- Environnement (dev, prod)

### Phase 2: Exploration parallèle
Lance les agents selon le scope identifié :

- `explore-codebase` pour le code concerné
- `explore-db` si le problème touche les données
- `explore-docs` si une lib est impliquée
- `websearch` pour des solutions connues

### Phase 3: Vérification post-exploration
Assure-toi d'avoir trouvé :
- Le code source du problème
- Les patterns utilisés dans la zone
- Les dépendances liées

### Phase 4: Diagnostic
Analyse :
- **Comportement actuel** : Que se passe-t-il ?
- **Comportement attendu** : Que devrait-il se passer ?
- **Cause racine** : Pourquoi ça ne marche pas ?

### Phase 5: Plan de correction
Propose :
- Les modifications à effectuer
- Les risques potentiels
- Les tests à effectuer

**Attends la validation utilisateur.**

### Phase 6: Implémentation
Applique les corrections :
1. Backend d'abord (si applicable)
2. Frontend ensuite
3. Vérifie la compilation

### Phase 7: Vérification
1. Lance le build
2. Teste le scénario corrigé
3. Vérifie les régressions potentielles

### Phase 8: Résumé
Fournis :
- Ce qui a été modifié
- Pourquoi
- Comment tester
- Points d'attention

## Principes

- **Explore avant de supposer**
- **Corrige la cause racine, pas les symptômes**
- **Valide avant d'implémenter**
- **Reste dans le scope du fix**
- **Ajoute des guards défensifs si approprié**
