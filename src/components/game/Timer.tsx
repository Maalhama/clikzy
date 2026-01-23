'use client'

import { formatTime } from '@/lib/utils/timer'

type TimerProps = {
  timeLeft: number
  isUrgent: boolean
  status: 'waiting' | 'active' | 'final_phase' | 'ended'
}

export function Timer({ timeLeft, isUrgent, status }: TimerProps) {
  const getTimerClass = () => {
    if (status === 'waiting') return 'text-text-secondary'
    if (timeLeft <= 5000) return 'timer-critical'
    if (timeLeft <= 30000) return 'timer-warning'
    if (isUrgent) return 'text-danger neon-text-danger animate-pulse'
    return 'text-neon-blue neon-text-blue'
  }

  const getStatusLabel = () => {
    if (status === 'waiting') return 'Commence bientôt'
    if (status === 'ended') return 'Terminé'
    if (isUrgent) return '⚡ Phase finale !'
    return 'Temps restant'
  }

  return (
    <div className="text-center">
      <div className="text-xs text-text-secondary mb-2 uppercase tracking-wider">
        {getStatusLabel()}
      </div>
      <div
        className={`text-6xl md:text-7xl font-mono font-bold transition-all ${getTimerClass()}`}
      >
        {status === 'waiting' ? '--:--:--' : formatTime(timeLeft)}
      </div>
      {isUrgent && status !== 'ended' && (
        <div className="mt-3 text-sm text-danger animate-pulse">
          Chaque clic remet le timer à 1min30 !
        </div>
      )}
    </div>
  )
}
