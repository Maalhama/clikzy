'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface FinalCTASectionProps {
  isLoggedIn: boolean
}

export function FinalCTASection({ isLoggedIn }: FinalCTASectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Card reveal
        if (cardRef.current) {
          gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 50, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }

        // Button pulse
        if (buttonRef.current) {
          gsap.to(buttonRef.current, {
            scale: 1.05,
            duration: 1.5,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
          })
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  const handleButtonHover = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1000)
  }

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple/20 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6">
        <div
          ref={cardRef}
          className="relative max-w-4xl mx-auto glass rounded-3xl p-8 md:p-16 text-center overflow-hidden"
          style={{ boxShadow: '0 0 50px rgba(155, 92, 255, 0.2), inset 0 0 30px rgba(155, 92, 255, 0.05)' }}
        >
          {/* Confetti effect on hover */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10%',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random() * 1}s`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: ['#9B5CFF', '#3CCBFF', '#FF4FD8', '#00FF88', '#FFB800'][
                        Math.floor(Math.random() * 5)
                      ],
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-pink/20 border border-neon-pink/30 rounded-full text-neon-pink mb-6"
            style={{ boxShadow: '0 0 15px rgba(255, 79, 216, 0.3)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Offre de bienvenue
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
            Pret a <span className="gradient-text">gagner</span> ?
          </h2>

          {/* Subtitle */}
          <p className="text-text-secondary text-lg md:text-xl max-w-xl mx-auto mb-8">
            Inscris-toi maintenant et recois{' '}
            <span
              className="text-neon-purple font-bold"
              style={{ textShadow: '0 0 15px rgba(155, 92, 255, 0.5)' }}
            >
              10 credits gratuits
            </span>{' '}
            pour commencer a jouer.
          </p>

          {/* Features list */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              { icon: '✓', text: 'Inscription gratuite' },
              { icon: '✓', text: '10 credits offerts' },
              { icon: '✓', text: 'Objets premium' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary/50 rounded-full text-sm border border-success/20 hover:border-success/40 transition-all duration-300"
                style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.1)' }}
              >
                <span
                  className="text-success"
                  style={{ textShadow: '0 0 8px rgba(0, 255, 136, 0.6)' }}
                >
                  {feature.icon}
                </span>
                <span className="text-text-primary">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            ref={buttonRef}
            href={isLoggedIn ? '/lobby' : '/register'}
            onMouseEnter={handleButtonHover}
            className="inline-block px-10 py-4 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold text-lg rounded-xl transition-all duration-300 animate-gradient bg-[length:200%_200%]"
            style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.5)' }}
          >
            {isLoggedIn ? 'Voir les parties disponibles' : 'Creer mon compte gratuit'}
          </Link>

          {/* Trust indicators */}
          <div className="mt-8 flex justify-center gap-6 text-text-secondary text-sm">
            <span className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Paiement securise
            </span>
            <span className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              100% transparent
            </span>
            <span className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Support 24/7
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
