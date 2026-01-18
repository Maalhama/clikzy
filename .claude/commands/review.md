# Commande: /review

Effectue une revue de code automatisée.

## Argument

$ARGUMENTS = [mode] [spec] [commit] [brief] [scope]
- Tous les arguments sont optionnels
- Par défaut : revue des changements locaux non commités

## Détection automatique

### Sources (par priorité)
1. Fichier de spec (markdown avec références de fichiers)
2. Hash/range de commit
3. Mode git (pushed ou local)
4. Description brève avec recherche codebase
5. Défaut : changements locaux non commités

### Scope automatique
Catégorise les fichiers en :
- **Backend** : Go, Python, Node.js, etc.
- **Frontend** : React, Vue, TypeScript, etc.
- **Config/Docs** : YAML, JSON, Markdown, etc.

## Workflow

### Phase 1: Identification
1. Détermine la source des changements
2. Liste les fichiers modifiés
3. Catégorise par scope

### Phase 2: Exploration parallèle
Lance les agents selon le scope :
- `explore-codebase` pour comprendre le contexte
- `explore-db` si des migrations sont présentes
- `explore-docs` pour les nouvelles libs utilisées

### Phase 3: Analyse

**Recherche de problèmes** :
- Code dupliqué
- Violations d'architecture
- Code mort ou non utilisé
- Problèmes de performance
- Failles de sécurité
- Mauvaise gestion d'erreurs

**Critères Backend** :
- Propreté du code
- Respect de l'architecture
- Gestion des erreurs
- Performance

**Critères Frontend** :
- Correction fonctionnelle
- Typage TypeScript strict
- Performance (memoization, etc.)
- Internationalisation
- Accessibilité

### Phase 4: Scoring

Note sur 10 pour chaque scope :
- **9-10** : Excellent, prêt pour prod
- **7-8** : Bon, améliorations mineures possibles
- **5-6** : Passable, corrections recommandées
- **< 5** : Problèmes majeurs à corriger

### Phase 5: Propositions

Classe les corrections par sévérité :
1. **Critique** : Bloque le merge
2. **Important** : Devrait être corrigé
3. **Nice-to-have** : Amélioration optionnelle

### Phase 6: Correction (optionnel)
Si l'utilisateur valide :
1. Applique les corrections
2. Vérifie le build
3. Résume les changements

## Format de sortie

```markdown
# Review: [Source]

## Score
- Backend: X/10
- Frontend: X/10

## Problèmes critiques
- [ ] Problème 1 (fichier:ligne)

## Problèmes importants
- [ ] Problème 2 (fichier:ligne)

## Améliorations suggérées
- [ ] Amélioration 1

## Points positifs
- Point 1
- Point 2
```
