---
description: Sélection dynamique d'agents spécialisés selon le problème
argument-hint: [description du problème]
---

# Commande: /smart-agent

Route automatiquement les problèmes vers les agents spécialisés appropriés.

## Argument

$ARGUMENTS = Description du problème ou de la tâche

## Workflow

### Phase 1: Analyse du problème

Parse le problème pour identifier :
- **Domaine** : Frontend, Backend, Database, DevOps, Security
- **Type** : Bug, Feature, Performance, Refactoring
- **Complexité** : Simple, Moyenne, Complexe
- **Urgence** : Critique, Haute, Normale, Basse

### Phase 2: Sélection d'agents

**Matrice de routing** :

| Domaine + Type | Agent(s) |
|----------------|----------|
| Bug Frontend | `explore-codebase` → `hotfix` |
| Bug Backend | `explore-codebase` + `explore-db` → `hotfix` |
| Bug Database | `explore-db` → `hotfix` |
| Feature simple | `explore-codebase` → `dev` |
| Feature complexe | `explore-codebase` + `explore-docs` → `plan-feature` → `epct` |
| Performance | `explore-codebase` → `debug-trace` → `refactor-clean` |
| Security | `explore-codebase` → `security-scan` → `hotfix` |
| Refactoring | `explore-codebase` → `review` → `refactor-clean` |
| DevOps | `websearch` → `explore-docs` |
| Unknown | `websearch` + `explore-codebase` |

### Phase 3: Orchestration multi-agents

**Pour les problèmes simples** (1 domaine) :
```
Agent 1 (explore) → Agent 2 (action)
```

**Pour les problèmes complexes** (multi-domaines) :
```
[Agent 1] ─┬─→ [Agent 3 (synthèse)]
[Agent 2] ─┘
```

### Phase 4: Exécution

Lance les agents en parallèle quand possible :

```markdown
## Agents lancés

### Exploration (parallèle)
- 🔍 `explore-codebase` : Recherche du code concerné
- 🔍 `explore-db` : Analyse des tables liées

### Action (séquentiel)
- 🛠️ `hotfix` : Correction du problème
- ✅ `review` : Validation de la correction
```

## Agents disponibles

### Exploration

| Agent | Spécialité | Déclencheurs |
|-------|------------|--------------|
| `explore-codebase` | Code source, patterns | Tout problème de code |
| `explore-db` | Schéma, migrations, requêtes | Problèmes de données |
| `explore-docs` | Documentation libs | Nouvelle lib, API externe |
| `websearch` | Info externe, patterns récents | Info non trouvée localement |

### Action

| Agent | Spécialité | Déclencheurs |
|-------|------------|--------------|
| `dev` | Implémentation | Nouvelle feature |
| `hotfix` | Correction | Bug, régression |
| `refactor-clean` | Refactoring | Code smell, tech debt |
| `review` | Validation | Avant merge |

### Workflow complet

| Agent | Spécialité | Déclencheurs |
|-------|------------|--------------|
| `epct` | Cycle complet | Feature complexe |
| `tdd-cycle` | Test-Driven | Logique critique |
| `plan-feature` | Planification | Gros changement |

## Règles de priorité

1. **Sécurité d'abord** : Si mention de sécurité/vulnérabilité → `security-scan`
2. **Données critiques** : Si mention de BDD/données → `explore-db`
3. **Urgence** : Si "urgent", "prod down", "critique" → route directe sans exploration longue
4. **Inconnu** : Si domaine incertain → `websearch` + `explore-codebase` en parallèle

## Patterns courants

### Bug en production
```
1. explore-codebase (find code)
2. explore-db (if data related)
3. hotfix (fix it)
4. review (validate)
```

### Nouvelle feature
```
1. explore-codebase (existing patterns)
2. explore-docs (if new lib needed)
3. plan-feature (design)
4. epct (implement)
```

### Problème de performance
```
1. explore-codebase (identify bottleneck)
2. debug-trace (profile)
3. refactor-clean (optimize)
4. review (validate)
```

### Problème inconnu
```
1. websearch (external solutions)
2. explore-codebase (local context)
3. [route selon findings]
```

## Format de sortie

```markdown
## Smart Agent Analysis

**Problème détecté** : [résumé]
**Domaine** : [Frontend/Backend/DB/etc.]
**Type** : [Bug/Feature/Perf/etc.]
**Complexité** : [Simple/Moyenne/Complexe]

**Plan d'agents** :
1. 🔍 [Agent exploration] - [objectif]
2. 🔍 [Agent exploration] - [objectif] (parallèle)
3. 🛠️ [Agent action] - [objectif]
4. ✅ [Agent validation] - [objectif]

**Lancement...**
```
