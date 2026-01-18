'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap/gsapConfig'

interface UseGsapScrollOptions {
  trigger?: string | Element
  start?: string
  end?: string
  scrub?: boolean | number
  pin?: boolean
  markers?: boolean
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
}

export function useGsapScroll(options: UseGsapScrollOptions = {}) {
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)

  const createScrollTrigger = useCallback(
    (
      animation: gsap.core.Animation,
      customOptions?: Partial<UseGsapScrollOptions>
    ) => {
      const mergedOptions = { ...options, ...customOptions }

      scrollTriggerRef.current = ScrollTrigger.create({
        animation,
        trigger: mergedOptions.trigger,
        start: mergedOptions.start || 'top 80%',
        end: mergedOptions.end || 'bottom 20%',
        scrub: mergedOptions.scrub,
        pin: mergedOptions.pin,
        markers: mergedOptions.markers,
        onEnter: mergedOptions.onEnter,
        onLeave: mergedOptions.onLeave,
        onEnterBack: mergedOptions.onEnterBack,
        onLeaveBack: mergedOptions.onLeaveBack,
      })

      return scrollTriggerRef.current
    },
    [options]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill()
      }
    }
  }, [])

  return {
    createScrollTrigger,
    scrollTrigger: scrollTriggerRef.current,
  }
}

// Hook for parallax effect
export function useParallax(
  elementRef: React.RefObject<HTMLElement | null>,
  speed = 0.5
) {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const yPos = self.progress * 100 * speed
        gsap.set(element, { y: yPos })
      },
    })

    return () => {
      scrollTrigger.kill()
    }
  }, [elementRef, speed])
}

// Hook for reveal on scroll
export function useRevealOnScroll(
  elementRef: React.RefObject<HTMLElement | null>,
  options: {
    direction?: 'up' | 'down' | 'left' | 'right'
    distance?: number
    duration?: number
    delay?: number
    start?: string
  } = {}
) {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const {
      direction = 'up',
      distance = 50,
      duration = 0.6,
      delay = 0,
      start = 'top 80%',
    } = options

    const fromVars: gsap.TweenVars = { opacity: 0 }
    const toVars: gsap.TweenVars = {
      opacity: 1,
      duration,
      delay,
      ease: 'power2.out',
    }

    switch (direction) {
      case 'up':
        fromVars.y = distance
        toVars.y = 0
        break
      case 'down':
        fromVars.y = -distance
        toVars.y = 0
        break
      case 'left':
        fromVars.x = distance
        toVars.x = 0
        break
      case 'right':
        fromVars.x = -distance
        toVars.x = 0
        break
    }

    gsap.set(element, fromVars)

    const animation = gsap.to(element, {
      ...toVars,
      scrollTrigger: {
        trigger: element,
        start,
        toggleActions: 'play none none reverse',
      },
    })

    return () => {
      animation.kill()
    }
  }, [elementRef, options])
}

// Hook for scroll progress (useful for progress bars)
export function useScrollProgress(
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const progressRef = useRef(0)

  useEffect(() => {
    const updateProgress = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const viewHeight = window.innerHeight
        const totalHeight = rect.height - viewHeight
        const scrolled = -rect.top
        progressRef.current = Math.max(0, Math.min(1, scrolled / totalHeight))
      } else {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        progressRef.current = window.scrollY / scrollHeight
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => {
      window.removeEventListener('scroll', updateProgress)
    }
  }, [containerRef])

  return progressRef
}
