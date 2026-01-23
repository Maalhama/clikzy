import { test, expect } from '@playwright/test'

test.describe('Health Check', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health')

    // Should return 200 or 503
    expect([200, 503]).toContain(response.status())

    const body = await response.json()

    // Should have required fields
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('services')

    // Status should be 'ok' or 'error'
    expect(['ok', 'error']).toContain(body.status)

    // Services should have api and database
    expect(body.services).toHaveProperty('api')
    expect(body.services).toHaveProperty('database')
  })

  test('should have valid timestamp', async ({ request }) => {
    const response = await request.get('/api/health')
    const body = await response.json()

    // Timestamp should be a valid ISO date
    const timestamp = new Date(body.timestamp)
    expect(timestamp.getTime()).not.toBeNaN()

    // Should be recent (within last minute)
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    expect(diff).toBeLessThan(60000) // Less than 1 minute
  })
})
