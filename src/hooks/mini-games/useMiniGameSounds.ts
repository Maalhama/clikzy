'use client'

import { useCallback, useRef } from 'react'

// Type pour supporter webkitAudioContext (Safari)
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

/**
 * Hook réutilisable pour les sons synthétisés des mini-jeux
 * Utilise Web Audio API pour générer des sons sans fichiers audio
 */
export function useMiniGameSounds() {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Obtenir ou créer le contexte audio
  const getAudioContext = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx()
      }
    }
    return audioContextRef.current
  }, [])

  /**
   * Son bref pour les décomptes/segments (tick)
   * @param pitch - Hauteur du son (1 = normal, 2 = aigu, 0.5 = grave)
   */
  const playTick = useCallback((pitch: number = 1) => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = 800 * pitch

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch (error) {
      // Silently fail si Web Audio API non disponible
      console.warn('Web Audio API not available:', error)
    }
  }, [getAudioContext])

  /**
   * Son de collision/impact
   * @param intensity - Intensité (0-1, défaut 0.5)
   */
  const playImpact = useCallback((intensity: number = 0.5) => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sawtooth'
      osc.frequency.value = 80

      filter.type = 'lowpass'
      filter.frequency.value = 1000

      const volume = 0.2 * intensity
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }, [getAudioContext])

  /**
   * Son de mouvement rapide (whoosh)
   * @param duration - Durée en secondes (défaut 0.3)
   */
  const playWhoosh = useCallback((duration: number = 0.3) => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sawtooth'

      // Slide descendant pour effet whoosh
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration)

      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }, [getAudioContext])

  /**
   * Son de victoire (arpège montant)
   */
  const playWin = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const notes = [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do (octave)

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.value = freq

        const startTime = ctx.currentTime + (i * 0.08)
        gain.gain.setValueAtTime(0.15, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }, [getAudioContext])

  /**
   * Son de grattage (bruit blanc modulé)
   */
  const playScratch = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const bufferSize = ctx.sampleRate * 0.05 // 50ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      // Générer bruit blanc
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const source = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      source.buffer = buffer
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      filter.type = 'bandpass'
      filter.frequency.value = 2000

      gain.gain.value = 0.08

      source.start(ctx.currentTime)
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }, [getAudioContext])

  /**
   * Vibration haptique (mobile uniquement)
   * @param pattern - Pattern de vibration ([durée, pause, durée, ...])
   */
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.warn('Vibration API not available:', error)
      }
    }
  }, [])

  return {
    playTick,
    playImpact,
    playWhoosh,
    playWin,
    playScratch,
    vibrate,
  }
}
