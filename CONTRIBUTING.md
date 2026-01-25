# Guide de contribution

Merci de contribuer à CLIKZY ! Ce guide explique comment participer au projet.

## Prérequis

- Node.js 18+
- npm
- Git
- Un éditeur avec support TypeScript (VS Code recommandé)

## Setup du projet

1. **Fork et clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/clikzy.git
   cd clikzy
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env.local
   # Remplir les variables nécessaires
   ```

4. **Lancer le projet**
   ```bash
   npm run dev
   ```

## Workflow Git

### Branches

| Branche | Usage |
|---------|-------|
| `main` | Production, toujours stable |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |
| `refactor/*` | Refactoring sans changement fonctionnel |

### Créer une branche

```bash
git checkout -b feature/ma-feature
```

### Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

**Types** :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactoring
- `style` : Changements de style (CSS, formatage)
- `docs` : Documentation
- `test` : Tests
- `chore` : Maintenance (deps, config)

**Exemples** :
```bash
git commit -m "feat(game): add winner celebration animation"
git commit -m "fix(auth): resolve magic link redirect issue"
git commit -m "refactor(lobby): extract game card component"
```

## Standards de code

### TypeScript

- **Strict mode** : Pas de `any`, types explicites
- **Interfaces** : Préférer `interface` pour les objets
- **Types** : Utiliser `type` pour les unions/intersections

```typescript
// Bon
interface GameProps {
  id: string
  status: GameStatus
}

// Éviter
const game: any = {}
```

### React

- **Server Components** : Par défaut pour les pages
- **Client Components** : Uniquement si interactivité nécessaire
- **Hooks** : Extraire la logique dans des hooks custom

```typescript
// Bon - Server Component
export default async function LobbyPage() {
  const games = await getActiveGames()
  return <GameList games={games} />
}

// Client Component si nécessaire
'use client'
export function ClickButton({ gameId }: { gameId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  // ...
}
```

### Styling

- **Tailwind CSS** : Classes utilitaires
- **Design tokens** : Utiliser les variables CSS définies
- **Responsive** : Mobile-first (`sm:`, `md:`, `lg:`)

```tsx
// Bon
<div className="p-4 bg-bg-secondary rounded-xl border border-white/10">

// Éviter
<div style={{ padding: '16px', background: '#141B2D' }}>
```

### Palette de couleurs

```css
--bg-primary: #0B0F1A;      /* Fond principal */
--bg-secondary: #141B2D;    /* Cartes */
--neon-purple: #9B5CFF;     /* Accent principal */
--neon-blue: #3CCBFF;       /* Accent secondaire */
--neon-pink: #FF4FD8;       /* Highlights */
--success: #00FF88;         /* Succès */
--danger: #FF4757;          /* Erreur */
```

## Structure des fichiers

### Composants

```
src/components/
├── ui/              # Composants génériques (Button, Input)
├── game/            # Composants liés au jeu
├── lobby/           # Composants du lobby
├── layout/          # Header, Footer, Navigation
└── modals/          # Modales
```

### Hooks

```
src/hooks/
├── game/            # Hooks liés au jeu
├── lobby/           # Hooks du lobby
└── useAuth.ts       # Hook d'authentification
```

### Actions

```
src/actions/
├── auth.ts          # Authentification
├── game.ts          # Actions de jeu
└── credits.ts       # Gestion des crédits
```

## Tests

### Tests unitaires (Vitest)

```bash
# Lancer les tests
npm run test

# Avec couverture
npm run test:coverage
```

**Emplacement** : `src/__tests__/`

```typescript
// src/__tests__/lib/utils.test.ts
import { formatTime } from '@/lib/utils/timer'

describe('formatTime', () => {
  it('formats milliseconds to mm:ss', () => {
    expect(formatTime(65000)).toBe('01:05')
  })
})
```

### Tests E2E (Playwright)

```bash
# Lancer les tests E2E
npm run test:e2e

# Mode UI
npm run test:e2e:ui
```

**Emplacement** : `tests/`

## Pull Request

### Checklist avant PR

- [ ] Code lint sans erreurs (`npm run lint`)
- [ ] Types OK (`npm run type-check`)
- [ ] Tests passent (`npm run test:run`)
- [ ] Build OK (`npm run build`)

### Template de PR

```markdown
## Description
[Description des changements]

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Refactoring
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tests manuels effectués

## Screenshots (si applicable)
[Captures d'écran]
```

## Bonnes pratiques

### Sécurité

- **Validation serveur** : Toujours valider côté serveur
- **RLS** : Row Level Security sur toutes les tables Supabase
- **Secrets** : Jamais de secrets dans le code, utiliser `.env`

### Performance

- **Server Components** : Privilégier pour le rendu initial
- **Lazy loading** : Charger les composants lourds dynamiquement
- **Images** : Utiliser `next/image` avec optimisation

### Accessibilité

- **Labels** : Tous les inputs ont des labels
- **Contraste** : Respecter les ratios WCAG
- **Keyboard** : Navigation clavier fonctionnelle

## Questions ?

Ouvrir une issue avec le tag `question`.
