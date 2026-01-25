/**
 * Matériaux 3D partagés pour les mini-jeux
 * Respecte la direction artistique Cleekzy (neon cyberpunk)
 */

type MaterialProps = {
  color?: string
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
  envMapIntensity?: number
  transmission?: number
  thickness?: number
  transparent?: boolean
  opacity?: number
  toneMapped?: boolean
}

// Palette de couleurs neon Cleekzy
export const NEON_COLORS = {
  purple: '#9B5CFF',
  blue: '#3CCBFF',
  pink: '#FF4FD8',
  green: '#00FF88', // Success
  orange: '#FFB800', // Jackpot
  red: '#FF4757', // Danger
} as const

// Couleurs de fond
export const BG_COLORS = {
  primary: '#0B0F1A',
  secondary: '#141B2D',
  tertiary: '#1E2942',
} as const

/**
 * Matériaux PBR prédéfinis avec la palette neon
 */
export const GAME_MATERIALS = {
  // Matériaux neon émissifs
  neonPurple: {
    color: NEON_COLORS.purple,
    emissive: NEON_COLORS.purple,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.2,
  } satisfies MaterialProps,

  neonBlue: {
    color: NEON_COLORS.blue,
    emissive: NEON_COLORS.blue,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.2,
  } satisfies MaterialProps,

  neonPink: {
    color: NEON_COLORS.pink,
    emissive: NEON_COLORS.pink,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.2,
  } satisfies MaterialProps,

  neonGreen: {
    color: NEON_COLORS.green,
    emissive: NEON_COLORS.green,
    emissiveIntensity: 1.0,
    metalness: 0.5,
    roughness: 0.2,
  } satisfies MaterialProps,

  // Matériaux métalliques
  metalChrome: {
    color: '#EDEDED',
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.5,
  } satisfies MaterialProps,

  metalGold: {
    color: NEON_COLORS.orange,
    emissive: NEON_COLORS.orange,
    emissiveIntensity: 0.3,
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 2.0,
  } satisfies MaterialProps,

  // Matériaux pour le gaming
  darkPlastic: {
    color: BG_COLORS.secondary,
    metalness: 0.1,
    roughness: 0.6,
  } satisfies MaterialProps,

  glass: {
    color: BG_COLORS.tertiary,
    transmission: 0.9,
    thickness: 0.5,
    roughness: 0.1,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: 0.3,
  } satisfies MaterialProps,

  // Matériaux spéciaux pour jeux
  glowBall: {
    color: '#FFFFFF',
    emissive: NEON_COLORS.purple,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.1,
    envMapIntensity: 1.5,
  } satisfies MaterialProps,

  woodTable: {
    color: '#3D2817',
    metalness: 0.0,
    roughness: 0.8,
  } satisfies MaterialProps,

  rubber: {
    color: BG_COLORS.primary,
    metalness: 0.0,
    roughness: 0.9,
  } satisfies MaterialProps,
} as const

/**
 * Création de matériau avec glow (pour les objets qui doivent briller)
 */
export function createGlowMaterial(
  baseColor: string,
  intensity: number = 0.8
): MaterialProps {
  return {
    color: baseColor,
    emissive: baseColor,
    emissiveIntensity: intensity,
    metalness: 0.5,
    roughness: 0.2,
    toneMapped: false, // Important pour les couleurs émissives vives
  }
}

/**
 * Création de matériau métallique avec couleur
 */
export function createMetallicMaterial(
  color: string,
  metalness: number = 0.9,
  roughness: number = 0.1
): MaterialProps {
  return {
    color,
    metalness,
    roughness,
    envMapIntensity: 1.5,
  }
}
