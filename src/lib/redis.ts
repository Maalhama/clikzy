import { Redis } from '@upstash/redis'

// Initialize Redis client with lazy loading
let redisClient: Redis | null = null

export function getRedis(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      // En développement, on peut utiliser le rate limiting en mémoire
      // En production, ces variables sont REQUISES
      if (process.env.NODE_ENV === 'production') {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
      }

      // Return null for development (falls back to in-memory rate limiting)
      console.warn('⚠️ Redis not configured - using in-memory rate limiting (dev only)')
      return null
    }

    redisClient = new Redis({
      url,
      token,
    })
  }

  return redisClient
}

// Helper to check if Redis is available
export function isRedisAvailable(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
