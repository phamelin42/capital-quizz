import { expect, test } from '@playwright/test';
import {
  answer,
  currentCode,
  currentPlace,
  openQuiz,
  placeFor,
  placeOf,
  submitAnswer,
  switchMode,
} from './helpers';

test('une bonne réponse valide la capitale et révèle anecdote, carte et monument', async ({
  page,
}) => {
  await openQuiz(page);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.app-fun-fact')).toHaveCount(0);
  await expect(page.locator('.app-map-panel')).toHaveCount(0);
  await expect(page.locator('.app-photo')).toHaveAttribute('alt', 'Photo de la capitale');
  const { code } = await currentPlace(page);
  const place = placeFor(code);
  await expect(page.locator('.app-place-card')).toContainText(
    `Quelle est la capitale ${placeOf('world', code)} ?`,
  );
  await expect(page.locator('body')).not.toContainText(place.landmark);

  await answer(page, true);

  await expect(page.locator('.app-status')).toContainText(`Bonne réponse : ${place.capital}.`);
  await expect(page.locator('fd-alert')).toHaveCount(0);
  await expect(page.locator('.app-stats')).toContainText('Score 1 / 1');
  await expect(page.locator('.app-fun-fact .fd-card__text')).not.toBeEmpty();
  const iframe = page.locator('iframe.app-map');
  await expect(iframe).toBeVisible();
  const src = new URL((await iframe.getAttribute('src'))!);
  expect(src.hostname).toBe('www.google.com');
  expect(src.searchParams.get('q')).toContain(`${place.capital}, `);
  await expect(page.locator('.app-photo')).toHaveAttribute(
    'alt',
    `${place.landmark}, ${place.capital}`,
  );
});

test('la réponse n’a pas à être exacte : casse, accents et une faute de frappe', async ({
  page,
}) => {
  await openQuiz(page);
  const { code, mode } = await currentPlace(page);
  const capital = placeFor(code, mode).capital;
  // Une lettre oubliée, en minuscules : accepté pour les noms de 7 lettres ou plus.
  const typed = (capital.length >= 7 ? capital.slice(0, -1) : capital).toLowerCase();
  await submitAnswer(page, typed);
  await expect(page.locator('.app-status')).toContainText('Bonne réponse');
  await expect(page.locator('.app-stats')).toContainText('Score 1 / 1');
});

test('l’onglet a une icône', async ({ page }) => {
  await openQuiz(page);
  for (const selector of [
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="icon"][sizes="48x48"]',
    'link[rel="apple-touch-icon"]',
  ]) {
    const href = await page.locator(selector).getAttribute('href');
    expect(href, selector).toBeTruthy();
    const response = await page.request.get(new URL(href!, page.url()).toString());
    expect(response.status(), href!).toBe(200);
    expect((await response.body()).length, href!).toBeGreaterThan(100);
  }
});

test('une mauvaise réponse montre la bonne et remet la série à zéro', async ({ page }) => {
  await openQuiz(page);
  const code = await answer(page, false);

  await expect(page.locator('.app-status')).toContainText('Mauvaise réponse.');
  await expect(page.locator('.app-status')).toContainText(
    `La bonne réponse était : ${placeFor(code).capital}.`,
  );
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 1');
  await expect(page.locator('.app-stats')).toContainText('Série 0');
  await expect(page.getByLabel('Ta réponse')).toBeDisabled();
});

test('« Je ne sais pas » révèle la réponse et compte une erreur', async ({ page }) => {
  await openQuiz(page);
  const code = await currentCode(page);
  await page.getByRole('button', { name: 'Je ne sais pas' }).click();

  await expect(page.locator('.app-status')).toContainText('Tu as passé.');
  await expect(page.locator('.app-status')).toContainText(placeFor(code).capital);
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 1');
  await expect(page.locator('.app-fun-fact')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Je ne sais pas' })).toHaveCount(0);
});

test('Capitale suivante pose une nouvelle question, champ vide, sans réponse ni carte', async ({
  page,
}) => {
  await openQuiz(page);
  const first = await currentCode(page);
  await answer(page, true);
  await page.getByRole('button', { name: 'Capitale suivante' }).click();

  await expect(page.locator('.app-photo')).not.toHaveAttribute('src', `places/world/${first}.jpg`);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.app-fun-fact')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Capitale suivante' })).toHaveCount(0);
  await expect(page.getByLabel('Ta réponse')).toHaveValue('');
  await expect(page.getByLabel('Ta réponse')).toBeEnabled();
  await expect(page.locator('.app-stats')).toContainText('Série 1');
});

test('une question répond une seule fois', async ({ page }) => {
  await openQuiz(page);
  await answer(page, false);
  await expect(page.getByLabel('Ta réponse')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Valider' })).toHaveCount(0);
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 1');
});

test('un envoi vide ne fait rien', async ({ page }) => {
  await openQuiz(page);
  await page.getByRole('button', { name: 'Valider' }).click({ force: true });
  await page.getByLabel('Ta réponse').fill('   ');
  await page.getByLabel('Ta réponse').press('Enter');
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 0');
  await expect(page.locator('.app-status')).toHaveText('');
});

test('le clavier suffit : taper, valider avec Entrée, passer à la suivante', async ({ page }) => {
  await openQuiz(page);
  const first = await currentCode(page);

  // Les arrêts de tabulation : les deux boutons de mode, le sélecteur de thème, puis le champ de réponse.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await expect(page.getByLabel('Ta réponse')).toBeFocused();
  await page.keyboard.type(placeFor(first).capital);
  await page.keyboard.press('Enter');

  await expect(page.locator('.app-status')).toContainText('Bonne réponse');
  await expect(page.getByRole('button', { name: 'Capitale suivante' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.app-photo')).not.toHaveAttribute('src', `places/world/${first}.jpg`);
  await expect(page.getByLabel('Ta réponse')).toBeFocused();
});

test('toute la partie tient avec le mouvement réduit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openQuiz(page);
  await answer(page, true);
  await expect(page.locator('.app-status')).toContainText('Bonne réponse');
  await page.getByRole('button', { name: 'Capitale suivante' }).click();
  await expect(page.getByLabel('Ta réponse')).toBeEnabled();
});

test('la bascule de thème pose data-theme="dark" sur <html>', async ({ page }) => {
  await openQuiz(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  await page.getByText('Thème nuit').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('la page tient sur un écran de téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openQuiz(page);
  await answer(page, true);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test.describe('mode États-Unis', () => {
  test('pose la question sur un état', async ({ page }) => {
    await openQuiz(page);
    await switchMode(page, 'us');

    const { code, mode } = await currentPlace(page);
    expect(mode).toBe('us');
    await expect(page.locator('.app-place-card')).toContainText(
      `Quelle est la capitale ${placeOf('us', code)} ?`,
    );
    await expect(page.locator('.app-photo')).toHaveAttribute('alt', 'Photo de la capitale');
  });

  test('répondre révèle la capitale sur la carte, puis changer de mode remet le score à zéro', async ({
    page,
  }) => {
    await openQuiz(page);
    await switchMode(page, 'us');
    const code = await answer(page, true);
    const state = placeFor(code, 'us');

    await expect(page.locator('.app-stats')).toContainText('Score 1 / 1');
    const src = new URL((await page.locator('iframe.app-map').getAttribute('src'))!);
    expect(src.searchParams.get('q')).toContain(`${state.capital}, `);

    await switchMode(page, 'world');
    await expect(page.locator('.app-stats')).toContainText('Score 0 / 0');
    await expect(page.locator('iframe')).toHaveCount(0);
    const { code: worldCode } = await currentPlace(page);
    await expect(page.locator('.app-place-card')).toContainText(
      `Quelle est la capitale ${placeOf('world', worldCode)} ?`,
    );
  });

  test('le focus va dans le champ de réponse après un changement de mode', async ({ page }) => {
    await openQuiz(page);
    await switchMode(page, 'us');
    await expect(page.getByLabel('Ta réponse')).toBeFocused();
  });
});

test('le pied de page renvoie vers le portfolio, le Flag Quizz et les crédits', async ({
  page,
}) => {
  await openQuiz(page);
  const footer = page.locator('.app-site-footer');
  await expect(footer).toContainText('Vous voulez en voir plus ? Visitez mon portfolio');
  await expect(footer.getByRole('link', { name: 'portfolio' })).toHaveAttribute(
    'href',
    'https://phamelin.fr/#projects',
  );
  await expect(footer.getByRole('link', { name: 'Jouer au Flag Quizz' })).toHaveAttribute(
    'href',
    'https://flag-quizz.phamelin.fr',
  );
  const credits = footer.getByRole('link', { name: 'Crédits photo' });
  const response = await page.request.get(
    new URL((await credits.getAttribute('href'))!, page.url()).toString(),
  );
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('Crédits photo');
});
