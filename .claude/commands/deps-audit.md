# Commande: /deps-audit

Audit complet des dépendances : sécurité, obsolescence, licences.

## Argument

$ARGUMENTS = [focus] (optionnel : security, outdated, licenses, unused, all)
- Par défaut : all

## Workflow

### Phase 1: Inventaire des dépendances

**Collecter** :
```bash
npm list --depth=0
npm list --all > deps-tree.txt
```

**Analyser** :
- Nombre total de dépendances (directes + transitives)
- Répartition prod vs dev
- Taille des packages principaux

### Phase 2: Audit de sécurité

**Commandes** :
```bash
npm audit
npm audit --json > audit-report.json
```

**Classification** :
| Sévérité | Action |
|----------|--------|
| Critical | Fix immédiat obligatoire |
| High | Fix dans les 24h |
| Moderate | Fix dans la semaine |
| Low | Planifier |

**Résolution** :
```bash
npm audit fix           # Fix automatique (safe)
npm audit fix --force   # Fix avec breaking changes (attention)
```

### Phase 3: Dépendances obsolètes

**Commande** :
```bash
npm outdated
```

**Analyse** :
| Package | Current | Wanted | Latest | Action |
|---------|---------|--------|--------|--------|
| react | 18.2.0 | 18.2.0 | 18.3.1 | Minor update |
| next | 14.0.0 | 14.2.0 | 15.0.0 | Évaluer breaking changes |

**Priorisation des mises à jour** :
1. **Sécurité** : Mises à jour avec fixes de sécurité
2. **Patch** : Bug fixes (X.X.1 → X.X.2)
3. **Minor** : Nouvelles features backward-compatible (X.1.X → X.2.X)
4. **Major** : Breaking changes (1.X.X → 2.X.X) - planifier

### Phase 4: Dépendances inutilisées

**Outils** :
```bash
npx depcheck
```

**Recherche manuelle** :
- Grep les imports dans le codebase
- Vérifier chaque dépendance listée dans package.json
- Identifier les dépendances de dev réellement utilisées

**Candidats à la suppression** :
- Packages importés nulle part
- Packages utilisés une seule fois (peut-être inline-able)
- Packages avec des alternatives plus légères

### Phase 5: Analyse des licences

**Licences safe** :
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- CC0-1.0

**Licences à attention** :
- GPL-2.0, GPL-3.0 (copyleft)
- LGPL (moins restrictif que GPL)
- AGPL (très restrictif)

**Licences problématiques** :
- Proprietary
- UNLICENSED
- Pas de licence spécifiée

**Commande** :
```bash
npx license-checker --summary
npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"
```

### Phase 6: Analyse supply chain

**Vérifications** :
- [ ] Packages provenant de sources fiables (npm registry)
- [ ] Pas de typosquatting (ex: `lodas` au lieu de `lodash`)
- [ ] Mainteneurs actifs (dernière release < 1 an)
- [ ] Nombre de téléchargements hebdo raisonnable
- [ ] Pas de changement suspect de mainteneur

**Red flags** :
- Package très récent avec peu d'historique
- Nom très similaire à un package populaire
- Beaucoup de dépendances pour peu de fonctionnalités
- Post-install scripts suspects

### Phase 7: Rapport

```markdown
# Dependency Audit Report

## Résumé
- Total dépendances : X (Y directes, Z transitives)
- Vulnérabilités : X critical, Y high, Z moderate
- Obsolètes : X packages
- Inutilisées : X packages
- Licences problématiques : X

## Sécurité 🔒

### Vulnérabilités critiques
| Package | Severity | Via | Fix |
|---------|----------|-----|-----|

### Actions immédiates
```bash
npm audit fix
npm update [package]
```

## Mises à jour recommandées 📦

### Priorité haute (sécurité)
| Package | Current | Target | Breaking? |
|---------|---------|--------|-----------|

### Priorité moyenne (features)
| Package | Current | Target | Breaking? |

## À supprimer 🗑️
- `unused-package` - Non utilisé
- `deprecated-lib` - Remplacer par X

## Licences ⚖️
- ✅ MIT : X packages
- ✅ Apache-2.0 : Y packages
- ⚠️ GPL-3.0 : Z packages (attention copyleft)

## Recommandations
1. [Action 1]
2. [Action 2]
3. [Action 3]
```

## Bonnes pratiques

- **Audit régulier** : Minimum 1x/semaine
- **Lockfile** : Toujours commiter `package-lock.json`
- **Mises à jour progressives** : Un package à la fois
- **Tests après update** : Toujours vérifier le build et les tests
- **Documenter les exceptions** : Si un package vulnérable ne peut pas être mis à jour
