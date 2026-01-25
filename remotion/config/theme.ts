/**
 * THEME CONFIGURATION
 * Variables centralisées pour toute la vidéo
 */

// COULEURS (Dark UI + Néon)
export const COLORS = {
  // Background
  bg: {
    dark: '#0B0F1A',
    darker: '#060911',
    lighter: '#141B2D',
  },

  // Néon colors
  neon: {
    purple: '#9B5CFF',
    pink: '#FF4FD8',
    cyan: '#3CCBFF',
    blue: '#4F6FFF',
  },

  // UI
  text: {
    primary: '#FFFFFF',
    secondary: '#8B9BB4',
    muted: '#5A6B85',
  },

  // Status
  success: '#00FF88',
  warning: '#FFB84F',
  danger: '#FF4F4F',
};

// DURÉES DES SCÈNES (en frames @ 30fps)
export const SCENE_DURATION = {
  intro: 75,        // 2.5s
  hero: 105,        // 3.5s
  gameplay: 270,    // 9s
  tension: 210,     // 7s
  win: 135,         // 4.5s
  outro: 105,       // 3.5s
};

// TIMINGS (calculés automatiquement)
export const SCENE_START = {
  intro: 0,
  hero: SCENE_DURATION.intro,
  gameplay: SCENE_DURATION.intro + SCENE_DURATION.hero,
  tension: SCENE_DURATION.intro + SCENE_DURATION.hero + SCENE_DURATION.gameplay,
  win: SCENE_DURATION.intro + SCENE_DURATION.hero + SCENE_DURATION.gameplay + SCENE_DURATION.tension,
  outro: SCENE_DURATION.intro + SCENE_DURATION.hero + SCENE_DURATION.gameplay + SCENE_DURATION.tension + SCENE_DURATION.win,
};

// EASING CURVES (personnalisés pour motion design)
export const EASING = {
  // Smooth et fluide
  smooth: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Bounce naturel
  bounce: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Snap rapide
  snap: (t: number) => 1 - Math.pow(2, -10 * t),

  // Elastic (subtil)
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// INTENSITÉ DES EFFETS
export const EFFECTS = {
  // Glow (léger)
  glow: {
    min: 10,
    max: 20,
    pulse: 5,
  },

  // Shake caméra
  shake: {
    intensity: 3,
    frequency: 0.1,
  },

  // Blur
  blur: {
    light: 2,
    medium: 5,
    heavy: 10,
  },
};

// TYPOGRAPHIE
export const FONTS = {
  size: {
    huge: 120,
    big: 80,
    large: 60,
    medium: 40,
    normal: 24,
    small: 18,
    tiny: 14,
  },
  weight: {
    black: 900,
    bold: 700,
    semibold: 600,
    normal: 400,
  },
};

// DURÉE TOTALE
export const TOTAL_DURATION = Object.values(SCENE_DURATION).reduce((a, b) => a + b, 0); // 900 frames = 30s
