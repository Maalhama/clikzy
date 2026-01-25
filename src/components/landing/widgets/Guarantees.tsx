'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useIsMobile } from '@/hooks/useIsMobile'

interface GuaranteesProps {
  className?: string
}

// Guarantee items - different from TrustBadges
const GUARANTEES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Paiement sécurisé',
    description: 'SSL + Stripe',
    color: '#9B5CFF',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Produits neufs',
    description: 'Garantie constructeur',
    color: '#3CCBFF',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    title: 'Expédition rapide',
    description: '5-7 jours ouvrés',
    color: '#FF4FD8',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Support 24/7',
    description: 'Réponse < 2h',
    color: '#00FF88',
  },
]

// Delivery proofs with real unboxing photos - 2026 edition
const DELIVERY_PROOFS = [
  { id: 1, image: '/delivery-proofs/delivery-proof-iphone.jpg', username: 'beger2303', item: 'iPhone 17 Pro Max' },
  { id: 2, image: '/delivery-proofs/delivery-proof-ps5.jpg', username: 'Ibra_sn', item: 'PlayStation 5 Pro' },
  { id: 3, image: '/delivery-proofs/delivery-proof-macbook.jpg', username: 'samipsg', item: 'MacBook Pro M5' },
  { id: 4, image: '/delivery-proofs/delivery-proof-airpods.jpg', username: 'Bilal_69', item: 'AirPods Pro 3' },
]

export function Guarantees({ className = '' }: GuaranteesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isVisible])

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  return (
    <div ref={containerRef} className={className}>
      {/* === MOBILE VERSION === */}
      <div className="md:hidden px-4 py-8">
        {/* Guarantees */}
        <div className="mb-8">
          <h3 className="text-lg font-black text-center mb-4">
            NOS <span className="text-neon-purple">GARANTIES</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {GUARANTEES.map((item, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-xl bg-bg-secondary/50 border border-white/10
                  ${isMobile ? '' : 'transition-all duration-500'}
                  ${isMobile ? 'opacity-100' : (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}
                `}
                style={{ transitionDelay: isMobile ? '0ms' : `${index * 100}ms` }}
              >
                <div className="mb-2" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <div className="text-[10px] text-white/50">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Proofs */}
        <div className="mb-8">
          <h3 className="text-lg font-black text-center mb-4">
            PREUVES DE <span className="text-success">LIVRAISON</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {DELIVERY_PROOFS.map((proof, index) => (
              <div
                key={proof.id}
                className={`
                  relative rounded-xl overflow-hidden bg-bg-secondary/50 border border-white/10
                  ${isMobile ? '' : 'transition-all duration-500'}
                  ${isMobile ? 'opacity-100' : (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}
                `}
                style={{ transitionDelay: isMobile ? '0ms' : `${(index + 4) * 100}ms` }}
              >
                <div className="aspect-square relative">
                  {imageErrors[proof.id] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 p-3">
                      <svg className="w-8 h-8 text-success mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-[10px] text-white/50 text-center">Photo à venir</span>
                    </div>
                  ) : (
                    <Image
                      src={proof.image}
                      alt={`Livraison ${proof.item}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                      onError={() => handleImageError(proof.id)}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-[10px] font-bold text-white truncate">{proof.username}</div>
                    <div className="text-[9px] text-success truncate">{proof.item}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trustpilot Badge */}
        <div
          className={`
            p-4 rounded-xl bg-bg-secondary/50 border border-white/10 text-center
            ${isMobile ? '' : 'transition-all duration-500'}
            ${isMobile ? 'opacity-100' : (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}
          `}
          style={{ transitionDelay: isMobile ? '0ms' : '800ms' }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {/* Trustpilot Star Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#00B67A"/>
            </svg>
            <span className="font-black text-[#00B67A]">Trustpilot</span>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-4 h-4 text-[#00B67A]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <div className="text-xs text-white/70">
            <span className="font-bold text-white">4.8/5</span> basé sur <span className="font-bold text-white">127 avis</span>
          </div>
        </div>
      </div>

      {/* === DESKTOP VERSION === */}
      <div className="hidden md:block py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">
              NOS <span className="text-neon-purple">GARANTIES</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Ta confiance est notre priorité. Voici nos engagements.
            </p>
          </div>

          {/* Guarantees Grid */}
          <div className="grid grid-cols-4 gap-6 mb-16">
            {GUARANTEES.map((item, index) => (
              <div
                key={index}
                className={`
                  group p-6 rounded-xl bg-bg-secondary/50 border border-white/10
                  hover:border-opacity-50 transition-all duration-500
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  borderColor: `${item.color}20`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}20`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="font-bold text-white mb-1">{item.title}</div>
                <div className="text-sm text-white/50">{item.description}</div>
              </div>
            ))}
          </div>

          {/* Delivery Proofs + Trustpilot */}
          <div>
            <h3 className="text-2xl font-black mb-6">
              PREUVES DE <span className="text-success">LIVRAISON</span>
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {/* Delivery Proofs */}
              {DELIVERY_PROOFS.map((proof, index) => (
                <div
                  key={proof.id}
                  className={`
                    group relative rounded-xl overflow-hidden bg-bg-secondary/50 border border-white/10
                    hover:border-success/50 transition-all duration-500
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                  style={{ transitionDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className="aspect-square relative">
                    {imageErrors[proof.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 p-4">
                        <svg className="w-10 h-10 text-success mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-xs text-white/50 text-center">Photo à venir</span>
                      </div>
                    ) : (
                      <Image
                        src={proof.image}
                        alt={`Livraison ${proof.item}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="200px"
                        onError={() => handleImageError(proof.id)}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="text-sm font-bold text-white">{proof.username}</div>
                      <div className="text-xs text-success">{proof.item}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Trustpilot - Same row as photos */}
              <div
                className={`
                  p-4 rounded-xl bg-bg-secondary/50 border border-[#00B67A]/30
                  transition-all duration-500 flex flex-col justify-center
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                style={{ transitionDelay: '800ms' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#00B67A"/>
                  </svg>
                  <span className="font-black text-lg text-[#00B67A]">Trustpilot</span>
                </div>

                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-[#00B67A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>

                <div className="text-white/70 mb-3">
                  <span className="font-black text-xl text-white">4.8</span>
                  <span className="text-xs">/5</span>
                  <div className="text-xs">127 avis</div>
                </div>

                <div className="text-[10px] text-white/50 italic leading-tight">
                  "Livraison rapide !"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
