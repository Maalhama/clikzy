import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/CLEEKZY/)
    await expect(page.locator('body')).toContainText(/se connecter/i)
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/CLEEKZY/)
    await expect(page.locator('body')).toContainText(/s'inscrire|créer/i)
  })

  test('should have email and password inputs on login', async ({ page }) => {
    await page.goto('/login')

    // Check inputs exist in DOM
    await expect(page.locator('input[type="email"]')).toHaveCount(1)
    await expect(page.locator('input[type="password"]')).toHaveCount(1)
    await expect(page.locator('button[type="submit"]')).toHaveCount(1)
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Find link to register
    const registerLink = page.locator('a[href="/register"]')
    await registerLink.click()

    await expect(page).toHaveURL(/register/)
  })

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login')

    const forgotLink = page.locator('a[href*="forgot"]')
    await expect(forgotLink).toHaveCount(1)
  })
})
