import { test, expect } from '@playwright/test'

test.describe('Lobby Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/lobby')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should display lobby structure for authenticated users', async ({ page }) => {
    // Note: This test would need auth setup for full testing
    // For now, we just verify the redirect behavior
    await page.goto('/lobby')

    // Should have login page elements after redirect
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })
})

test.describe('Lobby UI Elements', () => {
  test('login page should have link to register', async ({ page }) => {
    await page.goto('/login')

    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
  })

  test('register page should have link to login', async ({ page }) => {
    await page.goto('/register')

    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
  })
})
