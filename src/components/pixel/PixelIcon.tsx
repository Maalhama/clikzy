// ============================================================
// Icônes PIXEL ART maison — style « jeton » (cohérent avec PackCard/PixelChip).
// Rendu SVG net (shapeRendering=crispEdges). Deux moteurs :
//  - disque géométrique (cercles pixel parfaitement symétriques, sans dessin main)
//  - sprite char-map (icônes dessinées à la main, 1 char = 1 pixel)
// Le pixel art reste réservé aux VISUELS/icônes — jamais la typo (cf. mémoire).
// ============================================================
import * as React from 'react'

// ---- Moteur disque géométrique ----
type DiscBand = 'edge' | 'body' | 'shine' | 'shadow'

function discCells(R: number): { x: number; y: number; t: DiscBand }[] {
  const c = (R - 1) / 2
  const max = R / 2
  const out: { x: number; y: number; t: DiscBand }[] = []
  for (let y = 0; y < R; y++) {
    for (let x = 0; x < R; x++) {
      const dx = x - c
      const dy = y - c
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > max) continue
      let t: DiscBand = 'body'
      if (d > max - 1) t = 'edge' // contour 1px
      else if (dx < -0.5 && dy < -0.5 && d < max - 1.4) t = 'shine' // reflet haut-gauche
      else if (dx > 0.8 && dy > 0.8 && d > max - 2.2 && d < max - 0.6) t = 'shadow' // ombre bas-droite
      out.push({ x, y, t })
    }
  }
  return out
}

const COIN_CELLS = discCells(16)

type CoinPalette = { edge: string; body: string; shine: string; shadow: string }
const GOLD: CoinPalette = { edge: '#6B4A05', body: '#FBC02D', shine: '#FFF1B8', shadow: '#C77F0A' }

/** Pièce de crédits — disque pixel doré (façon jeton). */
export function PixelCoin({ className = 'h-4 w-4', title }: { className?: string; title?: string }) {
  const p = GOLD
  return (
    <svg
      viewBox="0 0 16 16"
      className={`inline-block ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? 'crédits'}
      style={{ imageRendering: 'pixelated' }}
    >
      {title ? <title>{title}</title> : null}
      {COIN_CELLS.map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width={1.04} height={1.04} fill={p[cell.t]} />
      ))}
      {/* symbole crédit : petit « C » sombre au centre */}
      <rect x={6} y={5} width={4} height={1.4} fill={p.edge} />
      <rect x={6} y={5} width={1.4} height={6} fill={p.edge} />
      <rect x={6} y={9.6} width={4} height={1.4} fill={p.edge} />
    </svg>
  )
}

// ============================================================
// Icônes MINI-JEUX en pixel art (remplacent les SVG lisses de GameIcons).
// Construites en rects pixel-alignés (pas de char-map à compter) sur grille 16.
// ============================================================
const C = {
  pu: '#9B5CFF', puD: '#6E36FF', puL: '#C9A6FF',
  pk: '#FF4FD8', pkD: '#B0249A',
  cy: '#3CCBFF', cyD: '#1B6E8C',
  gd: '#FFD700', gdD: '#B8860B', gdL: '#FFF1B8',
  dk: '#0B0F1A', dk2: '#1A2238', wt: '#FFFFFF', slv: '#D0D6E0', slvD: '#8A93A8',
}

type IconProps = { className?: string; animate?: boolean }

function PxSvg({ className, label, vb = '0 0 16 16', children }: { className?: string; label: string; vb?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      className={`inline-block ${className ?? 'h-full w-full'}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      style={{ imageRendering: 'pixelated' }}
    >
      {children}
    </svg>
  )
}
// pixel = rect 1x1 (léger débord pour éviter les coutures)
function px(x: number, y: number, w: number, h: number, fill: string, key?: string | number) {
  return <rect key={key} x={x} y={y} width={w + 0.03} height={h + 0.03} fill={fill} />
}

// ---- Roue de la fortune : disque 8 secteurs + moyeu + pointeur ----
export function WheelIcon({ className }: IconProps) {
  return (
    <PxSvg className={className} label="Roue de la fortune">
      {discCells(16).map((cell, i) => {
        const dx = cell.x - 7.5, dy = cell.y - 7.5
        const sector = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 2
        const fill = cell.t === 'edge' ? C.puD : sector === 0 ? C.pu : C.pk
        return px(cell.x, cell.y, 1, 1, fill, i)
      })}
      {px(6, 6, 4, 4, C.dk, 'hub')}
      {px(7, 7, 2, 2, C.cy, 'hubdot')}
      {px(7, 0, 2, 3, C.gd, 'ptr')}
      {px(7.5, 3, 1, 1, C.gdL, 'ptrtip')}
    </PxSvg>
  )
}

// ---- Carte à gratter : carte rose + zone argentée + étoile or ----
export function ScratchIcon({ className }: IconProps) {
  return (
    <PxSvg className={className} label="Carte à gratter">
      {px(2, 3, 12, 10, C.dk, 'sh')}
      {px(2, 3, 12, 9, C.pk, 'card')}
      {px(2, 3, 12, 1, C.pkD, 'cardtop')}
      {px(3, 5, 10, 6, C.slv, 'scratch')}
      {/* étoile or */}
      {px(7, 5, 2, 1, C.gd, 's1')}
      {px(6, 6, 4, 1, C.gd, 's2')}
      {px(5, 7, 6, 1, C.gd, 's3')}
      {px(6, 8, 1, 1, C.gd, 's4')}
      {px(9, 8, 1, 1, C.gd, 's5')}
      {px(5, 9, 2, 1, C.gdD, 's6')}
      {px(9, 9, 2, 1, C.gdD, 's7')}
    </PxSvg>
  )
}

// ---- Pachinko : cadre cyan + plateau + pegs roses + bille ----
export function PachinkoIcon({ className }: IconProps) {
  const pegs: [number, number][] = [[4, 5], [7, 5], [10, 5], [5, 8], [8, 8], [11, 8], [4, 11], [7, 11], [10, 11]]
  const slots: [number, string][] = [[3, C.pu], [6, C.gd], [9, C.pu], [12, C.gd]]
  return (
    <PxSvg className={className} label="Pachinko">
      {px(2, 1, 12, 14, C.cyD, 'frame')}
      {px(3, 2, 10, 12, C.dk2, 'board')}
      {pegs.map(([x, y], i) => px(x, y, 1, 1, C.pk, `peg${i}`))}
      {slots.map(([x, c], i) => px(x, 12, 2, 2, c, `slot${i}`))}
      {px(7, 2, 2, 2, C.slv, 'ball')}
      {px(7, 2, 1, 1, C.wt, 'ballsh')}
    </PxSvg>
  )
}

// ---- Machine à sous : cadre or + 3 rouleaux + levier ----
export function SlotsIcon({ className }: IconProps) {
  return (
    <PxSvg className={className} label="Machine à sous">
      {px(2, 2, 11, 13, C.gdD, 'frame')}
      {px(2, 2, 11, 13, C.gd, 'frame2')}
      {px(3, 5, 9, 7, C.dk, 'screen')}
      {/* 3 rouleaux */}
      {px(3, 5, 3, 7, C.dk2, 'r1')}
      {px(7, 5, 3, 7, C.dk2, 'r2')}
      {px(3, 3, 9, 1, C.pk, 'title')}
      {/* symboles */}
      {px(4, 7, 2, 2, C.pk, 's1')}
      {px(7, 7, 2, 2, C.cy, 's2')}
      {px(10, 7, 2, 2, C.gd, 's3')}
      {/* levier */}
      {px(13, 6, 1, 4, C.pu, 'lever')}
      {px(13, 5, 2, 1, C.pk, 'knob')}
    </PxSvg>
  )
}

// ---- Pile ou face : pièce dorée + couronne ----
export function CoinFlipIcon({ className }: IconProps) {
  return (
    <PxSvg className={className} label="Pile ou face">
      {discCells(16).map((cell, i) => {
        const fill = cell.t === 'edge' ? C.gdD : cell.t === 'shine' ? C.gdL : cell.t === 'shadow' ? C.gdD : C.gd
        return px(cell.x, cell.y, 1, 1, fill, i)
      })}
      {/* couronne sombre */}
      {px(5, 7, 1, 2, C.gdD, 'c1')}
      {px(7, 6, 2, 3, C.gdD, 'c2')}
      {px(10, 7, 1, 2, C.gdD, 'c3')}
      {px(5, 9, 6, 1, C.gdD, 'cbase')}
    </PxSvg>
  )
}

// ---- Lancer de dés : un dé violet, 5 pips blancs ----
export function DiceIcon({ className }: IconProps) {
  return (
    <PxSvg className={className} label="Lancer de dés">
      {px(2, 2, 12, 12, C.dk, 'frame')}
      {px(3, 3, 10, 10, C.pu, 'body')}
      {px(3, 3, 10, 1, C.puL, 'top')}
      {px(3, 12, 10, 1, C.puD, 'bot')}
      {px(4, 4, 2, 2, C.wt, 'p1')}
      {px(10, 4, 2, 2, C.wt, 'p2')}
      {px(7, 7, 2, 2, C.wt, 'p3')}
      {px(4, 10, 2, 2, C.wt, 'p4')}
      {px(10, 10, 2, 2, C.wt, 'p5')}
    </PxSvg>
  )
}

const YL = '#FFE23B'
// ---- Éclair (phase finale) ----
export function PixelBolt({ className }: { className?: string }) {
  return (
    <PxSvg className={className} label="phase finale" vb="4 2 7 10">
      {px(7, 2, 3, 1, C.gdD, 0)}
      {px(7, 2, 2, 1, YL, 1)}
      {px(6, 3, 3, 1, YL, 2)}
      {px(5, 4, 3, 1, YL, 3)}
      {px(4, 5, 7, 1, C.gdD, 4)}
      {px(4, 5, 7, 1, YL, 'cb')}
      {px(8, 6, 3, 1, YL, 5)}
      {px(7, 7, 3, 1, YL, 6)}
      {px(6, 8, 3, 1, YL, 7)}
      {px(5, 9, 3, 1, YL, 8)}
      {px(5, 10, 2, 2, '#FFF6B0', 9)}
    </PxSvg>
  )
}

// ---- Trophée (remportés / classement) ----
export function PixelTrophy({ className }: { className?: string }) {
  return (
    <PxSvg className={className} label="trophée" vb="2 2 12 10">
      {/* anses */}
      {px(2, 3, 2, 3, C.gdD, 0)}
      {px(12, 3, 2, 3, C.gdD, 1)}
      {px(2, 3, 1, 3, YL, 'hl')}
      {px(13, 3, 1, 3, YL, 'hr')}
      {/* coupe */}
      {px(4, 2, 8, 4, C.gd, 2)}
      {px(4, 2, 8, 1, C.gdL, 3)}
      {px(5, 6, 6, 1, C.gd, 4)}
      {/* étoile */}
      {px(7, 3, 2, 2, C.wt, 5)}
      {/* pied */}
      {px(7, 7, 2, 2, C.gdD, 6)}
      {px(5, 9, 6, 1, C.gd, 7)}
      {px(4, 10, 8, 2, C.gdD, 8)}
      {px(4, 10, 8, 1, C.gd, 9)}
    </PxSvg>
  )
}

// ---- Flamme (streak) ----
export function PixelFlame({ className }: { className?: string }) {
  const OR = '#FF7A1A', ORD = '#C2410C', YO = '#FFC73B'
  return (
    <PxSvg className={className} label="série" vb="4 1 7 11">
      {px(7, 1, 2, 1, OR, 0)}
      {px(6, 2, 3, 2, OR, 1)}
      {px(5, 4, 5, 2, OR, 2)}
      {px(4, 6, 7, 3, OR, 3)}
      {px(4, 9, 7, 2, ORD, 4)}
      {px(5, 11, 5, 1, ORD, 5)}
      {/* cœur jaune */}
      {px(7, 4, 2, 2, YO, 6)}
      {px(6, 6, 3, 3, YO, 7)}
      {px(6, 9, 3, 1, '#FFF0A0', 8)}
    </PxSvg>
  )
}

// ---- Couronne (jackpot / V.I.P) ----
export function PixelCrown({ className }: { className?: string }) {
  return (
    <PxSvg className={className} label="jackpot" vb="3 1 10 8">
      {px(3, 4, 2, 4, C.gd, 0)}
      {px(7, 2, 2, 6, C.gd, 1)}
      {px(11, 4, 2, 4, C.gd, 2)}
      {px(3, 6, 10, 1, C.gd, 3)}
      {px(3, 7, 10, 2, C.gdD, 4)}
      {px(3, 7, 10, 1, C.gdL, 'rim')}
      {/* pointes */}
      {px(3, 3, 2, 1, C.gdL, 5)}
      {px(7, 1, 2, 1, C.gdL, 6)}
      {px(11, 3, 2, 1, C.gdL, 7)}
      {/* gemmes */}
      {px(4, 7, 1, 1, C.pk, 8)}
      {px(7, 7, 2, 1, C.pk, 9)}
      {px(11, 7, 1, 1, C.pk, 10)}
    </PxSvg>
  )
}

// ---- Gemme (rareté) — couleur paramétrable ----
export function PixelGem({ className, color = C.cy }: { className?: string; color?: string }) {
  const light = '#FFFFFF'
  return (
    <PxSvg className={className} label="gemme" vb="4 2 8 8">
      {px(5, 3, 6, 1, C.dk, 0)}
      {px(6, 2, 4, 1, color, 1)}
      {px(5, 3, 6, 2, color, 2)}
      {px(4, 5, 8, 1, color, 3)}
      {px(5, 6, 6, 1, color, 4)}
      {px(6, 7, 4, 1, color, 5)}
      {px(7, 8, 2, 1, color, 6)}
      {px(7, 9, 2, 1, color, 7)}
      {/* facette claire */}
      {px(6, 3, 1, 3, light, 8)}
      {px(7, 2, 1, 1, light, 9)}
    </PxSvg>
  )
}

// ---- Calendrier (récompense du jour) ----
export function PixelCalendar({ className }: { className?: string }) {
  const P = '#9B5CFF', PD = '#6E36FF', PK = '#FF4FD8', DK = '#161D2E', WT = '#E9D5FF'
  return (
    <PxSvg className={className} label="récompense du jour" vb="2 1 12 13">
      {px(5, 1, 1, 2, P, 'r1')}
      {px(10, 1, 1, 2, P, 'r2')}
      {px(2, 3, 12, 11, PD, 'frame')}
      {px(3, 4, 10, 2, P, 'header')}
      {px(3, 6, 10, 7, DK, 'body')}
      {px(4, 8, 1, 1, WT, 'd1')}
      {px(7, 8, 1, 1, WT, 'd2')}
      {px(10, 8, 1, 1, WT, 'd3')}
      {px(4, 10, 1, 1, WT, 'd4')}
      {px(10, 10, 1, 1, WT, 'd5')}
      {px(7, 10, 2, 2, PK, 'today')}
    </PxSvg>
  )
}

// ---- Cadeau (récompenses / quêtes) ----
export function PixelGift({ className }: { className?: string }) {
  const P = '#9B5CFF', PD = '#7B3FDF', PL = '#C9A6FF', PK = '#FF4FD8'
  return (
    <PxSvg className={className} label="cadeau" vb="2 2 12 12">
      {px(5, 2, 2, 2, PK, 'b1')}
      {px(9, 2, 2, 2, PK, 'b2')}
      {px(7, 3, 2, 1, PK, 'b3')}
      {px(2, 5, 12, 2, PD, 'lid')}
      {px(3, 7, 10, 7, P, 'box')}
      {px(3, 7, 10, 1, PL, 'boxtop')}
      {px(7, 5, 2, 9, PK, 'ribbon')}
    </PxSvg>
  )
}
