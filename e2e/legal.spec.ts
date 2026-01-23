import { test, expect } from '@playwright/test'

test.describe('Legal Pages', () => {
  test('should display mentions légales', async ({ page }) => {
    await page.goto('/legal')

    await expect(page).toHaveTitle(/Mentions Légales/i)
    await expect(page.locator('h1')).toContainText(/Mentions Légales/i)
  })

  test('should display privacy policy', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page).toHaveTitle(/Confidentialité/i)
    await expect(page.locator('h1')).toContainText(/Confidentialité/i)
  })

  test('should display CGV', async ({ page }) => {
    await page.goto('/cgv')

    await expect(page).toHaveTitle(/CGV|Conditions/i)
  })

  test('should display terms of service', async ({ page }) => {
    await page.goto('/terms')

    await expect(page).toHaveTitle(/Conditions|Terms/i)
  })

  test('legal page should have required sections', async ({ page }) => {
    await page.goto('/legal')

    // Check for important legal sections
    await expect(page.locator('text=/Éditeur|éditeur/i')).toBeVisible()
    await expect(page.locator('text=/Hébergement|hébergement/i')).toBeVisible()
  })

  test('privacy page should mention RGPD', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page.locator('text=/RGPD|données personnelles/i')).toBeVisible()
  })
})
