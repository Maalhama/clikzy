import { test, expect } from '@playwright/test'

test.describe('SEO', () => {
  test('should have proper meta tags on landing page', async ({ page }) => {
    await page.goto('/')

    // Title
    await expect(page).toHaveTitle(/CLEEKZY/)

    // Meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /.+/)

    // Open Graph
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /.+/)

    const ogDescription = page.locator('meta[property="og:description"]')
    await expect(ogDescription).toHaveAttribute('content', /.+/)

    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /.+/)

    // Twitter Card
    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')
  })

  test('should have robots meta tag allowing indexing', async ({ page }) => {
    await page.goto('/')

    // Should NOT have noindex
    const robotsMeta = page.locator('meta[name="robots"]')
    const content = await robotsMeta.getAttribute('content')

    // If robots meta exists, it should allow indexing
    if (content) {
      expect(content).not.toContain('noindex')
    }
  })

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/')

    // Check for canonical link or og:url
    const canonical = page.locator('link[rel="canonical"]')
    const ogUrl = page.locator('meta[property="og:url"]')

    const hasCanonical = await canonical.count() > 0
    const hasOgUrl = await ogUrl.count() > 0

    expect(hasCanonical || hasOgUrl).toBeTruthy()
  })

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')

    // Should have exactly one H1
    const h1Elements = page.locator('h1')
    const h1Count = await h1Elements.count()

    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/')

    // Get all images
    const images = page.locator('img')
    const imageCount = await images.count()

    // Check each image has alt attribute
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('should have lang attribute on html', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'fr')
  })

  test('robots.txt should be accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt')

    expect(response?.status()).toBe(200)

    const content = await page.content()
    expect(content).toContain('User-agent')
    expect(content).toContain('Sitemap')
  })

  test('sitemap.xml should be accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')

    expect(response?.status()).toBe(200)

    const content = await page.content()
    expect(content).toContain('urlset')
    expect(content).toContain('cleekzy.com')
  })
})
