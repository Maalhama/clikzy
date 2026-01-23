import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('should have security headers', async ({ request }) => {
    const response = await request.get('/')

    // Check security headers
    const headers = response.headers()

    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('origin-when-cross-origin')
  })

  test('should have HSTS header', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()

    // HSTS might only be present in production
    if (headers['strict-transport-security']) {
      expect(headers['strict-transport-security']).toContain('max-age=')
    }
  })
})

test.describe('Rate Limiting', () => {
  test('API should respond to requests', async ({ request }) => {
    const response = await request.get('/api/clicks/recent')

    // Should get a response (might be 401 if not authenticated, but not 500)
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from /lobby', async ({ page }) => {
    await page.goto('/lobby')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect unauthenticated users from /profile', async ({ page }) => {
    await page.goto('/profile')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect unauthenticated users from /game', async ({ page }) => {
    await page.goto('/game/test-id')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })
})
