# Commande: /debug-trace

Debugging avancé avec traçage et analyse de problèmes.

## Argument

$ARGUMENTS = Description du problème ou comportement inattendu

## Workflow

### Phase 1: Collecte d'informations

**Questions à poser** (via AskUserQuestion si nécessaire) :
- Quand le problème se produit-il ?
- Est-ce reproductible ? À quelle fréquence ?
- Quel est le comportement attendu vs observé ?
- Y a-t-il des messages d'erreur ?
- Environnement : dev, staging, prod ?

**Données à collecter** :
- Logs pertinents
- Messages d'erreur complets
- Stack traces
- État de l'application au moment du bug

### Phase 2: Reproduction

**Objectif** : Reproduire le bug de manière fiable.

1. **Identifier le scénario**
   - Actions utilisateur précises
   - Données d'entrée spécifiques
   - État initial requis

2. **Créer un cas de test minimal**
   - Isoler le problème
   - Simplifier au maximum
   - Documenter les étapes

### Phase 3: Analyse du flux

**Traçage du code** :

1. **Point d'entrée** : Où commence le flux ?
2. **Chemin d'exécution** : Quelles fonctions sont appelées ?
3. **Point de défaillance** : Où exactement ça casse ?

**Outils d'analyse** :
- Lecture du code source
- Ajout de console.log stratégiques (temporaires)
- Analyse des types TypeScript
- Vérification des états React (si applicable)

### Phase 4: Hypothèses et validation

**Méthode scientifique** :

1. **Formuler des hypothèses**
   - Hypothèse 1 : [cause possible]
   - Hypothèse 2 : [cause possible]
   - Hypothèse 3 : [cause possible]

2. **Tester chaque hypothèse**
   - Comment valider/invalider ?
   - Quel test effectuer ?

3. **Documenter les résultats**
   - ❌ Hypothèse 1 : invalidée car [raison]
   - ✅ Hypothèse 2 : confirmée car [raison]

### Phase 5: Identification de la cause racine

**Questions à se poser** :
- Pourquoi ce code a-t-il été écrit ainsi ?
- Quand le bug a-t-il été introduit ?
- Est-ce une régression ?
- Y a-t-il d'autres endroits avec le même problème ?

**Analyse** :
- `git log` pour l'historique des modifications
- `git blame` pour identifier les changements
- Recherche de patterns similaires dans le codebase

### Phase 6: Solution

**Présentation au user** :

```markdown
## Diagnostic

**Problème** : [description précise]

**Cause racine** : [explication technique]

**Fichier(s) concerné(s)** :
- `path/to/file.ts:123` - [description]

## Solution proposée

**Approche** : [explication de la solution]

**Changements** :
1. [modification 1]
2. [modification 2]

**Risques** : [impacts potentiels]

**Tests à effectuer** :
- [ ] Vérifier que le bug est corrigé
- [ ] Vérifier qu'il n'y a pas de régression
```

**Attends validation avant d'implémenter.**

### Phase 7: Correction et vérification

1. Applique la correction
2. Vérifie que le bug est résolu
3. Lance les tests existants
4. Vérifie le build

### Phase 8: Post-mortem (optionnel)

**Si le bug était critique** :

```markdown
## Post-mortem

**Impact** : [utilisateurs affectés, durée]

**Timeline** :
- HH:MM - Bug détecté
- HH:MM - Diagnostic commencé
- HH:MM - Cause identifiée
- HH:MM - Fix déployé

**Cause racine** : [résumé]

**Actions préventives** :
- [ ] Ajouter un test pour ce cas
- [ ] Améliorer le monitoring
- [ ] Documenter le gotcha
```

## Techniques de debugging

### Console debugging
```typescript
console.log('🔍 [function] state:', { var1, var2 });
console.trace('📍 Call stack');
console.time('⏱️ operation'); // ... console.timeEnd('⏱️ operation');
```

### React debugging
```typescript
useEffect(() => {
  console.log('🔄 Effect triggered:', { deps });
}, [deps]);
```

### Network debugging
- Onglet Network des DevTools
- Vérifier les payloads request/response
- Vérifier les headers

### State debugging
- React DevTools
- Redux DevTools (si applicable)
- Breakpoints dans le code

## Principes

- **Reproduire avant de fixer**
- **Une hypothèse à la fois**
- **Documenter le cheminement**
- **Ne pas deviner, vérifier**
- **Nettoyer les console.log après**
