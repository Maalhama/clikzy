/**
 * Simple in-memory rate limiter for MVP
 * For production at scale, consider using @upstash/ratelimit with Redis
 */

interface RateLimitEntry {
  count: number
  timestamp: number
}

// In-memory store - resets on server restart
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  const cutoff = now - windowMs

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.timestamp < cutoff) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  cleanup(windowMs)

  const entry = rateLimitStore.get(identifier)

  if (!entry || now - entry.timestamp > windowMs) {
    // First request or window expired - reset
    rateLimitStore.set(identifier, { count: 1, timestamp: now })
    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowMs,
    }
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    const resetIn = windowMs - (now - entry.timestamp)
    return {
      success: false,
      remaining: 0,
      resetIn,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetIn: windowMs - (now - entry.timestamp),
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // API routes - 60 requests per minute
  api: (identifier: string) => checkRateLimit(identifier, 60, 60 * 1000),

  // Stripe/Payment routes - 10 requests per minute
  payment: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),

  // Auth routes - 10 requests per minute
  auth: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),

  // Cron routes - 10 requests per minute (crons are protected by CRON_SECRET)
  cron: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),
}
