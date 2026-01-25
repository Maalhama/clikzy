/**
 * AudioSettings - Interface pour contrôler les paramètres audio
 * Affiche les toggles et sliders pour SFX et musique
 */

'use client'

import { useAudioSettings } from '@/contexts/AudioContext'
import { Volume2, VolumeX, Music } from 'lucide-react'

export function AudioSettings() {
  const {
    settings,
    setSfxEnabled,
    setSfxVolume,
    setMusicEnabled,
    setMusicVolume,
    resetSettings,
  } = useAudioSettings()

  return (
    <div className="space-y-6 p-6 bg-bg-secondary rounded-lg border border-neon-purple/20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Paramètres Audio</h3>
        <button
          onClick={resetSettings}
          className="text-xs text-neon-purple hover:text-neon-pink transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      {/* SFX Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.sfxEnabled ? (
              <Volume2 className="w-5 h-5 text-neon-purple" />
            ) : (
              <VolumeX className="w-5 h-5 text-white/30" />
            )}
            <span className="font-medium text-white">Effets Sonores</span>
          </div>

          <button
            onClick={() => setSfxEnabled(!settings.sfxEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.sfxEnabled ? 'bg-neon-purple' : 'bg-white/20'
            }`}
            aria-label={settings.sfxEnabled ? 'Désactiver les SFX' : 'Activer les SFX'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.sfxEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* SFX Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>Volume</span>
            <span>{settings.sfxVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            disabled={!settings.sfxEnabled}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-neon-purple
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-neon-purple
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-neon-purple
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      </div>

      {/* Music Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-neon-blue' : 'text-white/30'}`} />
            <span className="font-medium text-white">Musique d'Ambiance</span>
          </div>

          <button
            onClick={() => setMusicEnabled(!settings.musicEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.musicEnabled ? 'bg-neon-blue' : 'bg-white/20'
            }`}
            aria-label={settings.musicEnabled ? 'Désactiver la musique' : 'Activer la musique'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Music Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>Volume</span>
            <span>{settings.musicVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            disabled={!settings.musicEnabled}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-neon-blue
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-neon-blue
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-neon-blue
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-white/40 leading-relaxed">
        Les paramètres audio sont sauvegardés automatiquement dans votre navigateur.
      </p>
    </div>
  )
}
