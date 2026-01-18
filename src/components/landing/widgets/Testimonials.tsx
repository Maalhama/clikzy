'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FireIcon } from '@/components/ui/GamingIcons'

interface Testimonial {
  id: string
  username: string
  avatar?: string
  text: string
  itemWon: string
  rating: number
  date: string
}

interface TestimonialsProps {
  testimonials?: Testimonial[]
  autoPlayInterval?: number
  className?: string
}

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    username: 'Alex42',
    text: "Mon pote m'a dit 'c'est une arnaque'. 3 jours plus tard je deballais mon iPhone devant lui. Sa tete. 😂",
    itemWon: 'iPhone 15 Pro',
    rating: 5,
    date: 'Il y a 2 jours',
  },
  {
    id: '2',
    username: 'GamerPro',
    text: "J'ai clique a 0.3 secondes du timer. Mon coeur s'est arrete. Et la... GAGNE. PS5 gratuite frere.",
    itemWon: 'PlayStation 5',
    rating: 5,
    date: 'Il y a 1 semaine',
  },
  {
    id: '3',
    username: 'LuckyOne',
    text: "L'adrenaline quand t'es le dernier a cliquer et le timer descend... Y'a rien de comparable.",
    itemWon: 'AirPods Pro',
    rating: 5,
    date: 'Il y a 3 jours',
  },
  {
    id: '4',
    username: 'WinnerX',
    text: "2 gains en 1 semaine. Je sais pas comment c'est possible mais je me plains pas haha",
    itemWon: 'Nintendo Switch',
    rating: 5,
    date: 'Il y a 5 jours',
  },
]

export function Testimonials({
  testimonials = MOCK_TESTIMONIALS,
  autoPlayInterval = 5000,
  className = '',
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [testimonials.length, autoPlayInterval])

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className={`bg-bg-secondary/30 border border-white/10 clip-angle-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <FireIcon className="w-7 h-7 text-neon-pink" />
          <h3 className="text-xl font-black uppercase tracking-wider">ILS L'ONT FAIT</h3>
        </div>
      </div>

      {/* Testimonial content */}
      <div className="p-6 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < currentTestimonial.rating ? 'text-yellow-400' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-lg text-white/80 mb-6 leading-relaxed">
              "{currentTestimonial.text}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold text-lg">
                {currentTestimonial.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold">{currentTestimonial.username}</div>
                <div className="text-sm text-neon-blue">
                  A remporte: {currentTestimonial.itemWon}
                </div>
                <div className="text-xs text-white/40">{currentTestimonial.date}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 pb-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex
                ? 'w-8 bg-neon-purple'
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
