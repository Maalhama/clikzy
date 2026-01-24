import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/CLEEKZY/)
  })

  test('should display branding elements', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check for logo link - the Logo component is a link to "/"
    const logoLink = page.locator('a[href="/"]').first()
    await expect(logoLink).toBeVisible()

    // Verify the CLEEKZY text is present in the page
    await expect(page.locator('body')).toContainText('CLEEK')
  })

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/')

    // Check for CTA buttons (play, register, etc.)
    const ctaButton = page.locator('a[href="/register"], a[href="/login"], a[href="/lobby"]').first()
    await expect(ctaButton).toBeVisible()
  })

  test('should have legal links in footer', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Check for legal links
    await expect(page.locator('a[href="/legal"], a[href="/privacy"], a[href="/terms"]').first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page).toHaveTitle(/CLEEKZY/)
  })
})
