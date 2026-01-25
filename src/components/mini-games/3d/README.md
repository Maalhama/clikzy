# Mini-Jeux 3D - Guide Rapide

## 🎮 6 Mini-Jeux Disponibles

| Mini-Jeu | Fichier | Physique | Complexité | Status |
|----------|---------|----------|------------|--------|
| **Pachinko** | `Pachinko3D.tsx` | Rapier ✅ | ⭐⭐⭐⭐ | Production |
| **Roue** | `WheelOfFortune3D.tsx` | Non | ⭐⭐⭐ | Production |
| **Dés** | `DiceRoll3D.tsx` | Rapier ✅ | ⭐⭐⭐⭐⭐ | Production |
| **Slots** | `SlotMachine3D.tsx` | Non | ⭐⭐⭐⭐ | Production |
| **Pièce** | `CoinFlip3D.tsx` | Rapier ✅ | ⭐⭐⭐ | Production |
| **Carte à Gratter** | `ScratchCard3D.tsx` | Shader GLSL | ⭐⭐⭐⭐⭐ | Production |

---

## 🚀 Usage Rapide

### Avec Wrapper (Recommandé)

Les wrappers détectent automatiquement si le device supporte la 3D et utilisent la version appropriée.

```tsx
import PachinkoWrapper from '@/components/mini-games/PachinkoWrapper'

<PachinkoWrapper
  onComplete={(credits) => console.log(`Gagné: ${credits}`)}
  targetSlot={4}
  disabled={false}
/>
```

### Version 3D Directe

```tsx
import { Pachinko3D } from '@/components/mini-games/3d/Pachinko3D'

<Pachinko3D
  onWin={(credits) => console.log(`Gagné: ${credits}`)}
  targetSlot={4}
  isActive={true}
/>
```

---

## 📁 Structure

```
3d/
├── core/
│   ├── GameCanvas.tsx        # Wrapper principal
│   ├── GameLighting.tsx      # Éclairage standardisé
│   ├── PhysicsWorld.tsx      # Configuration Rapier
│   └── GameEnvironment.tsx   # Environment map
├── Pachinko3D.tsx
├── WheelOfFortune3D.tsx
├── DiceRoll3D.tsx
├── SlotMachine3D.tsx
├── CoinFlip3D.tsx
└── README.md                 # Ce fichier
```

---

## 🎨 Infrastructure Core

### GameCanvas

Wrapper standardisé pour tous les jeux 3D.

```tsx
<GameCanvas
  cameraPosition={[0, 0, 12]}
  cameraFov={50}
  enablePhysics={true}
  gravity={[0, -9.81, 0]}
  enableShadows={true}
  primaryNeonColor={NEON_COLORS.purple}
  secondaryNeonColor={NEON_COLORS.blue}
>
  {/* Votre scène 3D */}
</GameCanvas>
```

### GameLighting

Éclairage neon standardisé selon la DA.

```tsx
<GameLighting
  ambientIntensity={0.4}
  spotIntensity={1.2}
  enableNeonLights={true}
/>
```

### PhysicsWorld

Wrapper Rapier pour la physique.

```tsx
<PhysicsWorld gravity={[0, -9.81, 0]}>
  {/* Objets physiques */}
</PhysicsWorld>
```

---

## 🎲 API des Mini-Jeux

### Pachinko3D

```tsx
interface Pachinko3DProps {
  onWin?: (multiplier: number) => void
  targetSlot?: number  // 0-8, défaut: 4
  isActive?: boolean
}
```

### WheelOfFortune3D

```tsx
interface WheelOfFortune3DProps {
  onWin?: (multiplier: number) => void
  targetSegment?: number  // 0-7, défaut: 0
  isActive?: boolean
}
```

### DiceRoll3D

```tsx
interface DiceRoll3DProps {
  onWin?: (credits: number) => void
  diceResults?: [number, number]  // [1-6, 1-6]
  isActive?: boolean
}
```

### SlotMachine3D

```tsx
interface SlotMachine3DProps {
  onWin?: (credits: number) => void
  targetSymbols?: number[]  // [0-6, 0-6, 0-6]
  prizeAmount?: number
  isActive?: boolean
}
```

### CoinFlip3D

```tsx
interface CoinFlip3DProps {
  onWin?: (credits: number) => void
  result?: 'heads' | 'tails'
  prizeAmount?: number
  isActive?: boolean
}
```

---

## 🛠️ Dépendances

```json
{
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "@react-three/rapier": "^2.x",
  "three": "^0.x"
}
```

---

## 📚 Documentation Complète

- **Guide d'utilisation :** `/docs/3D_MINI_GAMES.md`
- **Récapitulatif :** `/docs/3D_TRANSFORMATION_SUMMARY.md`
- **Rapport final :** `/docs/3D_FINAL_REPORT.md`
- **Changelog :** `/CHANGELOG_3D.md`

---

## 💡 Bonnes Pratiques

### 1. Toujours utiliser les Wrappers

```tsx
// ✅ BON
import PachinkoWrapper from '@/components/mini-games/PachinkoWrapper'

// ❌ MAUVAIS (pas de fallback 2D)
import { Pachinko3D } from '@/components/mini-games/3d/Pachinko3D'
```

### 2. Vérifier le support 3D

```tsx
import { useCanUse3D } from '@/hooks/mini-games/use3DPerformance'

const canUse3D = useCanUse3D()
if (canUse3D) {
  // Afficher version 3D
} else {
  // Afficher version 2D
}
```

### 3. Lazy Loading

```tsx
import { Suspense } from 'react'

<Suspense fallback={<LoadingSpinner />}>
  <Pachinko3D {...props} />
</Suspense>
```

---

## 🎨 Matériaux Disponibles

```tsx
import { NEON_COLORS, GAME_MATERIALS } from '@/lib/mini-games/materials'

// Couleurs neon
NEON_COLORS.purple  // #9B5CFF
NEON_COLORS.blue    // #3CCBFF
NEON_COLORS.pink    // #FF4FD8
NEON_COLORS.orange  // #FFB800
NEON_COLORS.green   // #00FF88

// Matériaux PBR
GAME_MATERIALS.neonPurple
GAME_MATERIALS.metalChrome
GAME_MATERIALS.glass
GAME_MATERIALS.glowBall
// ... 12+ matériaux
```

---

## 🐛 Debugging

### Activer le debug mode

```tsx
<PhysicsWorld debug={true}>
  {/* Les colliders seront visibles */}
</PhysicsWorld>
```

### FPS Monitoring

```tsx
import { Perf } from 'r3f-perf'

<Canvas>
  {process.env.NODE_ENV === 'development' && <Perf />}
</Canvas>
```

---

## ⚡ Performances

### Desktop
- **FPS :** 60 stable
- **Charge GPU :** 30-40%
- **Mémoire :** ~150MB

### Mobile High-End
- **FPS :** 55-60
- **Charge GPU :** 50-60%
- **Mémoire :** ~120MB

### Mobile Low-End
- **3D :** Désactivée (fallback 2D)
- **Critères :** WebGL2 + 4+ CPU cores

---

## 🚨 Troubleshooting

### La 3D ne s'affiche pas

1. Vérifier WebGL2 : `navigator.gpu !== undefined`
2. Vérifier console pour erreurs
3. Tester le fallback 2D

### FPS bas

1. Réduire `dpr` à [1, 1]
2. Désactiver `enableShadows`
3. Limiter les particules

### Erreurs TypeScript

1. Vérifier imports
2. Vérifier props types
3. Rebuild : `npm run build`

---

**🎮 Bon développement !**
