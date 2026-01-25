/**
 * CONSTANTS - Configuration centralisée
 * Selon best practices Remotion
 */

// COULEURS (Dark UI + Néon)
export const COLORS = {
  bg: {
    dark: '#0B0F1A',
    darker: '#060911',
    lighter: '#141B2D',
  },
  neon: {
    purple: '#9B5CFF',
    pink: '#FF4FD8',
    cyan: '#3CCBFF',
    blue: '#4F6FFF',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8B9BB4',
    muted: '#5A6B85',
  },
  success: '#00FF88',
  warning: '#FFB84F',
  danger: '#FF4F4F',
};

// DURÉES (en secondes, converties en frames dans les scènes)
export const DURATION = {
  intro: 2.5,
  hero: 3.5,
  gameplay: 9,
  tension: 7,
  win: 4.5,
  outro: 3.5,
};

// TRANSITIONS (en secondes)
export const TRANSITION_DURATION = 0.5; // 15 frames @ 30fps

// EFFETS
export const EFFECTS = {
  glow: {
    min: 10,
    max: 20,
  },
  shake: {
    intensity: 3,
  },
};

// SPRING CONFIGS (best practices Remotion)
export const SPRING_CONFIG = {
  smooth: { damping: 200 }, // Smooth, no bounce
  snappy: { damping: 20, stiffness: 200 }, // Snappy, minimal bounce
  bouncy: { damping: 8 }, // Bouncy entrance
  heavy: { damping: 15, stiffness: 80, mass: 2 }, // Heavy, slow
};
