# CLIKZY - Vidéo Promo Professionnelle

## 📁 Structure

```
remotion/
├── config/
│   └── theme.ts              # Variables centralisées (couleurs, durées, easing)
├── pro-scenes/
│   ├── SceneIntro.tsx        # Scène 1: "Tu cliques. Tu gagnes."
│   ├── SceneHero.tsx         # Scène 2: Hero du site
│   ├── SceneGameplay.tsx     # Scène 3: Gameplay avec clics
│   ├── SceneTension.tsx      # Scène 4: Montée en tension
│   ├── SceneWin.tsx          # Scène 5: Victoire
│   └── SceneOutro.tsx        # Scène 6: CTA final
├── ClikzyProPro.tsx          # Composition principale
└── Root.tsx                  # Enregistrement des compositions
```

## 🎬 Timeline (30 secondes)

| Scène | Durée | Frames | Description |
|-------|-------|--------|-------------|
| 1. Intro | 2.5s | 0-75 | Accroche émotionnelle |
| 2. Hero | 3.5s | 75-180 | Présentation du site |
| 3. Gameplay | 9s | 180-450 | Démonstration du jeu |
| 4. Tension | 7s | 450-660 | Montée dramatique |
| 5. Win | 4.5s | 660-795 | Récompense |
| 6. Outro | 3.5s | 795-900 | CTA + Logo |

## 🎨 Personnalisation

### Modifier les couleurs

Éditer `config/theme.ts` :

```ts
export const COLORS = {
  neon: {
    purple: '#9B5CFF',  // Votre couleur
    pink: '#FF4FD8',
    cyan: '#3CCBFF',
  }
}
```

### Modifier les durées

```ts
export const SCENE_DURATION = {
  intro: 75,      // Changer ici (en frames)
  hero: 105,
  // ...
}
```

### Modifier les easing

```ts
export const EASING = {
  smooth: (t) => ...,  // Votre courbe
}
```

### Ajuster l'intensité des effets

```ts
export const EFFECTS = {
  glow: {
    min: 10,    // Glow minimal
    max: 20,    // Glow maximal
  }
}
```

## 🚀 Utilisation

### Prévisualiser

```bash
npm run remotion:studio
```

Puis ouvrir http://localhost:3000 et sélectionner **"ClikzyProPro"**

### Rendre en vidéo

```bash
npm run remotion:render ClikzyProPro out/clikzy-promo.mp4
```

### Format TikTok/Reels (9:16)

Dans `Root.tsx`, ajouter :

```tsx
<Composition
  id="ClikzyProPro-Vertical"
  component={ClikzyProPro}
  durationInFrames={900}
  fps={30}
  width={1080}
  height={1920}  // 9:16
/>
```

Puis ajuster les positions dans les scènes pour le format vertical.

## 📝 Approche Design

### Principes suivis

✅ **Narratif clair** : Parcours utilisateur réaliste
✅ **Build-up progressif** : Tension qui monte
✅ **Glow léger** : Pas de surcharge visuelle
✅ **Transitions fluides** : Easing professionnels
✅ **Variables centralisées** : Facile à personnaliser

### Effets utilisés

- **Caméra** : Zoom subtil, shake léger
- **Transitions** : Fade, slide, scale avec easing custom
- **Glow** : Pulse synchronisé, intensité progressive
- **Particules** : Légères, contextuelles
- **Typography** : Kinetic, gradient animé

## 🎯 Optimisations possibles

### Performance

- Les scènes ne rendent que quand elles sont visibles
- Pas de composants lourds (Three.js évité pour la légèreté)
- Animations CSS quand possible

### Qualité

Pour un rendu 4K :

```tsx
<Composition
  width={3840}
  height={2160}
  // ...
/>
```

## 🔧 Troubleshooting

### La vidéo ne charge pas

Vérifier que toutes les scènes sont bien importées dans `ClikzyProPro.tsx`

### Les transitions sont brusques

Augmenter `transitionDuration` dans `ClikzyProPro.tsx` (ligne 36)

### Le glow est trop intense

Réduire `EFFECTS.glow.max` dans `config/theme.ts`

## 📦 Export final

Rendu haute qualité :

```bash
remotion render ClikzyProPro out/clikzy-promo.mp4 \
  --codec h264 \
  --crf 18 \
  --preset slow
```

Rendu rapide (preview) :

```bash
remotion render ClikzyProPro out/preview.mp4 \
  --codec h264 \
  --crf 28 \
  --preset ultrafast
```

---

**Made with Remotion** 🎬
