'use client'

import { useCallback, useRef, useEffect } from 'react'

interface UseSoundsReturn {
  playHeartbeat: () => void
  playClick: () => void
  playWin: () => void
  playUrgent: () => void
  stopAll: () => void
}

/**
 * Hook pour jouer des effets sonores gaming
 * Utilise l'API Web Audio pour générer des sons sans fichiers externes
 */
export function useSounds(enabled: boolean = true): UseSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingHeartbeatRef = useRef(false)

  // Initialize AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Generate a single heartbeat "thump"
  const playThump = useCallback((audioContext: AudioContext, frequency: number = 80, duration: number = 0.15) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioContext.currentTime + duration)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }, [])

  // Play heartbeat sound (double thump pattern like a real heartbeat)
  const playHeartbeat = useCallback(() => {
    if (!enabled || isPlayingHeartbeatRef.current) return

    isPlayingHeartbeatRef.current = true

    const playBeat = () => {
      try {
        const audioContext = getAudioContext()
        // First thump (louder)
        playThump(audioContext, 80, 0.1)
        // Second thump (softer, slightly delayed)
        setTimeout(() => {
          playThump(audioContext, 60, 0.08)
        }, 100)
      } catch {
        // Audio not available
      }
    }

    // Play immediately
    playBeat()

    // Continue heartbeat pattern every 800ms
    heartbeatIntervalRef.current = setInterval(playBeat, 800)
  }, [enabled, getAudioContext, playThump])

  // Play click sound
  const playClick = useCallback(() => {
    if (!enabled) return
    try {
      const audioContext = getAudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch {
      // Audio not available
    }
  }, [enabled, getAudioContext])

  // Play win/success sound
  const playWin = useCallback(() => {
    if (!enabled) return
    try {
      const audioContext = getAudioContext()

      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1)

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3)

        oscillator.start(audioContext.currentTime + i * 0.1)
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3)
      })
    } catch {
      // Audio not available
    }
  }, [enabled, getAudioContext])

  // Play urgent/warning sound
  const playUrgent = useCallback(() => {
    if (!enabled) return
    try {
      const audioContext = getAudioContext()

      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime + i * 0.15)

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.15)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.1)

        oscillator.start(audioContext.currentTime + i * 0.15)
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.1)
      }
    } catch {
      // Audio not available
    }
  }, [enabled, getAudioContext])

  // Stop all sounds (especially heartbeat)
  const stopAll = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    isPlayingHeartbeatRef.current = false
  }, [])

  return {
    playHeartbeat,
    playClick,
    playWin,
    playUrgent,
    stopAll,
  }
}
