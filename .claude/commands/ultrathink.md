---
description: Active le mode de réflexion profonde pour les problèmes complexes
argument-hint: [problème complexe à analyser]
---

# Commande: /ultrathink

Active le mode de réflexion profonde (extended thinking) pour les problèmes complexes.

## Argument

$ARGUMENTS = Description du problème complexe

## Quand utiliser ultrathink

**Cas d'usage parfaits** :
- Décisions architecturales majeures
- Debugging de bugs difficiles/mystérieux
- Code reviews critiques
- Migrations de grande envergure
- Design de nouveaux patterns
- Analyse de sécurité approfondie
- Refactoring système

**Ne PAS utiliser pour** :
- Tâches simples (gaspillage de tokens)
- Questions directes
- Modifications mineures

## Mode de réflexion

ultrathink

**RÉFLEXION PROFONDE ACTIVÉE** - Budget de réflexion maximum (31,999 tokens).

## Workflow

### Phase 1: Décomposition du problème

Analyse le problème sous tous les angles :

1. **Comprendre le contexte**
   - Quel est l'état actuel ?
   - Quel est l'état désiré ?
   - Quelles sont les contraintes ?

2. **Identifier les sous-problèmes**
   - Décompose en parties gérables
   - Identifie les dépendances entre parties
   - Priorise par criticité

3. **Explorer les approches**
   - Liste TOUTES les solutions possibles
   - Pour chaque solution : avantages, inconvénients, risques
   - Ne rejette aucune option trop vite

### Phase 2: Analyse en profondeur

Pour chaque approche viable :

1. **Implications techniques**
   - Impact sur l'architecture existante
   - Changements nécessaires
   - Complexité d'implémentation

2. **Implications business**
   - Impact utilisateur
   - Risques de régression
   - Coût de maintenance future

3. **Edge cases et failure modes**
   - Que se passe-t-il si X échoue ?
   - Cas limites non évidents
   - Scénarios de charge/stress

### Phase 3: Synthèse et recommandation

```markdown
## Analyse: [Problème]

### Contexte compris
[Résumé de la compréhension du problème]

### Approches évaluées

#### Option A: [Nom]
- **Description** : ...
- **Avantages** : ...
- **Inconvénients** : ...
- **Risques** : ...
- **Complexité** : [1-5]

#### Option B: [Nom]
- **Description** : ...
- **Avantages** : ...
- **Inconvénients** : ...
- **Risques** : ...
- **Complexité** : [1-5]

### Recommandation

**Option recommandée** : [X]

**Justification** :
1. [Raison 1]
2. [Raison 2]
3. [Raison 3]

**Plan d'implémentation** :
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Points d'attention** :
- [Warning 1]
- [Warning 2]
```

### Phase 4: Validation (optionnel)

Si demandé, critique ta propre analyse :

1. **Qu'est-ce qui pourrait être faux dans mon raisonnement ?**
2. **Quels biais ai-je pu avoir ?**
3. **Qu'est-ce que j'ai pu manquer ?**

## Techniques de réflexion profonde

### Chain of Thought
```
Étape 1 → Étape 2 → Étape 3 → Conclusion
```

### Think Step by Step
Explicite chaque étape du raisonnement.

### Self-Critique
"Maintenant, critique cette analyse et identifie les failles."

### Multi-Perspective
- Du point de vue du développeur...
- Du point de vue de l'utilisateur...
- Du point de vue de la maintenance...
- Du point de vue de la sécurité...

## Combinaisons puissantes

```bash
# Ultrathink + Plan Mode
/ultrathink + /plan-feature [feature complexe]

# Ultrathink + Review
/ultrathink + /review [PR critique]

# Ultrathink + Debug
/ultrathink + /debug-trace [bug mystérieux]
```

## Coût et optimisation

**Attention** : Ultrathink consomme beaucoup de tokens.

**Stratégie recommandée** :
1. Commence par "think" pour les problèmes moyens
2. Escalade vers "think hard" si nécessaire
3. Réserve "ultrathink" pour les vrais problèmes complexes

| Niveau | Trigger | Usage |
|--------|---------|-------|
| Base | (rien) | Tâches simples |
| Think | "think" | Problèmes standards |
| Think Hard | "think hard/harder" | Problèmes difficiles |
| **Ultrathink** | "ultrathink" | Problèmes très complexes |
