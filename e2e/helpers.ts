import { expect, Page } from '@playwright/test';
import { COUNTRY_LIST } from '../src/app/data/countries';
import { Mode, Place } from '../src/app/data/place';
import { US_STATE_LIST } from '../src/app/data/us-states';
import { placeOf } from '../src/app/data/place-of';

export type { Mode };
export { placeOf };

export function placeFor(code: string, mode: Mode = 'world'): Place {
  return (mode === 'us' ? US_STATE_LIST : COUNTRY_LIST).find((place) => place.code === code)!;
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
  await expect(page.getByLabel('Ta réponse')).toBeEnabled();
}

/** Passe au jeu demandé avec le sélecteur de mode. */
export async function switchMode(page: Page, mode: Mode): Promise<void> {
  const label = mode === 'us' ? 'États-Unis' : 'Monde';
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Ta réponse')).toBeEnabled();
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

/** Tape une réponse et la valide avec le bouton. */
export async function submitAnswer(page: Page, text: string): Promise<void> {
  await page.getByLabel('Ta réponse').fill(text);
  await page.getByRole('button', { name: 'Valider' }).click();
}

/** Répond juste (la capitale) ou faux, et renvoie le code de la question. */
export async function answer(page: Page, correct: boolean): Promise<string> {
  const { code, mode } = await currentPlace(page);
  await submitAnswer(page, correct ? placeFor(code, mode).capital : 'Ville inconnue');
  return code;
}
