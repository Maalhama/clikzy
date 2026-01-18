'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'
import { WinnersFeed } from '../components/WinnersFeed'
import { StatsCounter } from '../components/PlayerCounter'

interface Winner {
  id: string
  username: string
  item_name: string
  item_value: number
  won_at: string
  avatar_url?: string
}

interface SocialProofSectionProps {
  winners: Winner[]
  totalWinningsValue: number
  totalGames: number
  activePlayersNow: number
}

export function SocialProofSection({
  winners,
  totalWinningsValue,
  totalGames,
  activePlayersNow,
}: SocialProofSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Parallax for left side (slower)
        if (leftRef.current) {
          gsap.to(leftRef.current, {
            y: -50,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          })
        }

        // Parallax for right side (faster)
        if (rightRef.current) {
          gsap.to(rightRef.current, {
            y: -100,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          })
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-full text-success mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Temps reel
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ils ont deja <span className="text-success neon-text-success">gagne</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Rejoins des milliers de joueurs qui remportent des objets incroyables chaque jour.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Stats */}
          <div ref={leftRef}>
            <div
              className="glass rounded-2xl p-8"
              style={{ boxShadow: '0 0 30px rgba(155, 92, 255, 0.1)' }}
            >
              <h3
                className="text-xl font-bold text-text-primary mb-8"
                style={{ textShadow: '0 0 20px rgba(155, 92, 255, 0.3)' }}
              >
                Statistiques globales
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <StatsCounter
                  value={totalWinningsValue}
                  label="Total des gains"
                  suffix=" EUR"
                  duration={2.5}
                />
                <StatsCounter
                  value={totalGames}
                  label="Parties jouees"
                  duration={2}
                />
                <StatsCounter
                  value={activePlayersNow}
                  label="Joueurs actifs"
                  duration={1.5}
                />
                <StatsCounter
                  value={winners.length > 0 ? winners.length * 10 : 847}
                  label="Objets gagnes"
                  duration={2}
                />
              </div>
            </div>

            {/* Testimonial */}
            <div
              className="mt-8 p-6 rounded-2xl bg-bg-secondary/50 border border-bg-tertiary hover:border-neon-purple/30 transition-all duration-300"
              style={{ boxShadow: '0 0 20px rgba(155, 92, 255, 0.1)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ boxShadow: '0 0 15px rgba(155, 92, 255, 0.4)' }}
                >
                  M
                </div>
                <div>
                  <p className="text-text-primary mb-3">
                    &ldquo;J&apos;ai gagne un iPhone 15 Pro avec seulement 5 clics ! Le concept est genial
                    et l&apos;adrénaline est au rendez-vous.&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-neon-purple"
                      style={{ textShadow: '0 0 10px rgba(155, 92, 255, 0.4)' }}
                    >
                      MaxGamer42
                    </span>
                    <span className="text-text-secondary text-sm">- Gagnant iPhone 15 Pro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent winners feed */}
          <div ref={rightRef}>
            <div
              className="glass rounded-2xl p-8"
              style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-bold text-text-primary"
                  style={{ textShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
                >
                  Derniers gagnants
                </h3>
                <span
                  className="text-xs text-success font-medium"
                  style={{ textShadow: '0 0 10px rgba(0, 255, 136, 0.4)' }}
                >
                  Mise a jour en temps reel
                </span>
              </div>
              <WinnersFeed winners={winners} maxDisplay={6} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
