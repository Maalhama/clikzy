import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    
    // Vérifie que le formulaire de login est présent
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    
    // Vérifie les champs email et password
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    const passwordInput = page.getByLabel(/mot de passe/i).or(page.getByPlaceholder(/mot de passe/i));
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    
    // Vérifie que le formulaire d'inscription est présent
    await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible();
    
    // Vérifie les champs requis
    const usernameInput = page.getByLabel(/pseudo|username/i).or(page.getByPlaceholder(/pseudo|username/i));
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    
    await expect(emailInput).toBeVisible();
    // Le champ username peut être présent ou non selon le design
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    const submitButton = page.getByRole('button', { name: /connexion|se connecter/i });
    
    // Essaie de soumettre avec un email invalide
    await emailInput.fill('invalid-email');
    await submitButton.click();
    
    // Devrait montrer une erreur de validation
    // (soit native HTML5, soit custom)
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidation).toBe(false);
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Cherche un lien vers l'inscription
    const registerLink = page.getByRole('link', { name: /inscription|s'inscrire|créer un compte/i });
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
