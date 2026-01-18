'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/gsapConfig'

interface PrizeShowcaseProps {
  item?: {
    name: string
    image_url: string
    retail_value: number
    description?: string
  }
}

export function PrizeShowcase({ item }: PrizeShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const raysRef = useRef<HTMLDivElement>(null)
  const priceRef = useRef<HTMLDivElement>(null)

  // Default item if none provided
  const displayItem = item || {
    name: 'iPhone 15 Pro Max',
    image_url: '/items/iphone.png',
    retail_value: 1479,
    description: "Le dernier smartphone Apple avec toutes ses fonctionnalites premium",
  }

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Create a timeline for scrub animation
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        })

        // Rotate the prize image based on scroll
        if (imageRef.current) {
          tl.fromTo(
            imageRef.current,
            { rotateY: -45, scale: 0.8 },
            { rotateY: 45, scale: 1.1, ease: 'none' }
          )
        }

        // Animate rays
        if (raysRef.current) {
          gsap.to(raysRef.current, {
            rotate: 360,
            duration: 30,
            ease: 'none',
            repeat: -1,
          })
        }

        // Text reveal on scroll
        if (textRef.current) {
          gsap.fromTo(
            textRef.current.children,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: textRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }

        // Price count-up animation
        if (priceRef.current) {
          const priceElement = priceRef.current.querySelector('.price-value')
          if (priceElement) {
            const obj = { value: 0 }
            gsap.to(obj, {
              value: displayItem.retail_value,
              duration: 2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: priceRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
              onUpdate: () => {
                priceElement.textContent = Math.round(obj.value).toLocaleString()
              },
            })
          }
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="prize-showcase"
      className="relative min-h-[150vh] flex items-center justify-center py-20 overflow-hidden"
    >
      {/* Background rays */}
      <div
        ref={raysRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgba(155, 92, 255, 0.1) 10deg, transparent 20deg, transparent 40deg, rgba(60, 203, 255, 0.1) 50deg, transparent 60deg)`,
        }}
      />

      {/* Spotlight effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[150px] animate-pulse-slow"
        style={{ boxShadow: '0 0 100px rgba(155, 92, 255, 0.3)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          {/* Prize image with 3D rotation */}
          <div
            ref={imageRef}
            className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            {/* Glow behind */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-3xl blur-3xl" />

            {/* Image container */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-bg-secondary/50 border-2 border-neon-purple/30 backdrop-blur-sm">
              <Image
                src={displayItem.image_url}
                alt={displayItem.name}
                fill
                className="object-contain p-8"
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 500px"
              />

              {/* Shine overlay */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                }}
              />
            </div>

            {/* Neon border glow */}
            <div
              className="absolute inset-0 rounded-3xl border-2 border-neon-purple animate-glow pointer-events-none"
              style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.4), inset 0 0 30px rgba(155, 92, 255, 0.05)' }}
            />
          </div>

          {/* Text content */}
          <div ref={textRef} className="text-center lg:text-left max-w-md">
            <div className="inline-block px-3 py-1 bg-neon-pink/20 border border-neon-pink/30 rounded-full text-neon-pink text-sm mb-4">
              A gagner maintenant
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
              {displayItem.name}
            </h2>

            {displayItem.description && (
              <p className="text-text-secondary text-lg mb-6">{displayItem.description}</p>
            )}

            {/* Price */}
            <div ref={priceRef} className="mb-8">
              <div className="text-sm text-text-secondary mb-1">Valeur</div>
              <div className="text-5xl md:text-6xl font-bold">
                <span
                  className="price-value text-neon-pink"
                  style={{ textShadow: '0 0 30px rgba(255, 79, 216, 0.6)' }}
                >
                  0
                </span>
                <span
                  className="text-neon-pink ml-2"
                  style={{ textShadow: '0 0 30px rgba(255, 79, 216, 0.6)' }}
                >
                  EUR
                </span>
              </div>
            </div>

            {/* CTA */}
            <a
              href="#live-game"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold rounded-xl transition-all duration-300 hover:scale-105"
              style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.4)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 40px rgba(155, 92, 255, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 20px rgba(155, 92, 255, 0.4)'}
            >
              Voir la partie en cours
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
