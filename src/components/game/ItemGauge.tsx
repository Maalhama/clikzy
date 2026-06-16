'use client'

import type { GaugeState } from '@/actions/game'

interface ItemGaugeProps {
  gauge: GaugeState | null
  celebrate?: boolean
  itemName: string
}

// Grille « pixel » (cellules 4px) posée par-dessus le verre et le liquide.
const PIXEL_GRID =
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 4px)'

// Coins entaillés (4px) sur les 4 angles -> silhouette 8-bit (tube + badge).
const NOTCH =
  'polygon(0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px))'

function explanationText(itemName: string): string {
  return `Ta jauge monte à chaque clic. Pleine, ${itemName} est à toi, garanti. Rien n'est perdu : ta progression redevient des crédits si tu t'arrêtes.`
}

// Petite icône « niveaux » pixel art (3 barres ascendantes, crispEdges).
function PixelLevelIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 8 8" width={9} height={9} shapeRendering="crispEdges" aria-hidden="true">
      <rect x="0" y="6" width="2" height="2" fill={color} />
      <rect x="3" y="4" width="2" height="4" fill={color} />
      <rect x="6" y="2" width="2" height="6" fill={color} />
    </svg>
  )
}

/**
 * Jauge perso en PIXEL ART (feature en exploration) : une FIOLE verticale qui se
 * remplit comme du magma/feu animé (flux + flicker + bulles + crête bouillonnante),
 * cadre 8-bit, graduations, et un badge pixel du pourcentage en bas. Posée en overlay
 * à DROITE de l'image, DANS la bordure de la card produit. Pleine -> item obtenu.
 * Seul le visuel est pixel ; les chiffres restent en police premium (stat-numeral).
 */
export function ItemGauge({ gauge, celebrate = false, itemName }: ItemGaugeProps) {
  if (!gauge) return null
  const pct = gauge.target > 0 ? Math.min(100, (gauge.progress / gauge.target) * 100) : 0
  const fillPct = pct > 0 ? Math.max(pct, 6) : 0
  const liquid = celebrate
    ? 'linear-gradient(0deg, #b81e0f 0%, #ff6b1a 45%, #fff1a8 100%)'
    : 'linear-gradient(0deg, #6f1208 0%, #c81e0f 32%, #ff6b1a 68%, #ffd23f 100%)'
  const glow = celebrate ? 'rgba(255, 196, 84, 0.85)' : 'rgba(255, 107, 26, 0.7)'
  const surface = celebrate ? '#fff6cf' : '#ffd23f'
  const frame = celebrate
    ? 'linear-gradient(180deg, #ffe7a0, #FF4FD8)'
    : 'linear-gradient(180deg, #ffb347, #9B5CFF)'
  const badgeFrame = celebrate
    ? 'linear-gradient(135deg, #ffd23f, #FF4FD8)'
    : 'linear-gradient(135deg, #ff6b1a, #9B5CFF)'
  const accent = celebrate ? '#ffd23f' : '#ff8a3c'

  return (
    <div
      className="flex h-full select-none flex-col items-center justify-end gap-1"
      title={explanationText(itemName)}
    >
      {gauge.completedCount > 0 && (
        <span
          className="stat-numeral px-1.5 text-[0.6rem] font-bold text-amber-100"
          style={{ clipPath: NOTCH, background: 'rgba(255,193,7,0.22)', boxShadow: 'inset 0 0 0 1px rgba(255,210,80,0.6)' }}
        >
          ×{gauge.completedCount}
        </span>
      )}

      {/* Bouchon (cork) pixel, 2 tons */}
      <div
        className="w-1/2"
        style={{
          height: 8,
          background: 'linear-gradient(180deg, #e2a85c 0 3px, #b9772f 3px 5px, #8c531f 5px)',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.4), inset -1px -1px 0 rgba(0,0,0,0.45)',
        }}
      />
      {/* Col de la fiole */}
      <div
        className="w-1/3"
        style={{ height: 9, background: 'rgba(12,12,22,0.9)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)' }}
      />

      {/* Corps de la fiole : cadre 8-bit (frame néon) + tube en verre */}
      <div
        className="flex w-full flex-1"
        style={{ minHeight: 64, clipPath: NOTCH, background: frame, padding: 2, boxShadow: `0 0 14px ${glow}` }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ clipPath: NOTCH, background: 'rgba(9,9,18,0.92)', imageRendering: 'pixelated' }}
        >
          {/* Liquide magma animé (flux + flicker), remplit le bas */}
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-out"
            style={{
              height: `${fillPct}%`,
              background: liquid,
              backgroundSize: '100% 16px',
              animation:
                'gauge-magma-flow 1.1s linear infinite, gauge-magma-flicker 1.5s ease-in-out infinite',
              boxShadow: `0 0 16px ${glow}`,
            }}
          >
            {/* Crête bouillonnante */}
            <div
              className="absolute inset-x-0 top-0 origin-bottom"
              style={{
                height: 4,
                background: surface,
                boxShadow: `0 0 8px ${glow}`,
                animation: 'gauge-surface-wave 0.9s ease-in-out infinite',
              }}
            />
            {/* Braises (pixels brillants statiques) */}
            <span className="absolute" style={{ left: '38%', bottom: '28%', width: 2, height: 2, background: '#fff1a8', opacity: 0.85 }} />
            <span className="absolute" style={{ left: '62%', bottom: '48%', width: 2, height: 2, background: '#ffd98a', opacity: 0.7 }} />
            {/* Bulles de magma */}
            {pct > 8 &&
              [
                { left: '22%', size: 4, delay: '0s', dur: '1.7s' },
                { left: '54%', size: 3, delay: '0.5s', dur: '2.1s' },
                { left: '74%', size: 5, delay: '1s', dur: '1.5s' },
              ].map((b, i) => (
                <span
                  key={i}
                  className="absolute bottom-1 rounded-[1px]"
                  style={{
                    left: b.left,
                    width: b.size,
                    height: b.size,
                    background: surface,
                    animation: `gauge-bubble-rise ${b.dur} ease-in ${b.delay} infinite`,
                  }}
                />
              ))}
            {/* Grille pixel sur le liquide */}
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: PIXEL_GRID }} />
          </div>

          {/* Graduations (mesure façon éprouvette) */}
          {[25, 50, 75].map((p) => (
            <span
              key={p}
              className="pointer-events-none absolute left-0"
              style={{ bottom: `${p}%`, width: 6, height: 2, background: 'rgba(255,255,255,0.28)' }}
            />
          ))}
          {/* Grille pixel + reflet verre sur tout le tube */}
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: PIXEL_GRID, opacity: 0.5 }} />
          <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[3px] bg-white/12" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-white/10" />
        </div>
      </div>

      {/* Badge PIXEL du pourcentage (cadre 8-bit + ombre portée pixel ; chiffre en police premium) */}
      <div className="mt-0.5" style={{ filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.55))' }}>
        <div style={{ clipPath: NOTCH, background: badgeFrame, padding: 2 }}>
          <div
            className="flex items-center gap-1 px-1.5 py-0.5"
            style={{ clipPath: NOTCH, background: '#0b0a16' }}
          >
            <PixelLevelIcon color={accent} />
            <span className="stat-numeral text-[0.62rem] font-bold text-white">{Math.round(pct)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Légende courte expliquant la fiole, à poser sous la card produit (pas une section
 * dédiée). Répond au besoin « qu'on comprenne ce qu'est la jauge » sans alourdir.
 */
export function GaugeCaption({ gauge, itemName }: { gauge: GaugeState | null; itemName: string }) {
  if (!gauge) return null
  // progress/target en CENTIMES (jauge « cash réel »).
  const remainingEur = Math.max(0, gauge.target - gauge.progress) / 100
  return (
    <div className="mt-2 text-xs leading-relaxed text-white/55">
      <p>
        <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-neon-purple">
          Ta jauge
        </span>{' '}
        se remplit avec tes crédits. Pleine, <span className="text-white/80">{itemName}</span> est à
        toi, garanti.
      </p>
      {remainingEur > 0 && (
        <p className="mt-1 text-white/45">
          Encore{' '}
          <span className="stat-numeral text-neon-blue">
            {remainingEur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
          </span>{' '}
          à jouer.
        </p>
      )}
    </div>
  )
}
