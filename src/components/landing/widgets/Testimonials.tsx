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
    text: "Le concept est simple mais vraiment addictif. J'ai gagne mon iPhone apres 2 semaines. Livraison rapide, tout etait conforme.",
    itemWon: 'iPhone 15 Pro',
    rating: 5,
    date: 'Il y a 2 jours',
  },
  {
    id: '2',
    username: 'MaxClick',
    text: "J'etais sceptique au debut mais le systeme est transparent. On voit les clics en temps reel. Ma PS5 est arrivee en 4 jours.",
    itemWon: 'PlayStation 5',
    rating: 5,
    date: 'Il y a 1 semaine',
  },
  {
    id: '3',
    username: 'LuckyOne',
    text: "Le support repond vite et les paiements sont securises. Bonne experience globale, je recommande.",
    itemWon: 'AirPods Pro',
    rating: 5,
    date: 'Il y a 3 jours',
  },
  {
    id: '4',
    username: 'WinnerX',
    text: "Interface claire et lots reguliers. J'ai gagne ma Switch apres plusieurs essais, le systeme est equilibre.",
    itemWon: 'Nintendo Switch',
    rating: 5,
    date: 'Il y a 5 jours',
  },
]

export function Testimonials({
  testimonials = MOCK_TESTIMONIALS,
  autoPlayInterval = 4000,
  className = '',
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)

  // Auto-scroll with progress bar
  useEffect(() => {
    if (isHovered) {
      setProgress(0)
      return
    }

    const progressInterval = 50 // Update progress every 50ms
    const steps = autoPlayInterval / progressInterval

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((i) => (i + 1) % testimonials.length)
          return 0
        }
        return prev + (100 / steps)
      })
    }, progressInterval)

    return () => clearInterval(timer)
  }, [testimonials.length, autoPlayInterval, isHovered])

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div
      className={`relative bg-bg-secondary/50 backdrop-blur-sm rounded-xl overflow-hidden group/testimonials ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover/testimonials:border-neon-pink/30 transition-colors duration-500" />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover/testimonials:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(255, 79, 216, 0.15), inset 0 0 40px rgba(255, 79, 216, 0.03)',
        }}
      />

      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Fire icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-neon-pink/30 blur-lg rounded-full animate-pulse" />
            <FireIcon className="w-7 h-7 text-neon-pink relative z-10" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider">ILS L'ONT FAIT</h3>
        </div>
      </div>

      {/* Testimonial content */}
      <div className="relative p-6 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stars with glow */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < currentTestimonial.rating ? 'text-yellow-400' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    filter: i < currentTestimonial.rating ? 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.6))' : 'none',
                  }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote with styled marks */}
            <div className="relative">
              {/* Opening quote mark */}
              <span
                className="absolute -top-2 -left-2 text-4xl text-neon-pink/30 font-serif"
                style={{ textShadow: '0 0 10px rgba(255, 79, 216, 0.3)' }}
              >
                "
              </span>
              <blockquote className="text-lg text-white/80 mb-6 leading-relaxed pl-4">
                {currentTestimonial.text}
              </blockquote>
            </div>

            {/* Author */}
            <div className="flex items-center gap-4">
              {/* Avatar with glow */}
              <div className="relative group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/50 to-neon-pink/50 rounded-full blur-md" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-bold text-lg border-2 border-white/20">
                  {currentTestimonial.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="font-bold">{currentTestimonial.username}</div>
                <div
                  className="text-sm text-neon-blue font-medium"
                  style={{ textShadow: '0 0 10px rgba(60, 203, 255, 0.4)' }}
                >
                  A remporte: {currentTestimonial.itemWon}
                </div>
                <div className="text-xs text-white/40">{currentTestimonial.date}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots with progress indicator */}
      <div className="flex justify-center gap-3 pb-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              setProgress(0)
            }}
            className={`
              relative h-2 rounded-full transition-all duration-300 overflow-hidden
              ${index === currentIndex
                ? 'w-10 bg-white/20'
                : 'w-2 bg-white/20 hover:bg-white/40'
              }
            `}
          >
            {/* Progress fill for active dot */}
            {index === currentIndex && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full shadow-[0_0_10px_rgba(255,79,216,0.5)]"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
