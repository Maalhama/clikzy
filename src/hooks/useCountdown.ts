'use client'

import { useState, useEffect, useCallback } from 'react'

interface CountdownState {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
  formatted: string
}

/**
 * Hook to countdown to a target date
 * @param targetDate - The date to countdown to (ISO string or Date)
 * @returns Countdown state with hours, minutes, seconds and formatted string
 */
export function useCountdown(targetDate: string | Date | null): CountdownState {
  const calculateTimeLeft = useCallback((): CountdownState => {
    if (!targetDate) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: '00:00:00',
      }
    }

    const target = new Date(targetDate).getTime()
    const now = Date.now()
    const difference = target - now

    if (difference <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: '00:00:00',
      }
    }

    const totalSeconds = Math.floor(difference / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const formatted = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':')

    return {
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
      formatted,
    }
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState<CountdownState>(calculateTimeLeft)

  useEffect(() => {
    // Update immediately
    setTimeLeft(calculateTimeLeft())

    // Then update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  return timeLeft
}
