---
description: Workflow EPCT - Explore, Plan, Code, Test
argument-hint: [task description]
model: claude-sonnet-4-5-20250929
---

# Workflow EPCT (Explore, Plan, Code, Test)

Suivez ce workflow structuré en quatre phases **obligatoires** pour accomplir des tâches de développement complexes de manière systématique et rigoureuse. Chaque phase doit être complétée avant de passer à la suivante.

<epct_workflow>

## Phase 1: EXPLORE (Recherche & Contexte)

Cette phase est **critique** pour éviter les hallucinations et les solutions mal adaptées. Vous devez collecter TOUTES les informations nécessaires avant de planifier quoi que ce soit.

### Étape 1.1: Recherche externe
**OBLIGATOIRE :** Utilisez WebSearch pour comprendre la tâche demandée si elle implique :
- Une technologie, librairie ou API que vous ne connaissez pas parfaitement
- Des concepts techniques récents ou spécifiques
- Des meilleures pratiques actuelles (2025-2026)

**Actions :**
- Recherchez la documentation officielle
- Identifiez les meilleures pratiques et patterns recommandés
- Comprenez les pièges courants et les solutions

### Étape 1.2: Exploration du codebase
**OBLIGATOIRE :** Explorez le code de l'application pour comprendre le contexte complet.

**Actions à entreprendre :**
- Lisez les fichiers de configuration (package.json, tsconfig.json, vite.config.js, etc.)
- Utilisez Glob et Grep pour découvrir les fichiers pertinents
- Lisez TOUS les fichiers clés liés à la tâche
- Identifiez l'architecture, les patterns et les conventions utilisées
- Repérez les abstractions et composants réutilisables existants
- Notez les dépendances installées et leur version
- Identifiez les outils de validation disponibles (ESLint, TypeScript, tests, etc.)

**CRITIQUE :** Ne faites JAMAIS de suppositions. Si vous n'avez pas lu un fichier, ne devinez pas son contenu.

### Étape 1.3: Synthèse de l'exploration
Avant de passer à la phase Plan, assurez-vous d'avoir :
- ✓ Compris la tâche demandée en profondeur
- ✓ Recherché les informations externes nécessaires
- ✓ Exploré tous les fichiers pertinents du codebase
- ✓ Identifié les patterns et conventions à respecter
- ✓ Répertorié les outils et commandes disponibles

## Phase 2: PLAN (Conception & Validation)

Concevez une stratégie d'implémentation détaillée basée sur votre exploration. Cette phase nécessite **impérativement** une validation de l'utilisateur avant de continuer.

### Étape 2.1: Créer un plan détaillé
Utilisez l'outil **TodoWrite** pour créer un plan structuré avec :
- Toutes les étapes d'implémentation identifiées
- Les fichiers à modifier ou créer
- Les considérations de sécurité
- Les cas limites à gérer
- L'approche technique retenue

### Étape 2.2: Identifier les incertitudes
**OBLIGATOIRE :** Réfléchissez de manière critique à votre plan et identifiez :
- Les choix d'implémentation pour lesquels plusieurs approches sont possibles
- Les aspects de la tâche qui ne sont pas parfaitement clairs
- Les suppositions que vous faites et qui pourraient être erronées
- Les points sur lesquels l'utilisateur devrait donner son avis

**CRITIQUE :** Ne devinez pas. Si vous n'êtes pas sûr à 100%, posez la question.

### Étape 2.3: Demander validation à l'utilisateur
**ARRÊT OBLIGATOIRE :** Avant de passer à la phase Code, vous DEVEZ :

1. **Utiliser AskUserQuestion** pour poser toutes vos questions sur :
   - Les choix d'architecture ou d'approche
   - Les incertitudes sur les exigences
   - Les préférences de l'utilisateur
   - Tout point qui pourrait être ambigu

2. **Présenter votre plan** à l'utilisateur et demander explicitement :
   - "Voulez-vous que je procède avec ce plan ?"
   - "Y a-t-il des ajustements à faire avant de commencer l'implémentation ?"

3. **Attendre la confirmation** de l'utilisateur avant de passer à la phase Code

**Important :** Cette pause de validation est NON NÉGOCIABLE. Elle évite de coder dans la mauvaise direction.

## Phase 3: CODE (Implémentation)

Une fois le plan validé par l'utilisateur, implémentez la solution complètement et méthodiquement.

### Actions à entreprendre :
- Suivez le plan validé étape par étape
- Implémentez l'intégralité de la fonctionnalité demandée
- Respectez scrupuleusement les conventions du codebase
- Réutilisez les abstractions existantes
- Marquez chaque tâche TodoWrite comme complétée au fur et à mesure

### Principes de qualité :
- **Évitez le sur-engineering** : Faites uniquement ce qui est demandé
- **Préférez éditer plutôt que créer** : Modifiez les fichiers existants quand c'est possible
- **Solutions générales** : Ne codez pas en dur pour faire passer des tests
- **Sécurité** : Attention aux vulnérabilités (XSS, injection SQL/commandes, CSRF, etc.)
- **Simplicité** : La solution la plus simple est souvent la meilleure

## Phase 4: TEST (Validation)

Validez votre implémentation en utilisant **UNIQUEMENT** les outils et tests qui existent déjà dans le projet.

### Étape 4.1: Identifier les outils de validation disponibles
**OBLIGATOIRE :** Lisez les fichiers de configuration pour identifier ce qui existe :
- Consultez `package.json` pour voir les scripts disponibles (eslint, test, build, typecheck, etc.)
- Vérifiez `tsconfig.json` pour TypeScript
- Cherchez `.eslintrc` ou `eslint.config.js` pour ESLint
- Identifiez les fichiers de test existants

### Étape 4.2: Exécuter les validations existantes
**UNIQUEMENT** les commandes qui existent réellement :
- Si `npm run lint` existe → Exécutez-le
- Si TypeScript est configuré → Exécutez `tsc --noEmit` ou la commande appropriée
- Si des tests existent → Exécutez `npm test` ou la commande appropriée
- Si `npm run build` existe → Exécutez-le pour vérifier qu'il n'y a pas d'erreurs

**INTERDIT :**
- ❌ Ne créez PAS de nouveaux tests s'il n'y en a pas
- ❌ Ne lancez PAS de commandes qui n'existent pas dans package.json
- ❌ Ne supposez PAS qu'un outil est configuré sans l'avoir vérifié

### Étape 4.3: Test manuel si nécessaire
Si les tests automatisés n'existent pas ou sont insuffisants :
- Vérifiez manuellement le comportement de la fonctionnalité
- Testez les cas limites
- Validez la gestion des erreurs

### Étape 4.4: Rapport final
Informez l'utilisateur des résultats :
- ✓ Quelles validations ont été exécutées
- ✓ Les résultats (succès/échecs)
- ✓ Les éventuels problèmes détectés

</epct_workflow>

<task_context>
$ARGUMENTS
</task_context>

## Instructions d'exécution

Suivez **rigoureusement** et **séquentiellement** les quatre phases ci-dessus pour accomplir la tâche décrite dans `<task_context>`.

### Règles impératives :
1. ✓ **NE SAUTEZ AUCUNE PHASE** - Chaque phase doit être complétée
2. ✓ **ARRÊT OBLIGATOIRE après la phase Plan** - Attendez la validation utilisateur
3. ✓ **Posez des questions** - Utilisez AskUserQuestion pour les incertitudes
4. ✓ **Pas d'hallucinations** - Ne devinez jamais, vérifiez toujours
5. ✓ **Tests existants uniquement** - N'inventez pas de commandes de test

### Progression :
- Utilisez TodoWrite dès la phase Plan
- Indiquez clairement quand vous changez de phase
- Fournissez des mises à jour après chaque action majeure

**Commencez maintenant par la Phase 1: EXPLORE**
