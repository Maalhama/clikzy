# Règles de Design - Cleekzy

## Icônes

**TOUJOURS utiliser des icônes SVG** au lieu des emojis pour :
- Conserver la cohérence visuelle neon
- Permettre les effets de glow (drop-shadow)
- Meilleure accessibilité
- Chargement plus rapide

### Pattern SVG Neon
```tsx
<svg
  className="w-6 h-6 text-neon-purple drop-shadow-[0_0_8px_rgba(155,92,255,0.6)]"
  viewBox="0 0 24 24"
  fill="currentColor"
>
  {/* ... */}
</svg>
```

### Couleurs disponibles pour les icônes
- `text-neon-purple` + `drop-shadow-[0_0_8px_rgba(155,92,255,0.6)]`
- `text-neon-pink` + `drop-shadow-[0_0_8px_rgba(255,79,216,0.6)]`
- `text-neon-blue` + `drop-shadow-[0_0_8px_rgba(60,203,255,0.6)]`
- `text-yellow-400` + `drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]` (VIP Gold)
- `text-amber-600` + `drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]` (VIP Bronze)
- `text-slate-300` + `drop-shadow-[0_0_8px_rgba(148,163,184,0.6)]` (VIP Silver)

## Direction Artistique

### Palette principale
- Background: `#0B0F1A` (--bg-primary)
- Secondary BG: `#141B2D` (--bg-secondary)
- Neon Purple: `#9B5CFF` (--neon-purple)
- Neon Blue: `#3CCBFF` (--neon-blue)
- Neon Pink: `#FF4FD8` (--neon-pink)

### Effets
- Glow effects sur les éléments importants
- Gradients purple → pink pour les CTA
- Glass morphism avec `backdrop-blur`
- Animations subtiles (pas trop agressives)

## A ne JAMAIS faire
- Utiliser des emojis dans l'UI
- Hardcoder des couleurs hors de la palette
- Oublier les effets de glow sur les icônes SVG
