import { expect, Page } from '@playwright/test';

const names = new Intl.DisplayNames(['fr'], { type: 'region' });
const OVERRIDES: Record<string, string> = { va: 'Vatican', ps: 'Palestine' };

export function nameOf(code: string): string {
  return OVERRIDES[code] ?? names.of(code.toUpperCase())!;
}

/** Google n'est pas contacté pendant les tests : l'iframe reçoit une page vide. */
export async function openQuiz(page: Page, theme: 'light' | 'dark' = 'light'): Promise<void> {
  await page.route('https://www.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>carte</title>' }),
  );
  // Le thème Jour est celui par défaut : on ne force que le thème Nuit (et pas à chaque rechargement du test).
  if (theme === 'dark') {
    await page.addInitScript(() => {
      if (!localStorage.getItem('fuda-theme')) localStorage.setItem('fuda-theme', 'dark');
    });
  }
  await page.goto('/');
  await expect(page.locator('.app-option')).toHaveCount(4);
}

/** Code du pays affiché, lu dans l'URL du drapeau. */
export async function currentCode(page: Page): Promise<string> {
  const src = await page.locator('.app-flag').getAttribute('src');
  return /flags\/4x3\/([a-z]{2})\.svg/.exec(src ?? '')![1];
}

export async function answer(page: Page, correct: boolean): Promise<string> {
  const code = await currentCode(page);
  const good = nameOf(code);
  const options = page.locator('.app-option');
  const texts = await options.allInnerTexts();
  const index = texts.findIndex((text) => (text.trim() === good) === correct);
  await options.nth(index).click();
  return code;
}
