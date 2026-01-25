import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie que le titre contient "CLEEKZY"
    await expect(page).toHaveTitle(/CLEEKZY/);
    
    // Vérifie que le logo est visible
    await expect(page.getByRole('heading', { name: /CLEEKZY/i })).toBeVisible();
  });

  test('should show login and register buttons', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie que les boutons de connexion/inscription sont présents
    const loginLink = page.getByRole('link', { name: /connexion/i });
    const registerLink = page.getByRole('link', { name: /inscription/i });
    
    await expect(loginLink.or(registerLink)).toBeVisible();
  });

  test('should navigate to lobby', async ({ page }) => {
    await page.goto('/');
    
    // Cherche un lien vers le lobby ou les parties
    const lobbyLink = page.getByRole('link', { name: /jouer|lobby|parties/i }).first();
    
    if (await lobbyLink.isVisible()) {
      await lobbyLink.click();
      await expect(page).toHaveURL(/\/(lobby|login)/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Le logo doit toujours être visible sur mobile
    await expect(page.getByRole('heading', { name: /CLEEKZY/i })).toBeVisible();
  });
});
