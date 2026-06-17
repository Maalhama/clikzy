'use client'

import { useEffect, useState, useRef } from 'react'
import { calculateTimeLeft } from '@/lib/utils/timer'
import { GAME_CONSTANTS } from '@/lib/constants'

type UseTimerOptions = {
  endTime: number | string
  onEnd?: () => void
}

export function useTimer({ endTime, onEnd }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endTime))
  const onEndRef = useRef(onEnd)
  const hasEndedRef = useRef(false)

  // Keep onEnd callback ref updated
  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  // Update timer when endTime changes (e.g., after a click resets it)
  useEffect(() => {
    setTimeLeft(calculateTimeLeft(endTime))
    hasEndedRef.current = false
  }, [endTime])

  // Tick ADAPTATIF : 1s hors phase finale (le mm:ss ne change qu'à la seconde), 250ms en
  // phase finale (fluidité des secondes), et on ARRÊTE de planifier à 0. Évite de re-rendre
  // toute la page de jeu 10×/s en continu (setInterval 100ms permanent auparavant).
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const tick = () => {
      const newTimeLeft = calculateTimeLeft(endTime)
      setTimeLeft(newTimeLeft)
      if (newTimeLeft <= 0) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true
          onEndRef.current?.()
        }
        return // partie terminée -> plus de planification
      }
      const delay = newTimeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD ? 250 : 1000
      timeoutId = setTimeout(tick, delay)
    }
    tick()
    return () => clearTimeout(timeoutId)
  }, [endTime])

  const isUrgent = timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD
  const isEnded = timeLeft <= 0

  return {
    timeLeft,
    isUrgent,
    isEnded,
  }
}
