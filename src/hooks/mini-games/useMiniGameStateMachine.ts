import { useState, useCallback, useRef } from 'react'

/**
 * Generic State Machine for Mini-Games
 *
 * States:
 * - idle: Initial state, waiting for user action
 * - playing: Game animation in progress
 * - stopping: Game is stopping (transition phase)
 * - completed: Game finished, showing results
 *
 * Transitions with guards to prevent race conditions
 */

export type MiniGameState = 'idle' | 'playing' | 'stopping' | 'completed'

export interface MiniGameStateMachine {
  // Current state
  state: MiniGameState

  // State queries
  isIdle: boolean
  isPlaying: boolean
  isStopping: boolean
  isCompleted: boolean

  // State transitions
  start: () => boolean
  stop: () => boolean
  complete: () => boolean
  reset: () => void

  // Lock mechanism for async operations
  lock: () => boolean
  unlock: () => void
  isLocked: boolean
}

export interface UseMiniGameStateMachineOptions {
  // Optional callbacks for state transitions
  onStart?: () => void
  onStop?: () => void
  onComplete?: () => void
  onReset?: () => void

  // Debug mode (logs transitions)
  debug?: boolean
}

/**
 * Hook that provides a state machine for mini-games
 *
 * Usage:
 * ```tsx
 * const game = useMiniGameStateMachine({
 *   onStart: () => console.log('Game started'),
 *   onComplete: () => console.log('Game completed'),
 * })
 *
 * // Check state
 * if (game.isIdle) {
 *   // Show "play" button
 * }
 *
 * // Trigger transitions
 * game.start() // idle -> playing
 * game.stop()  // playing -> stopping
 * game.complete() // stopping -> completed
 * game.reset() // any -> idle
 * ```
 */
export function useMiniGameStateMachine(
  options: UseMiniGameStateMachineOptions = {}
): MiniGameStateMachine {
  const { onStart, onStop, onComplete, onReset, debug = false } = options

  const [state, setState] = useState<MiniGameState>('idle')
  const lockRef = useRef(false)

  const log = useCallback((message: string) => {
    if (debug) {
      console.log(`[MiniGameStateMachine] ${message}`)
    }
  }, [debug])

  // Lock mechanism to prevent race conditions during async operations
  const lock = useCallback((): boolean => {
    if (lockRef.current) {
      log('Already locked, transition rejected')
      return false
    }
    lockRef.current = true
    log('Locked')
    return true
  }, [log])

  const unlock = useCallback(() => {
    lockRef.current = false
    log('Unlocked')
  }, [log])

  // State transition: idle -> playing
  const start = useCallback((): boolean => {
    if (state !== 'idle') {
      log(`Cannot start from state: ${state}`)
      return false
    }

    if (!lock()) {
      return false
    }

    log('Transition: idle -> playing')
    setState('playing')
    onStart?.()
    unlock()
    return true
  }, [state, lock, unlock, onStart, log])

  // State transition: playing -> stopping
  const stop = useCallback((): boolean => {
    if (state !== 'playing') {
      log(`Cannot stop from state: ${state}`)
      return false
    }

    if (!lock()) {
      return false
    }

    log('Transition: playing -> stopping')
    setState('stopping')
    onStop?.()
    unlock()
    return true
  }, [state, lock, unlock, onStop, log])

  // State transition: stopping -> completed
  const complete = useCallback((): boolean => {
    if (state !== 'stopping' && state !== 'playing') {
      log(`Cannot complete from state: ${state}`)
      return false
    }

    if (!lock()) {
      return false
    }

    log(`Transition: ${state} -> completed`)
    setState('completed')
    onComplete?.()
    unlock()
    return true
  }, [state, lock, unlock, onComplete, log])

  // State transition: any -> idle (reset)
  const reset = useCallback(() => {
    log(`Transition: ${state} -> idle (reset)`)
    setState('idle')
    lockRef.current = false
    onReset?.()
  }, [state, onReset, log])

  return {
    // Current state
    state,

    // State queries
    isIdle: state === 'idle',
    isPlaying: state === 'playing',
    isStopping: state === 'stopping',
    isCompleted: state === 'completed',

    // State transitions
    start,
    stop,
    complete,
    reset,

    // Lock mechanism
    lock,
    unlock,
    isLocked: lockRef.current,
  }
}
