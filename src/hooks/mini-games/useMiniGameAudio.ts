/**
 * useMiniGameAudio - Hook spécifique pour les sons des mini-jeux
 * Gère automatiquement le volume selon les préférences utilisateur
 */

'use client'

import { useAudio } from '@/hooks/useAudio'
import { useAudioSettings } from '@/contexts/AudioContext'
import { useEffect, useCallback } from 'react'

type MiniGameType = 'pachinko' | 'wheel' | 'dice' | 'slots' | 'coin' | 'scratch'

interface MiniGameSounds {
  [key: string]: {
    play: () => Promise<void>
    pause: () => void
    stop: () => void
  }
}

/**
 * Hook pour gérer l'audio d'un mini-jeu spécifique
 * Les sons sont automatiquement liés aux préférences utilisateur
 */
export function useMiniGameAudio(gameType: MiniGameType): MiniGameSounds {
  const { settings } = useAudioSettings()

  // Calculer le volume effectif (0-1)
  const effectiveVolume = settings.sfxEnabled ? settings.sfxVolume / 100 : 0

  // Pachinko sounds
  const pachinko_ballDrop = useAudio('/sounds/mini-games/pachinko/ball-drop.wav', {
    volume: 0.4 * effectiveVolume,
    preload: true,
  })
  const pachinko_pegHit = useAudio('/sounds/mini-games/pachinko/peg-hit.wav', {
    volume: 0.3 * effectiveVolume,
    preload: true,
  })
  const pachinko_slotWin = useAudio('/sounds/mini-games/pachinko/slot-win.wav', {
    volume: 0.6 * effectiveVolume,
    preload: false,
  })

  // Wheel sounds
  const wheel_spinStart = useAudio('/sounds/mini-games/wheel/spin-start.wav', {
    volume: 0.5 * effectiveVolume,
    preload: true,
  })
  const wheel_tick = useAudio('/sounds/mini-games/wheel/tick.wav', {
    volume: 0.3 * effectiveVolume,
    preload: true,
  })
  const wheel_win = useAudio('/sounds/mini-games/wheel/win.wav', {
    volume: 0.6 * effectiveVolume,
    preload: false,
  })

  // Dice sounds
  const dice_roll = useAudio('/sounds/mini-games/dice/roll.wav', {
    volume: 0.5 * effectiveVolume,
    preload: true,
  })
  const dice_bounce = useAudio('/sounds/mini-games/dice/bounce.wav', {
    volume: 0.3 * effectiveVolume,
    preload: true,
  })
  const dice_land = useAudio('/sounds/mini-games/dice/land.wav', {
    volume: 0.4 * effectiveVolume,
    preload: false,
  })

  // Slots sounds
  const slots_spin = useAudio('/sounds/mini-games/slots/spin.wav', {
    volume: 0.5 * effectiveVolume,
    loop: true,
    preload: true,
  })
  const slots_stop = useAudio('/sounds/mini-games/slots/stop.wav', {
    volume: 0.4 * effectiveVolume,
    preload: true,
  })
  const slots_jackpot = useAudio('/sounds/mini-games/slots/jackpot.wav', {
    volume: 0.7 * effectiveVolume,
    preload: false,
  })

  // Coin sounds
  const coin_flip = useAudio('/sounds/mini-games/coin/flip.wav', {
    volume: 0.5 * effectiveVolume,
    preload: true,
  })
  const coin_spin = useAudio('/sounds/mini-games/coin/spin.wav', {
    volume: 0.3 * effectiveVolume,
    loop: true,
    preload: true,
  })
  const coin_land = useAudio('/sounds/mini-games/coin/land.wav', {
    volume: 0.4 * effectiveVolume,
    preload: false,
  })

  // Scratch sounds
  const scratch_scratch = useAudio('/sounds/mini-games/scratch/scratch.wav', {
    volume: 0.2 * effectiveVolume,
    loop: true,
    preload: true,
  })
  const scratch_reveal = useAudio('/sounds/mini-games/scratch/reveal.wav', {
    volume: 0.6 * effectiveVolume,
    preload: false,
  })

  // Mettre à jour le volume de tous les sons quand les settings changent
  useEffect(() => {
    const vol = effectiveVolume

    pachinko_ballDrop.setVolume(0.4 * vol)
    pachinko_pegHit.setVolume(0.3 * vol)
    pachinko_slotWin.setVolume(0.6 * vol)

    wheel_spinStart.setVolume(0.5 * vol)
    wheel_tick.setVolume(0.3 * vol)
    wheel_win.setVolume(0.6 * vol)

    dice_roll.setVolume(0.5 * vol)
    dice_bounce.setVolume(0.3 * vol)
    dice_land.setVolume(0.4 * vol)

    slots_spin.setVolume(0.5 * vol)
    slots_stop.setVolume(0.4 * vol)
    slots_jackpot.setVolume(0.7 * vol)

    coin_flip.setVolume(0.5 * vol)
    coin_spin.setVolume(0.3 * vol)
    coin_land.setVolume(0.4 * vol)

    scratch_scratch.setVolume(0.2 * vol)
    scratch_reveal.setVolume(0.6 * vol)
  }, [effectiveVolume])

  // Retourner les sons du jeu spécifique
  const sounds: Record<MiniGameType, MiniGameSounds> = {
    pachinko: {
      ballDrop: pachinko_ballDrop,
      pegHit: pachinko_pegHit,
      slotWin: pachinko_slotWin,
    },
    wheel: {
      spinStart: wheel_spinStart,
      tick: wheel_tick,
      win: wheel_win,
    },
    dice: {
      roll: dice_roll,
      bounce: dice_bounce,
      land: dice_land,
    },
    slots: {
      spin: slots_spin,
      stop: slots_stop,
      jackpot: slots_jackpot,
    },
    coin: {
      flip: coin_flip,
      spin: coin_spin,
      land: coin_land,
    },
    scratch: {
      scratch: scratch_scratch,
      reveal: scratch_reveal,
    },
  }

  return sounds[gameType]
}

/**
 * Hook simple pour jouer un son unique avec respect des préférences
 */
export function useSound(src: string, baseVolume: number = 0.5) {
  const { settings } = useAudioSettings()
  const effectiveVolume = settings.sfxEnabled ? (settings.sfxVolume / 100) * baseVolume : 0

  const audio = useAudio(src, { volume: effectiveVolume })

  useEffect(() => {
    audio.setVolume(effectiveVolume)
  }, [effectiveVolume, audio])

  const play = useCallback(async () => {
    if (!settings.sfxEnabled) return
    await audio.play()
  }, [settings.sfxEnabled, audio])

  return { play, pause: audio.pause, stop: audio.stop }
}
