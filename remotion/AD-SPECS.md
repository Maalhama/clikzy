# CLIKZY - TikTok/Reels Ad (PRO)

## 📊 SPECS

```
Format: 1080x1920 (9:16 vertical)
Durée: ~12.6s (378 frames @ 30fps)
Type: Publicité TikTok/Reels/Shorts
FPS: 30
```

## 🎬 STRUCTURE (7 scènes)

| # | Scène | Durée | Frames | Transition | But |
|---|-------|-------|--------|------------|-----|
| 1 | **HOOK** | 0.5s | 15 | flip | Accroche choc "GAGNE UN iPHONE" |
| 2 | **PROBLEM** | 1s | 30 | slide right | "Tu scrolles toute la journée..." |
| 3 | **SOLUTION** | 1.5s | 45 | wipe bottom | Présente CLIKZY |
| 4 | **GAMEPLAY** | 6s | 180 | fade | Action frénétique + tension |
| 5 | **PRODUCTS** | 2s | 60 | slide top | Flash produits rapide |
| 6 | **WIN** | 1s | 30 | fade | Victoire explosive 🏆 |
| 7 | **CTA** | 1.5s | 45 | - | "JOUE MAINTENANT" + URL |

**Total**: ~12.6s avec transitions

## ⚡ CARACTÉRISTIQUES PRO

### Rythme ultra-rapide
- **Max 2s par séquence** (respecté ✅)
- **Transitions constantes** (0.3-0.4s entre chaque)
- **Gameplay accéléré** (clics toutes les 0.1s à la fin)

### Transitions professionnelles
- **flip** → Accroche dynamique
- **slide** → Fluide et moderne
- **wipe** → Effet cinématique
- **fade** → Smooth et élégant
- **spring timing** → Bounce naturel

### Build-up dramatique
- Phase 0-2s : Calme, introduction
- Phase 2-4s : Montée en tension
- Phase 4-8s : Frénésie totale (zoom + shake + glow)
- Phase 8-9s : Climax produits
- Phase 9-10s : Récompense
- Phase 10-12.6s : Action

### Effets visuels
- **Glow dynamique** → Intensifie progressivement
- **Shake caméra** → Monte jusqu'à 5px
- **Zoom progressif** → 1x → 1.3x
- **Particules** → Au clic
- **Flash victoire** → Impact

## 🎯 OPTIMISATIONS TikTok Ads

✅ **Accroche < 1s** → Hook 0.5s avec produit
✅ **CTA visible** → "JOUE MAINTENANT" + URL
✅ **Format vertical** → 9:16 natif
✅ **Durée optimale** → 12.6s (sweet spot TikTok)
✅ **Transitions modernes** → Flip, wipe, slide
✅ **Tension dramatique** → Build-up progressif
✅ **Produits variés** → 4 produits qui défilent
✅ **Texte lisible** → Gros texte, contrasté

## 🎨 BRAND COLORS

- Purple: #9B5CFF
- Pink: #FF4FD8
- Cyan: #3CCBFF
- Success: #00FF88
- Danger: #FF4F4F

## 📱 PREVIEW

Remotion Studio → http://localhost:3000
Sélectionner: **"ClikzyAd"**

## 🚀 RENDER

```bash
npm run remotion:render ClikzyAd out/clikzy-tiktok-ad.mp4
```

### Options haute qualité

```bash
remotion render ClikzyAd out/clikzy-ad-hq.mp4 \
  --codec h264 \
  --crf 18 \
  --preset slow
```

### Options rapides (preview)

```bash
remotion render ClikzyAd out/clikzy-ad-preview.mp4 \
  --codec h264 \
  --crf 28 \
  --preset ultrafast
```

## 🎯 UTILISATION

Cette vidéo est **optimisée pour** :
- ✅ TikTok Ads
- ✅ Instagram Reels Ads
- ✅ YouTube Shorts
- ✅ Snapchat Ads
- ✅ Facebook Stories

## 🔧 CUSTOMISATION RAPIDE

### Changer les produits

Éditer `SceneProducts` dans `ClikzyAd.tsx` :

```tsx
const products = [
  { emoji: '📱', name: 'iPhone 17 Pro', value: '1 699€', color: COLORS.neon.purple },
  // Ajouter/modifier ici
];
```

### Ajuster les durées

Éditer les `durationInFrames` dans la composition :

```tsx
<TransitionSeries.Sequence durationInFrames={1.5 * fps}>
  <SceneSolution />
</TransitionSeries.Sequence>
```

### Changer les transitions

Importer et utiliser d'autres transitions :

```tsx
import { clockWipe } from '@remotion/transitions/clock-wipe';

<TransitionSeries.Transition
  presentation={clockWipe()}
  timing={linearTiming({ durationInFrames: 12 })}
/>
```

---

**Made with Remotion + Best Practices** 🎬
