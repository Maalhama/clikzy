import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/CLIKZY/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/CLIKZY/)
    await expect(page.getByRole('heading', { name: /inscription|créer/i })).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should show error or validation message
    await expect(page.locator('text=/invalide|erreur/i')).toBeVisible({ timeout: 5000 })
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
