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

    // Check for important legal sections in page content
    await expect(page.locator('body')).toContainText(/Éditeur|éditeur/i)
    await expect(page.locator('body')).toContainText(/Hébergement|hébergement/i)
  })

  test('privacy page should mention RGPD', async ({ page }) => {
    await page.goto('/privacy')

    // Check for RGPD or personal data mention in page content
    await expect(page.locator('body')).toContainText(/RGPD|données personnelles/i)
  })
})
