# Commande: /commits

Automatise le workflow git avec Conventional Commits.

## Argument

$ARGUMENTS = Message optionnel ou scope spécifique

## Workflow

### Étape 1: Stage
```bash
git add -A
```

### Étape 2: Analyse
Analyse le diff pour comprendre les changements :
```bash
git diff --cached
```

### Étape 3: Génération du message

Format : `<type>[scope optionnel]: <description>`

**Contraintes du sujet** :
- Max 50 caractères
- Mode impératif ("Add" pas "Added")
- Majuscule après le deux-points
- Pas de point final
- `!` pour breaking changes

### Types de commit

| Type | Description | Versioning |
|------|-------------|------------|
| `feat` | Nouvelle fonctionnalité | MINOR |
| `fix` | Correction de bug | PATCH |
| `docs` | Documentation uniquement | - |
| `style` | Formatage, pas de changement de code | - |
| `refactor` | Restructuration sans changement fonctionnel | - |
| `perf` | Amélioration de performance | - |
| `test` | Ajout ou modification de tests | - |
| `build` | Système de build, dépendances | - |
| `ci` | Configuration CI | - |
| `chore` | Maintenance, tâches diverses | - |

### Scope (optionnel)
Précise la zone affectée : `feat(auth): Add OAuth2 support`

### Body (optionnel)
Pour les changements complexes :
- Wrap à 72 caractères
- Explique le "pourquoi" pas le "quoi"

### Footer
Liens vers les issues :
- `Fixes #123`
- `Closes #123`
- `Refs #123`

### Étape 4: Commit
```bash
git commit -m "type(scope): description"
```

### Étape 5: Push
```bash
git push
```

## Exemples

```
feat(api): Add user authentication endpoint

fix(ui): Correct button alignment on mobile

docs: Update README with installation steps

refactor(db): Simplify query builder logic

feat!: Drop support for Node 14

fix(auth): Resolve token refresh race condition

Fixes #234
```

## Contraintes

- Pas d'interactivité
- Silencieux si aucun changement
- Reporte uniquement les erreurs de push critiques
