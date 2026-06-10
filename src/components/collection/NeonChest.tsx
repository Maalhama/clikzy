'use client'

import { motion } from 'framer-motion'

export type ChestRarityKey = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

// Palette par rareté — coffres trapus type arcade (couvercle bombé, sangles,
// écusson central), traduits dans la DA néon du projet.
export const CHEST_THEME: Record<ChestRarityKey, {
  frame: string; panelTop: string; panelBottom: string; strap: string; accent: string; gem?: string
}> = {
  common: { frame: '#8E9BB5', panelTop: '#2A3550', panelBottom: '#161D2E', strap: '#566180', accent: '#B9C2D8' },
  rare: { frame: '#3CCBFF', panelTop: '#10384F', panelBottom: '#0A2233', strap: '#1E5E80', accent: '#7FE3FF' },
  epic: { frame: '#9B5CFF', panelTop: '#2D1B4F', panelBottom: '#190E30', strap: '#5B3A9E', accent: '#C49AFF', gem: '#FF4FD8' },
  legendary: { frame: '#FFD700', panelTop: '#453607', panelBottom: '#241B04', strap: '#8C7415', accent: '#FFE680', gem: '#FF4FD8' },
  mythic: { frame: '#FF4FD8', panelTop: '#46123A', panelBottom: '#260A20', strap: '#8C2B75', accent: '#FF9AEA', gem: '#3CCBFF' },
}

interface NeonChestProps {
  rarity: string
  /** largeur en px (hauteur ≈ 0.82 × largeur) */
  size?: number
  /** couvercle ouvert (animé au spring) */
  open?: boolean
  className?: string
}

/**
 * Coffre néon en CSS pur : couvercle bombé articulé, sangles métalliques,
 * écusson-serrure central, gemmes selon la rareté. Aucune image.
 */
export function NeonChest({ rarity, size = 176, open = false, className = '' }: NeonChestProps) {
  const t = CHEST_THEME[(rarity as ChestRarityKey)] ?? CHEST_THEME.common
  const w = size
  const lidH = Math.round(size * 0.34)
  const bodyH = Math.round(size * 0.48)
  const isLegendary = rarity === 'legendary' || rarity === 'mythic'

  const strap = (left: string) => (
    <div
      aria-hidden="true"
      className="absolute top-0 h-full"
      style={{
        left, width: '14%',
        background: `linear-gradient(90deg, ${t.strap}, ${t.frame}66 50%, ${t.strap})`,
        borderLeft: `1px solid ${t.frame}55`,
        borderRight: `1px solid ${t.frame}55`,
      }}
    />
  )

  return (
    <div className={`relative ${className}`} style={{ width: w, perspective: 600 }}>
      {/* lueur d'ambiance sous le coffre */}
      <div
        aria-hidden="true"
        className={`absolute -inset-4 -z-10 rounded-full blur-2xl ${isLegendary ? 'animate-pulse' : ''}`}
        style={{ background: `radial-gradient(ellipse at center 70%, ${t.frame}55, transparent 70%)` }}
      />

      {/* Couvercle bombé */}
      <motion.div
        animate={open ? { rotateX: -112 } : { rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        className="relative z-10 origin-bottom border-2 border-b-0"
        style={{
          height: lidH,
          transformStyle: 'preserve-3d',
          borderColor: t.frame,
          borderTopLeftRadius: w * 0.18,
          borderTopRightRadius: w * 0.18,
          background: `linear-gradient(180deg, ${t.panelTop}, ${t.panelBottom})`,
          boxShadow: `0 0 16px -4px ${t.frame}, inset 0 3px 0 ${t.accent}33`,
          overflow: 'hidden',
        }}
      >
        {strap('16%')}
        {strap('70%')}
        {/* reflet bombé */}
        <div aria-hidden="true" className="absolute inset-x-3 top-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}40, transparent)` }} />
      </motion.div>

      {/* Corps */}
      <div
        className="relative border-2 border-t-0"
        style={{
          height: bodyH,
          borderColor: t.frame,
          borderBottomLeftRadius: w * 0.08,
          borderBottomRightRadius: w * 0.08,
          background: `linear-gradient(180deg, ${t.panelBottom}, #0B0F1A)`,
          boxShadow: `0 0 22px -6px ${t.frame}`,
          overflow: 'visible',
        }}
      >
        <div className="absolute inset-0 overflow-hidden" style={{ borderBottomLeftRadius: w * 0.08, borderBottomRightRadius: w * 0.08 }}>
          {strap('16%')}
          {strap('70%')}
          {/* intérieur lumineux quand ouvert */}
          <div
            aria-hidden="true"
            className="absolute inset-x-1 top-0 h-1/3 transition-opacity duration-300"
            style={{ background: `linear-gradient(to bottom, ${t.frame}CC, transparent)`, opacity: open ? 1 : 0 }}
          />
        </div>

        {/* Écusson-serrure central (chevauche couvercle/corps) */}
        <div
          className="absolute left-1/2 z-20 flex -translate-x-1/2 items-center justify-center border-2 transition-all duration-300"
          style={{
            top: -lidH * 0.36,
            width: w * 0.26,
            height: w * 0.3,
            borderColor: t.frame,
            background: `linear-gradient(180deg, ${t.panelTop}, ${t.panelBottom})`,
            borderRadius: '22% 22% 50% 50%',
            boxShadow: `0 0 14px -2px ${t.frame}`,
            opacity: open ? 0 : 1,
            transform: `translateX(-50%) ${open ? 'scale(0.6)' : 'scale(1)'}`,
          }}
        >
          {/* trou de serrure */}
          <div className="flex flex-col items-center" aria-hidden="true">
            <div className="rounded-full" style={{ width: w * 0.07, height: w * 0.07, background: t.accent, boxShadow: `0 0 8px ${t.accent}` }} />
            <div style={{ width: w * 0.03, height: w * 0.07, background: t.accent }} />
          </div>
        </div>

        {/* Gemmes (épique+) */}
        {t.gem && (
          <>
            <div aria-hidden="true" className="absolute bottom-2 rounded-full" style={{ left: '7%', width: w * 0.05, height: w * 0.05, background: t.gem, boxShadow: `0 0 8px ${t.gem}` }} />
            <div aria-hidden="true" className="absolute bottom-2 rounded-full" style={{ right: '7%', width: w * 0.05, height: w * 0.05, background: t.gem, boxShadow: `0 0 8px ${t.gem}` }} />
            {isLegendary && (
              <div aria-hidden="true" className="absolute left-1/2 bottom-1.5 -translate-x-1/2 rotate-45" style={{ width: w * 0.06, height: w * 0.06, background: t.gem, boxShadow: `0 0 10px ${t.gem}` }} />
            )}
          </>
        )}

        {/* pieds */}
        <div aria-hidden="true" className="absolute -bottom-1 left-[8%] h-1.5 rounded-b" style={{ width: w * 0.12, background: t.strap }} />
        <div aria-hidden="true" className="absolute -bottom-1 right-[8%] h-1.5 rounded-b" style={{ width: w * 0.12, background: t.strap }} />
      </div>
    </div>
  )
}
