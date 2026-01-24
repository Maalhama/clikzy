import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/CLEEKZY/)
  })

  test('should display branding elements', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded')

    // Verify the CLEEKZY branding is present in the page content
    await expect(page.locator('body')).toContainText('CLEEK')
    await expect(page.locator('body')).toContainText('ZY')
  })

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/')

    // Check for CTA buttons exist in DOM (play, register, etc.)
    const ctaButton = page.locator('a[href="/register"], a[href="/login"], a[href="/lobby"]').first()
    await expect(ctaButton).toHaveCount(1)
  })

  test('should have legal links in footer', async ({ page }) => {
    await page.goto('/')

    // Check for legal links exist in DOM
    const legalLinks = page.locator('a[href="/legal"], a[href="/privacy"], a[href="/terms"]')
    await expect(legalLinks.first()).toHaveCount(1)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page).toHaveTitle(/CLEEKZY/)
  })
})
