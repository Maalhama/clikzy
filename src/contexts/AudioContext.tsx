/**
 * AudioContext - Gestion des préférences audio utilisateur
 * Permet de contrôler le volume et l'activation des sons/musique
 */

'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface AudioSettings {
  sfxEnabled: boolean
  sfxVolume: number // 0-100
  musicEnabled: boolean
  musicVolume: number // 0-100
}

interface AudioContextType {
  settings: AudioSettings
  setSfxEnabled: (enabled: boolean) => void
  setSfxVolume: (volume: number) => void
  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  sfxVolume: 50,
  musicEnabled: false,
  musicVolume: 30,
}

const STORAGE_KEY = 'cleekzy_audio_settings'

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger les paramètres depuis localStorage au mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AudioSettings
        setSettings(parsed)
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error)
    }

    setIsLoaded(true)
  }, [])

  // Sauvegarder les paramètres dans localStorage à chaque changement
  useEffect(() => {
    if (!isLoaded) return
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save audio settings:', error)
    }
  }, [settings, isLoaded])

  const setSfxEnabled = (enabled: boolean) => {
    setSettings((s) => ({ ...s, sfxEnabled: enabled }))
  }

  const setSfxVolume = (volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume))
    setSettings((s) => ({ ...s, sfxVolume: clamped }))
  }

  const setMusicEnabled = (enabled: boolean) => {
    setSettings((s) => ({ ...s, musicEnabled: enabled }))
  }

  const setMusicVolume = (volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume))
    setSettings((s) => ({ ...s, musicVolume: clamped }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <AudioContext.Provider
      value={{
        settings,
        setSfxEnabled,
        setSfxVolume,
        setMusicEnabled,
        setMusicVolume,
        resetSettings,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudioSettings(): AudioContextType {
  const context = useContext(AudioContext)
  // Return default values instead of throwing if context is not available
  // This can happen during SSR or if component is rendered outside provider
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      setSfxEnabled: () => {},
      setSfxVolume: () => {},
      setMusicEnabled: () => {},
      setMusicVolume: () => {},
      resetSettings: () => {},
    }
  }
  return context
}
