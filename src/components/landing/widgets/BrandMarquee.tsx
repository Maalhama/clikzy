'use client'

import {
  siApple,
  siSamsung,
  siSony,
  siPlaystation,
  siMeta,
  siLg,
  siBose,
  siJbl,
  siDji,
  siGarmin,
  siSonos,
  siRazer,
  siGoogle,
  siSteam,
  siNvidia,
  siAsus,
  siBeatsbydre,
  siHuawei,
  siXiaomi,
  siLenovo,
  siCorsair,
  siSteelseries,
} from 'simple-icons'

interface BrandIcon {
  title: string
  path: string
  hex: string
}

const BRAND_LOGOS: BrandIcon[] = [
  siApple,
  siSamsung,
  siSony,
  siPlaystation,
  siMeta,
  siLg,
  siBose,
  siJbl,
  siDji,
  siGarmin,
  siSonos,
  siRazer,
  siGoogle,
  siSteam,
  siNvidia,
  siAsus,
  siBeatsbydre,
  siHuawei,
  siXiaomi,
  siLenovo,
  siCorsair,
  siSteelseries,
]

// Calcule la luminosité d'une couleur hex (0-255)
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  // Formule de luminosité perçue
  return (0.299 * r + 0.587 * g + 0.114 * b)
}

function BrandLogo({ brand }: { brand: BrandIcon }) {
  const luminance = getLuminance(brand.hex)
  // Si la couleur est trop sombre (luminance < 80), utiliser blanc
  const color = luminance < 80 ? '#FFFFFF' : `#${brand.hex}`
  const glowColor = luminance < 80 ? '#9B5CFF' : `#${brand.hex}` // Glow violet pour les logos blancs

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 md:h-14 w-10 md:w-14"
      fill={color}
      role="img"
      aria-label={brand.title}
      style={{
        filter: `drop-shadow(0 0 8px ${glowColor}50) drop-shadow(0 0 16px ${glowColor}30)`,
      }}
    >
      <path d={brand.path} />
    </svg>
  )
}

export function BrandMarquee() {
  return (
    <section className="py-6 md:py-8 overflow-hidden bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
      <div
        className="relative flex overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        {/* Premier groupe - animation continue */}
        <div className="flex items-center gap-16 md:gap-20 pr-16 md:pr-20 animate-marquee-slow">
          {BRAND_LOGOS.map((brand, index) => (
            <div
              key={`brand-1-${index}`}
              className="flex-shrink-0 transition-all duration-300 hover:scale-110"
            >
              <BrandLogo brand={brand} />
            </div>
          ))}
        </div>

        {/* Deuxième groupe - dupliqué pour scroll infini seamless */}
        <div className="flex items-center gap-16 md:gap-20 pr-16 md:pr-20 animate-marquee-slow" aria-hidden="true">
          {BRAND_LOGOS.map((brand, index) => (
            <div
              key={`brand-2-${index}`}
              className="flex-shrink-0 transition-all duration-300 hover:scale-110"
            >
              <BrandLogo brand={brand} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
