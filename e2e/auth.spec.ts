import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/CLEEKZY/)
    await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/CLEEKZY/)
    await expect(page.getByRole('heading', { name: /s'inscrire|créer/i })).toBeVisible()
  })

  test('should have email and password inputs on login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
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
    await expect(forgotLink).toBeVisible()
  })
})
