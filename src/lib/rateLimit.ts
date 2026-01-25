/**
 * Rate limiter with Redis (production) and in-memory (development) support
 * Automatically uses Redis if UPSTASH credentials are available
 */

import { getRedis, isRedisAvailable } from './redis'

interface RateLimitEntry {
  count: number
  timestamp: number
}

// In-memory store - fallback for development
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
 * In-memory rate limiter (fallback for development)
 */
function checkRateLimitMemory(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  cleanup(windowMs)

  const entry = rateLimitStore.get(identifier)

  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitStore.set(identifier, { count: 1, timestamp: now })
    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowMs,
    }
  }

  if (entry.count >= limit) {
    const resetIn = windowMs - (now - entry.timestamp)
    return {
      success: false,
      remaining: 0,
      resetIn,
    }
  }

  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetIn: windowMs - (now - entry.timestamp),
  }
}

/**
 * Redis-based rate limiter (production)
 */
async function checkRateLimitRedis(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedis()

  if (!redis) {
    // Fallback to in-memory if Redis not available
    return checkRateLimitMemory(identifier, limit, windowMs)
  }

  const key = `ratelimit:${identifier}`
  const windowSeconds = Math.ceil(windowMs / 1000)

  try {
    // Increment counter
    const count = await redis.incr(key)

    if (count === 1) {
      // First request in this window - set expiration
      await redis.expire(key, windowSeconds)
    }

    if (count > limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key)
      return {
        success: false,
        remaining: 0,
        resetIn: ttl * 1000,
      }
    }

    // Get TTL for resetIn
    const ttl = await redis.ttl(key)

    return {
      success: true,
      remaining: limit - count,
      resetIn: ttl > 0 ? ttl * 1000 : windowMs,
    }
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error)
    // Fallback to in-memory on Redis error
    return checkRateLimitMemory(identifier, limit, windowMs)
  }
}

/**
 * Check if a request should be rate limited
 * Automatically uses Redis if available, otherwise in-memory
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (isRedisAvailable()) {
    return checkRateLimitRedis(identifier, limit, windowMs)
  }
  return checkRateLimitMemory(identifier, limit, windowMs)
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // API routes - 60 requests per minute
  api: (identifier: string) => checkRateLimit(identifier, 60, 60 * 1000),

  // Stripe/Payment routes - 10 requests per minute
  payment: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),

  // Auth routes - 10 requests per minute
  auth: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),

  // Cron routes - 10 requests per minute
  cron: (identifier: string) => checkRateLimit(identifier, 10, 60 * 1000),
}
