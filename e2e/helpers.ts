import { expect, Page } from '@playwright/test';
import { placeName } from '../src/app/data/us-state-name';
import { Mode } from '../src/app/data/place';

export type { Mode };

/** Nom français du pays (monde) ou de l'état (États-Unis), tel que le quiz l'affiche. */
export function nameOf(code: string, mode: Mode = 'world'): string {
  return placeName(mode, code);
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

/** Passe au jeu demandé avec le sélecteur de mode. */
export async function switchMode(page: Page, mode: Mode): Promise<void> {
  const label = mode === 'us' ? 'États-Unis' : 'Monde';
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.app-option')).toHaveCount(4);
}

/** Code et mode de la question affichée, lus dans l'URL de la photo (`places/<mode>/<code>.jpg`). */
export async function currentPlace(page: Page): Promise<{ code: string; mode: Mode }> {
  const src = await page.locator('.app-photo').getAttribute('src');
  const match = /places\/(world|us)\/([a-z]{2})\.jpg/.exec(src ?? '')!;
  return { mode: match[1] as Mode, code: match[2] };
}

export async function currentCode(page: Page): Promise<string> {
  return (await currentPlace(page)).code;
}

export async function answer(page: Page, correct: boolean): Promise<string> {
  const { code, mode } = await currentPlace(page);
  const good = nameOf(code, mode);
  const options = page.locator('.app-option');
  const texts = await options.allInnerTexts();
  const index = texts.findIndex((text) => (text.trim() === good) === correct);
  await options.nth(index).click();
  return code;
}
