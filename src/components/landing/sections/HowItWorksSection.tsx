'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/gsapConfig'

interface Step {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Choisis un objet',
    description:
      "Parcours le lobby et choisis l'objet que tu veux remporter. iPhone, PS5, AirPods...",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
        <path d="m9 15 3-3 3 3" />
        <path d="M16 8h6" />
        <path d="M19 5v6" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Clique strategiquement',
    description:
      'Chaque clic coute 1 credit. En phase finale (<1 min), chaque clic remet le timer a 1 minute.',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <circle cx="12" cy="2" r="1" />
      </svg>
    ),
  },
  {
    number: '03',
    title: "Gagne l'objet",
    description:
      "Le dernier a avoir clique quand le timer atteint zero remporte l'objet. C'est tout !",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Cards stagger animation from sides
        cardsRef.current.forEach((card, index) => {
          if (!card) return

          const direction = index % 2 === 0 ? -100 : 100

          gsap.fromTo(
            card,
            { opacity: 0, x: direction },
            {
              opacity: 1,
              x: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        })

        // Progress line animation
        if (lineRef.current) {
          gsap.fromTo(
            lineRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }
      }, sectionRef)

      return () => ctx.revert()
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-20 md:py-32 overflow-hidden"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Comment ca <span className="text-neon-purple neon-text">marche</span> ?
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Simple, addictif, strategique. Voici les regles du jeu.
          </p>
        </div>

        {/* Progress line (desktop only) */}
        <div className="hidden md:block relative h-1 max-w-4xl mx-auto mb-16">
          <div className="absolute inset-0 bg-bg-tertiary rounded-full" />
          <div
            ref={lineRef}
            className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink rounded-full origin-left"
          />
          {/* Dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neon-purple border-4 border-bg-primary"
              style={{ left: `${i * 50}%` }}
            />
          ))}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => {
                if (el) cardsRef.current[index] = el
              }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative p-6 md:p-8 rounded-2xl bg-bg-secondary/50 border border-bg-tertiary hover:border-neon-purple/50 transition-all duration-300 hover:-translate-y-2">
                {/* Number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center text-white font-bold text-lg shadow-neon-purple">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple mb-6 group-hover:scale-110 group-hover:bg-neon-purple/20 transition-all duration-300">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3 group-hover:text-neon-purple transition-colors">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">{step.description}</p>
              </div>

              {/* Connector arrow (not on last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform translate-x-1/2 -translate-y-1/2 text-neon-purple/30">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
