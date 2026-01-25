# Commande: /doc-generate

Génération automatique de documentation technique.

## Argument

$ARGUMENTS = [type] [scope] (optionnel)
- type : api, components, architecture, readme, all
- scope : fichier ou dossier spécifique
- Par défaut : all sur le projet

## Workflow

### Phase 1: Analyse du codebase

**Éléments à documenter** :
- Routes API (`app/api/**`)
- Composants React (`components/**`)
- Hooks personnalisés (`hooks/**`)
- Utilitaires (`lib/**`, `utils/**`)
- Types et interfaces (`types/**`)
- Configuration

### Phase 2: Documentation API

**Pour chaque route API** :

```markdown
## POST /api/example

**Description** : Courte description de l'endpoint

**Authentification** : Required / Optional / None

**Headers** :
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

**Body** :
```json
{
  "field": "string (required) - Description"
}
```

**Réponses** :
| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Validation error |
| 401 | Non authentifié |
| 500 | Erreur serveur |

**Exemple** :
```bash
curl -X POST /api/example \
  -H "Authorization: Bearer xxx" \
  -d '{"field": "value"}'
```
```

### Phase 3: Documentation des composants

**Pour chaque composant** :

```markdown
## ComponentName

**Chemin** : `components/ComponentName.tsx`

**Description** : Ce que fait le composant

**Props** :
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | string | Yes | - | Titre affiché |
| onClick | () => void | No | undefined | Callback au clic |

**Exemple d'utilisation** :
```tsx
<ComponentName title="Hello" onClick={() => console.log('clicked')} />
```

**Notes** :
- Point d'attention 1
- Point d'attention 2
```

### Phase 4: Documentation d'architecture

**Structure du projet** :
```
project/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API
│   ├── (public)/          # Pages publiques
│   └── (protected)/       # Pages authentifiées
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   └── features/         # Composants métier
├── lib/                   # Logique métier
├── hooks/                 # Hooks React personnalisés
├── types/                 # Types TypeScript
└── utils/                 # Utilitaires
```

**Diagrammes** (format Mermaid) :
- Flow d'authentification
- Architecture de données
- Flux utilisateur principaux

### Phase 5: README.md

**Structure** :
```markdown
# Nom du Projet

Description courte du projet.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- ...

## Installation

```bash
git clone [repo]
cd [project]
npm install
cp .env.example .env.local
npm run dev
```

## Variables d'environnement

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | URL de la BDD | Yes |

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur de dev |
| `npm run build` | Build de production |
| `npm run test` | Lance les tests |

## Architecture

[Résumé de l'architecture]

## Contribution

[Guide de contribution]

## License

[License]
```

### Phase 6: Génération des fichiers

**Fichiers créés/mis à jour** :
- `README.md` - Documentation principale
- `docs/API.md` - Documentation des routes API
- `docs/COMPONENTS.md` - Documentation des composants
- `docs/ARCHITECTURE.md` - Documentation d'architecture
- `CONTRIBUTING.md` - Guide de contribution

### Phase 7: Validation

**Vérifications** :
- [ ] Tous les endpoints API sont documentés
- [ ] Tous les composants publics sont documentés
- [ ] Les exemples de code sont valides
- [ ] Les liens internes fonctionnent
- [ ] Le README est complet et à jour

## Format de sortie

```markdown
# Documentation Generated

## Fichiers créés
- ✅ `README.md` (mis à jour)
- ✅ `docs/API.md` (créé)
- ✅ `docs/COMPONENTS.md` (créé)

## Statistiques
- Routes API documentées : X
- Composants documentés : Y
- Hooks documentés : Z

## À compléter manuellement
- [ ] Descriptions métier détaillées
- [ ] Diagrammes d'architecture
- [ ] Exemples d'utilisation avancés
```

## Principes

- **DRY** : Extraire les infos du code, pas les dupliquer
- **À jour** : La doc doit refléter le code actuel
- **Utile** : Focus sur ce que les devs ont besoin
- **Exemples** : Toujours inclure des exemples concrets
- **Maintenable** : Préférer la doc proche du code (JSDoc) quand possible
