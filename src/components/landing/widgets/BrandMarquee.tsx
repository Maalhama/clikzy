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

function BrandLogo({ brand }: { brand: BrandIcon }) {
  const color = `#${brand.hex}`
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 md:h-10 w-8 md:w-10"
      fill={color}
      role="img"
      aria-label={brand.title}
      style={{
        filter: `drop-shadow(0 0 8px ${color}50) drop-shadow(0 0 16px ${color}30)`,
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
        <div className="flex items-center gap-10 md:gap-14 pr-10 md:pr-14 animate-marquee-infinite">
          {BRAND_LOGOS.map((brand, index) => (
            <div
              key={`brand-1-${index}`}
              className="flex-shrink-0 opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-110"
            >
              <BrandLogo brand={brand} />
            </div>
          ))}
        </div>

        {/* Deuxième groupe - dupliqué pour scroll infini seamless */}
        <div className="flex items-center gap-10 md:gap-14 pr-10 md:pr-14 animate-marquee-infinite" aria-hidden="true">
          {BRAND_LOGOS.map((brand, index) => (
            <div
              key={`brand-2-${index}`}
              className="flex-shrink-0 opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-110"
            >
              <BrandLogo brand={brand} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
