/**
 * Hook useAudio - Gestion audio réutilisable
 * Permet de jouer des sons avec contrôle du volume, loop, etc.
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'

interface UseAudioOptions {
  volume?: number // 0.0 to 1.0
  loop?: boolean
  playbackRate?: number
  preload?: boolean
}

interface UseAudioReturn {
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
}

export function useAudio(
  src: string,
  options: UseAudioOptions = {}
): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Créer l'élément audio
    const audio = new Audio()
    audio.volume = options.volume ?? 0.5
    audio.loop = options.loop ?? false
    audio.playbackRate = options.playbackRate ?? 1.0

    // Preload si demandé
    if (options.preload !== false) {
      audio.preload = 'auto'
      audio.src = src
    }

    audioRef.current = audio

    // Marquer comme chargé quand prêt
    const handleCanPlay = () => {
      isLoadedRef.current = true
    }
    audio.addEventListener('canplaythrough', handleCanPlay)

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [src, options.volume, options.loop, options.playbackRate, options.preload])

  const play = useCallback(async () => {
    if (!audioRef.current) return

    try {
      // Si pas encore de src, le définir maintenant (lazy load)
      if (!audioRef.current.src && src) {
        audioRef.current.src = src
      }

      // Reset au début
      audioRef.current.currentTime = 0

      // Jouer (peut échouer si autoplay policy)
      await audioRef.current.play()
    } catch (error) {
      // Silencieux en cas d'erreur autoplay
      console.debug('Audio playback prevented:', error)
    }
  }, [src])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
  }, [])

  const stop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.max(0, Math.min(1, volume))
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = Math.max(0.1, Math.min(4, rate))
  }, [])

  return { play, pause, stop, setVolume, setPlaybackRate }
}
