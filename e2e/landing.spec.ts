import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/CLIKZY/)
  })

  test('should display CLIKZY branding', async ({ page }) => {
    await page.goto('/')

    // Check for logo/brand name
    await expect(page.locator('text=CLIKZY').first()).toBeVisible()
  })

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/')

    // Check for CTA buttons (play, register, etc.)
    const ctaButton = page.locator('a[href="/register"], a[href="/login"], button').first()
    await expect(ctaButton).toBeVisible()
  })

  test('should have legal links in footer', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for legal links
    await expect(page.locator('a[href="/legal"], a[href="/privacy"]').first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page).toHaveTitle(/CLIKZY/)
    // Page should still be functional
    await expect(page.locator('text=CLIKZY').first()).toBeVisible()
  })
})
