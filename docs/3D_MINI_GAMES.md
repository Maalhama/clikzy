# Mini-Jeux 3D - Documentation

## Vue d'ensemble

Les mini-jeux Cleekzy ont été transformés en expériences 3D immersives utilisant **React Three Fiber** et **Rapier Physics**. L'infrastructure 3D respecte strictement la direction artistique (DA) du projet avec les couleurs neon purple (#9B5CFF), blue (#3CCBFF), et pink (#FF4FD8).

## Architecture

```
src/components/mini-games/
├── 3d/
│   ├── core/
│   │   ├── GameCanvas.tsx        # Wrapper principal pour tous les jeux 3D
│   │   ├── GameLighting.tsx      # Éclairage standardisé (DA)
│   │   ├── GameEnvironment.tsx   # Environment map et fog
│   │   └── PhysicsWorld.tsx      # Configuration Rapier
│   ├── Pachinko3D.tsx            # Pachinko avec physique réaliste
│   └── [autres jeux à venir]
├── PachinkoWrapper.tsx           # Détection 3D/2D automatique
└── [versions 2D Canvas legacy]

src/lib/mini-games/
├── materials.ts                  # Matériaux PBR partagés

src/hooks/mini-games/
└── use3DPerformance.ts          # Détection capacités WebGL2
```

## Composants Core

### 1. GameCanvas

Wrapper standardisé pour tous les mini-jeux 3D. Configure automatiquement :
- Camera (position, FOV)
- Rendu (antialiasing, DPR, performances)
- Physique Rapier (optionnel)
- Éclairage selon la DA
- Ombres de contact
- Environment map
- Suspense avec fallback

**Usage :**

```tsx
import { GameCanvas } from '@/components/mini-games/3d/core/GameCanvas'

<GameCanvas
  cameraPosition={[0, 0, 12]}
  cameraFov={50}
  enablePhysics={true}
  gravity={[0, -9.81, 0]}
  enableShadows={true}
  primaryNeonColor={NEON_COLORS.purple}
  secondaryNeonColor={NEON_COLORS.blue}
>
  {/* Votre scène 3D ici */}
</GameCanvas>
```

**Props :**

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `cameraPosition` | `[number, number, number]` | `[0, 0, 5]` | Position de la caméra |
| `cameraFov` | `number` | `45` | Field of view |
| `enablePhysics` | `boolean` | `false` | Activer Rapier |
| `gravity` | `[number, number, number]` | `[0, -9.81, 0]` | Gravité |
| `enableShadows` | `boolean` | `true` | Ombres de contact |
| `enableControls` | `boolean` | `false` | OrbitControls |
| `primaryNeonColor` | `string` | `NEON_COLORS.purple` | Couleur neon principale |
| `secondaryNeonColor` | `string` | `NEON_COLORS.blue` | Couleur neon secondaire |

### 2. GameLighting

Éclairage standardisé respectant la DA Cleekzy.

**Configuration par défaut :**
- Lumière ambiante : 0.4
- Spotlight principal : 1.2 (position [10, 10, 10])
- Neon purple : pointLight à [5, 0, 5]
- Neon blue : pointLight à [-5, 0, -5]
- Neon pink : pointLight à [0, -3, 3]
- Rim light : pointLight à [-10, -10, -10]

**Usage :**

```tsx
import { GameLighting } from '@/components/mini-games/3d/core/GameLighting'

<GameLighting
  ambientIntensity={0.4}
  spotIntensity={1.2}
  enableNeonLights={true}
/>
```

### 3. PhysicsWorld

Wrapper Rapier pour la simulation physique.

**Usage :**

```tsx
import { PhysicsWorld } from '@/components/mini-games/3d/core/PhysicsWorld'

<PhysicsWorld gravity={[0, -9.81, 0]} debug={false}>
  {/* Objets physiques (RigidBody) */}
</PhysicsWorld>
```

### 4. GameEnvironment

Environment map pour les réflexions et l'ambiance.

**Usage :**

```tsx
import { GameEnvironment } from '@/components/mini-games/3d/core/GameEnvironment'

<GameEnvironment preset="city" environmentIntensity={1} enableFog={false} />
```

## Matériaux (materials.ts)

### Couleurs Neon

```tsx
import { NEON_COLORS } from '@/lib/mini-games/materials'

NEON_COLORS.purple  // #9B5CFF
NEON_COLORS.blue    // #3CCBFF
NEON_COLORS.pink    // #FF4FD8
NEON_COLORS.green   // #00FF88
NEON_COLORS.orange  // #FFB800
NEON_COLORS.red     // #FF4757
```

### Matériaux PBR Prédéfinis

```tsx
import { GAME_MATERIALS } from '@/lib/mini-games/materials'

// Neon émissifs
GAME_MATERIALS.neonPurple
GAME_MATERIALS.neonBlue
GAME_MATERIALS.neonPink
GAME_MATERIALS.neonGreen

// Métalliques
GAME_MATERIALS.metalChrome
GAME_MATERIALS.metalGold

// Gaming
GAME_MATERIALS.darkPlastic
GAME_MATERIALS.glass
GAME_MATERIALS.glowBall
GAME_MATERIALS.woodTable
GAME_MATERIALS.rubber
```

**Exemple d'usage :**

```tsx
<Sphere args={[0.5, 32, 32]}>
  <meshStandardMaterial {...GAME_MATERIALS.neonPurple} />
</Sphere>
```

### Fonctions Helpers

```tsx
import { createGlowMaterial, createMetallicMaterial } from '@/lib/mini-games/materials'

// Matériau glow custom
const myGlow = createGlowMaterial('#FF00FF', 1.2)

// Matériau métallique custom
const myMetal = createMetallicMaterial('#FFD700', 0.9, 0.1)
```

## Détection de Support 3D

### use3DPerformance Hook

Détecte automatiquement si le device peut utiliser la 3D.

```tsx
import { use3DPerformance, useCanUse3D } from '@/hooks/mini-games/use3DPerformance'

// Version complète (toutes les infos)
const { canUse3D, isLowEnd, isMobile, supportsWebGL2 } = use3DPerformance()

// Version simplifiée (juste le booléen)
const canUse3D = useCanUse3D()
```

**Critères de détection :**
- ✅ WebGL2 supporté
- ✅ Desktop OU mobile haut de gamme (4+ cores)
- ❌ Mobile low-end (≤2 cores) → Fallback 2D

## Pachinko 3D - Exemple Complet

### Features

- ✅ Physique réaliste Rapier
- ✅ Bille métallique avec glow neon purple
- ✅ 7 rangées de pegs cylindriques avec collisions
- ✅ 9 slots avec valeurs [0,0,1,3,10,3,1,0,0]
- ✅ Traînée lumineuse derrière la bille
- ✅ Système de particules sur collisions
- ✅ Lumières neon par slot (pink pour x10, purple pour x3, blue pour x1)
- ✅ Biais vers le slot cible (comme version 2D)
- ✅ Détection automatique de landing

### Configuration Physique

| Paramètre | Valeur | Équivalent 2D |
|-----------|--------|---------------|
| Gravité | `[0, -9.81, 0]` | `0.15` (ralenti) |
| Restitution (bounce) | `0.65` | `0.65` |
| Friction | `0.3` | - |
| Linear Damping | `0.05` | `0.995` (friction air) |

### Wrapper Automatique 3D/2D

```tsx
import PachinkoWrapper from '@/components/mini-games/PachinkoWrapper'

<PachinkoWrapper
  onComplete={(creditsWon) => console.log(`Gagné: ${creditsWon}`)}
  targetSlot={4}
  disabled={false}
/>
```

Le wrapper détecte automatiquement :
- Si WebGL2 supporté → Pachinko3D
- Sinon → Pachinko 2D Canvas (legacy)

## Bonnes Pratiques

### 1. Performances

- ✅ Limiter DPR à `[1, 2]` (jamais plus)
- ✅ Utiliser `Suspense` avec fallback
- ✅ Lazy load les composants 3D lourds
- ✅ Désactiver 3D sur mobile low-end
- ✅ Utiliser `powerPreference: 'high-performance'`

### 2. Physique Rapier

- ✅ Toujours spécifier `colliders={false}` sur RigidBody si tu utilises des colliders custom
- ✅ Utiliser `BallCollider` pour les sphères
- ✅ Utiliser `CylinderCollider` pour les cylindres
- ✅ Mettre les objets statiques en `type="fixed"`
- ✅ Limiter le nombre de RigidBody actifs (max 100-200)

### 3. Éclairage

- ✅ Toujours utiliser `GameLighting` pour la cohérence DA
- ✅ Ajouter des pointLight locales pour les objets qui brillent
- ✅ Limiter l'intensité émissive (max 1.5)
- ✅ Utiliser `toneMapped: false` pour les neon très vifs

### 4. Matériaux

- ✅ Réutiliser `GAME_MATERIALS` au maximum
- ✅ Utiliser les couleurs `NEON_COLORS` pour la cohérence
- ✅ Privilégier `meshStandardMaterial` (PBR)
- ✅ Éviter `meshBasicMaterial` (sauf particules)

## Roadmap

### ✅ Complété
- [x] Infrastructure core (GameCanvas, Lighting, Physics, Environment)
- [x] Matériaux PBR avec DA
- [x] Détection de support 3D
- [x] **Pachinko 3D** - Physique réaliste avec bille, pegs et slots lumineux
- [x] **Roue de la Fortune 3D** - Rotation avec segments 3D et pointeur
- [x] **Dés 3D** - Simulation physique complète avec Rapier

### 🚧 En cours
- [ ] Machine à Sous 3D (rouleaux animés)
- [ ] Pièce 3D (flip animation)

### 📋 Prochaines étapes
- [ ] Optimisation bundle size
- [ ] Tests E2E 3D
- [ ] Support tactile mobile (swipe to launch)
- [ ] Audio spatial 3D
- [ ] Effets post-processing (bloom, glow)
- [ ] Intégration dans les pages de mini-jeux

## Dépendances

```json
{
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "@react-three/rapier": "^2.x",
  "three": "^0.x"
}
```

## Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Components](https://github.com/pmndrs/drei)
- [Rapier Physics](https://rapier.rs/)
- [Three.js Docs](https://threejs.org/docs/)

---

**Maintainers:** Claude Sonnet 4.5
**Last Updated:** 2026-01-25
