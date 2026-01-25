/**
 * Umami Analytics - Custom Event Tracking
 *
 * Usage:
 * import { trackEvent } from '@/lib/analytics'
 * trackEvent('game_click', { gameId: '123', itemName: 'iPhone' })
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void
    }
  }
}

/**
 * Track a custom event in Umami
 * @param eventName - Name of the event (e.g., 'game_click', 'signup', 'purchase')
 * @param eventData - Optional data to attach to the event
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean>
): void {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, eventData)
  }
}

// Pre-defined event helpers for type safety

/**
 * Track when a user clicks on a game
 */
export function trackGameClick(gameId: string, itemName: string): void {
  trackEvent('game_click', { gameId, itemName })
}

/**
 * Track when a user wins a game
 */
export function trackGameWin(gameId: string, itemName: string, itemValue: number): void {
  trackEvent('game_win', { gameId, itemName, itemValue })
}

/**
 * Track when a user signs up
 */
export function trackSignup(method: 'email' | 'google' | 'github'): void {
  trackEvent('signup', { method })
}

/**
 * Track when a user logs in
 */
export function trackLogin(method: 'email' | 'google' | 'github'): void {
  trackEvent('login', { method })
}

/**
 * Track mini-game plays
 */
export function trackMiniGame(gameType: 'wheel' | 'scratch' | 'pachinko' | 'slots' | 'coinflip' | 'dice', creditsWon: number): void {
  trackEvent('mini_game', { gameType, creditsWon })
}

/**
 * Track credit purchases
 */
export function trackPurchase(amount: number, credits: number): void {
  trackEvent('purchase', { amount, credits })
}

/**
 * Track page views with custom data
 */
export function trackPageView(page: string, data?: Record<string, string | number>): void {
  trackEvent('page_view', { page, ...data })
}
