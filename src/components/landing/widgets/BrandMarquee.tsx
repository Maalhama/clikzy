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

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 md:h-14 w-10 md:w-14"
      fill={color}
      role="img"
      aria-label={brand.title}
    >
      <path d={brand.path} />
    </svg>
  )
}

export function BrandMarquee() {
  // Doubler les logos pour le scroll infini
  const allLogos = [...BRAND_LOGOS, ...BRAND_LOGOS]

  return (
    <section className="py-6 md:py-8 overflow-hidden bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        {/* Conteneur animé - translate de -50% pour boucle seamless */}
        <div className="flex items-center gap-16 md:gap-20 animate-marquee-slow w-max">
          {allLogos.map((brand, index) => (
            <div
              key={`brand-${index}`}
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
