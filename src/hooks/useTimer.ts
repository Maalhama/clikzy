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

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft <= 0 && !hasEndedRef.current) {
        hasEndedRef.current = true
        onEndRef.current?.()
      }
    }, 100) // Update every 100ms for smooth countdown

    return () => clearInterval(interval)
  }, [endTime])

  const isUrgent = timeLeft > 0 && timeLeft <= GAME_CONSTANTS.FINAL_PHASE_THRESHOLD
  const isEnded = timeLeft <= 0

  return {
    timeLeft,
    isUrgent,
    isEnded,
  }
}
