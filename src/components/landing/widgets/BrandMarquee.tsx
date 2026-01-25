'use client'

import { useEffect, useRef } from 'react'

// Real tech/lifestyle brand names
const BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Nintendo',
  'PlayStation',
  'Xbox',
  'Bose',
  'JBL',
  'Dyson',
  'GoPro',
  'DJI',
  'Canon',
  'Garmin',
  'Fitbit',
  'Marshall',
  'Sonos',
  'LG',
  'Google',
  'Meta',
  'Razer',
]

export function BrandMarquee() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    // Clone content for seamless loop
    const scrollContent = scrollContainer.querySelector('.scroll-content')
    if (scrollContent && !scrollContainer.querySelector('.scroll-clone')) {
      const clone = scrollContent.cloneNode(true) as HTMLElement
      clone.classList.add('scroll-clone')
      scrollContainer.appendChild(clone)
    }
  }, [])

  return (
    <section className="py-6 overflow-hidden bg-white/[0.02] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-white/30 text-xs uppercase tracking-widest mb-4">
          Les marques que tu peux gagner
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-hidden"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
      >
        <div className="scroll-content flex animate-marquee">
          {BRANDS.map((brand, index) => (
            <div
              key={`brand-${index}`}
              className="flex-shrink-0 px-8 md:px-12"
            >
              <span className="text-white/40 text-sm md:text-base font-medium whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
