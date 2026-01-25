import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'

// Mock Redis to force in-memory fallback for tests
vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
  isRedisAvailable: vi.fn(() => false),
}))

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset time mocking between tests
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow first request', async () => {
      const result = await checkRateLimit('test-ip-1', 5, 60000)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should decrement remaining count', async () => {
      const identifier = 'test-ip-2'

      await checkRateLimit(identifier, 5, 60000)
      const result = await checkRateLimit(identifier, 5, 60000)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(3)
    })

    it('should block when limit exceeded', async () => {
      const identifier = 'test-ip-3'

      // Make 5 requests (limit)
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(identifier, 5, 60000)
      }

      // 6th request should be blocked
      const result = await checkRateLimit(identifier, 5, 60000)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      vi.useFakeTimers()
      const identifier = 'test-ip-4'

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(identifier, 5, 60000)
      }

      // Advance time past window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      const result = await checkRateLimit(identifier, 5, 60000)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })
  })

  describe('rateLimiters presets', () => {
    it('api limiter allows 60 requests per minute', async () => {
      const identifier = 'api-test-ip'

      // Make 60 requests
      for (let i = 0; i < 60; i++) {
        const result = await rateLimiters.api(identifier)
        expect(result.success).toBe(true)
      }

      // 61st should fail
      const result = await rateLimiters.api(identifier)
      expect(result.success).toBe(false)
    })

    it('payment limiter allows 10 requests per minute', async () => {
      const identifier = 'payment-test-ip'

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiters.payment(identifier)
        expect(result.success).toBe(true)
      }

      // 11th should fail
      const result = await rateLimiters.payment(identifier)
      expect(result.success).toBe(false)
    })

    it('cron limiter allows 10 requests per minute', async () => {
      const identifier = 'cron-test-ip'

      // Make 10 requests - all should succeed
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiters.cron(identifier)
        expect(result.success).toBe(true)
      }

      // 11th should fail
      const result = await rateLimiters.cron(identifier)
      expect(result.success).toBe(false)
    })
  })
})
