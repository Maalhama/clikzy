'use client'

import { gsap } from './gsapConfig'

// Animation presets for consistent timing across the landing page
export const DURATIONS = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  verySlow: 1.2,
} as const

export const EASINGS = {
  // Standard easings
  smooth: 'power2.out',
  smoothIn: 'power2.in',
  smoothInOut: 'power2.inOut',

  // Bouncy easings
  elastic: 'elastic.out(1, 0.5)',
  bounce: 'bounce.out',
  back: 'back.out(1.7)',

  // Dramatic easings
  expo: 'expo.out',
  expoIn: 'expo.in',
  expoInOut: 'expo.inOut',
} as const

// Animation presets
export const fadeInUp = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: DURATIONS.normal,
      delay,
      ease: EASINGS.smooth,
    }
  )
}

export const fadeInDown = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: -50 },
    {
      opacity: 1,
      y: 0,
      duration: DURATIONS.normal,
      delay,
      ease: EASINGS.smooth,
    }
  )
}

export const fadeIn = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: DURATIONS.normal,
      delay,
      ease: EASINGS.smooth,
    }
  )
}

export const scaleIn = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration: DURATIONS.normal,
      delay,
      ease: EASINGS.back,
    }
  )
}

export const slideInLeft = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: -100 },
    {
      opacity: 1,
      x: 0,
      duration: DURATIONS.slow,
      delay,
      ease: EASINGS.smooth,
    }
  )
}

export const slideInRight = (element: gsap.TweenTarget, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, x: 100 },
    {
      opacity: 1,
      x: 0,
      duration: DURATIONS.slow,
      delay,
      ease: EASINGS.smooth,
    }
  )
}

// Stagger animation for multiple elements
export const staggerFadeInUp = (
  elements: gsap.TweenTarget,
  staggerDelay = 0.1,
  startDelay = 0
) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: DURATIONS.normal,
      delay: startDelay,
      stagger: staggerDelay,
      ease: EASINGS.smooth,
    }
  )
}

// Letter by letter reveal animation
export const letterReveal = (
  element: HTMLElement,
  delay = 0
) => {
  const text = element.textContent || ''
  element.textContent = ''

  const chars = text.split('').map((char) => {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00A0' : char
    span.style.display = 'inline-block'
    span.style.opacity = '0'
    element.appendChild(span)
    return span
  })

  return gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.05,
    stagger: 0.05,
    delay,
    ease: EASINGS.elastic,
    onStart: () => {
      gsap.set(chars, { y: 20 })
    },
  })
}

// Count up animation for numbers
export const countUp = (
  element: HTMLElement,
  endValue: number,
  duration = DURATIONS.slow,
  prefix = '',
  suffix = ''
) => {
  const obj = { value: 0 }
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: EASINGS.expoInOut,
    onUpdate: () => {
      element.textContent = `${prefix}${Math.round(obj.value)}${suffix}`
    },
  })
}

// Continuous rotation for 3D effect
export const continuousRotate = (element: gsap.TweenTarget) => {
  return gsap.to(element, {
    rotateY: 360,
    duration: 20,
    ease: 'none',
    repeat: -1,
  })
}

// Floating animation
export const float = (element: gsap.TweenTarget) => {
  return gsap.to(element, {
    y: -15,
    duration: 2,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true,
  })
}

// Pulse glow effect
export const pulseGlow = (element: gsap.TweenTarget) => {
  return gsap.to(element, {
    boxShadow: '0 0 40px rgba(155, 92, 255, 0.8), 0 0 80px rgba(155, 92, 255, 0.4)',
    duration: 1.5,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true,
  })
}

// Shake effect for urgency
export const shake = (element: gsap.TweenTarget) => {
  return gsap.to(element, {
    x: 5,
    duration: 0.1,
    ease: 'power1.inOut',
    repeat: 5,
    yoyo: true,
    onComplete: () => {
      gsap.set(element, { x: 0 })
    },
  })
}

// Typewriter effect
export const typewriter = (
  element: HTMLElement,
  text: string,
  delay = 0
) => {
  element.textContent = ''
  const tl = gsap.timeline({ delay })

  text.split('').forEach((char, i) => {
    tl.to(element, {
      duration: 0.05,
      onComplete: () => {
        element.textContent += char
      },
    }, i * 0.05)
  })

  return tl
}

// Shine effect for prize items
export const shineEffect = (element: gsap.TweenTarget) => {
  return gsap.fromTo(
    element,
    { backgroundPosition: '-200% 0' },
    {
      backgroundPosition: '200% 0',
      duration: 2,
      ease: 'power1.inOut',
      repeat: -1,
      repeatDelay: 3,
    }
  )
}
