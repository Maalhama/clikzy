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

  // State transition: idle -> playing
  const start = useCallback((): boolean => {
    let success = false

    setState(currentState => {
      if (currentState !== 'idle') {
        log(`Cannot start from state: ${currentState}`)
        return currentState
      }

      if (lockRef.current) {
        log('Already locked, transition rejected')
        return currentState
      }

      lockRef.current = true
      log('Transition: idle -> playing')
      success = true

      // Call callbacks after state change
      setTimeout(() => {
        onStart?.()
        lockRef.current = false
      }, 0)

      return 'playing'
    })

    return success
  }, [onStart, log])

  // State transition: playing -> stopping
  const stop = useCallback((): boolean => {
    let success = false

    setState(currentState => {
      if (currentState !== 'playing') {
        log(`Cannot stop from state: ${currentState}`)
        return currentState
      }

      if (lockRef.current) {
        log('Already locked, transition rejected')
        return currentState
      }

      lockRef.current = true
      log('Transition: playing -> stopping')
      success = true

      // Call callbacks after state change
      setTimeout(() => {
        onStop?.()
        lockRef.current = false
      }, 0)

      return 'stopping'
    })

    return success
  }, [onStop, log])

  // State transition: stopping -> completed
  const complete = useCallback((): boolean => {
    let success = false

    setState(currentState => {
      if (currentState !== 'stopping' && currentState !== 'playing') {
        log(`Cannot complete from state: ${currentState}`)
        return currentState
      }

      if (lockRef.current) {
        log('Already locked, transition rejected')
        return currentState
      }

      lockRef.current = true
      log(`Transition: ${currentState} -> completed`)
      success = true

      // Call callbacks after state change
      setTimeout(() => {
        onComplete?.()
        lockRef.current = false
      }, 0)

      return 'completed'
    })

    return success
  }, [onComplete, log])

  // State transition: any -> idle (reset)
  const reset = useCallback(() => {
    setState(currentState => {
      log(`Transition: ${currentState} -> idle (reset)`)
      lockRef.current = false

      // Call callback after state change
      setTimeout(() => {
        onReset?.()
      }, 0)

      return 'idle'
    })
  }, [onReset, log])

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
  }
}
