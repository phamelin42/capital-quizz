import { expect, test } from '@playwright/test';
import { COUNTRY_LIST } from '../src/app/data/countries';
import { US_STATE_LIST } from '../src/app/data/us-states';
import { answer, currentCode, currentPlace, nameOf, openQuiz, switchMode } from './helpers';

test('une bonne réponse valide le pays et révèle anecdote, carte et monument', async ({ page }) => {
  await openQuiz(page);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.app-fun-fact')).toHaveCount(0);
  await expect(page.locator('.app-map-panel')).toHaveCount(0);
  await expect(page.locator('.app-photo')).toHaveAttribute('alt', 'Lieu à deviner');
  await expect(page.locator('.app-place-card')).toContainText('Quel pays a pour capitale');

  const code = await answer(page, true);

  await expect(page.locator('.app-status')).toContainText('Bonne réponse');
  await expect(page.locator('.app-option.fd-button--success')).toContainText(nameOf(code));
  await expect(page.locator('fd-alert')).toHaveCount(0);
  await expect(page.locator('.app-stats')).toContainText('Score 1 / 1');
  await expect(page.locator('.app-fun-fact .fd-card__text')).not.toBeEmpty();
  const iframe = page.locator('iframe.app-map');
  await expect(iframe).toBeVisible();
  const src = new URL((await iframe.getAttribute('src'))!);
  expect(src.hostname).toBe('www.google.com');
  const place = COUNTRY_LIST.find((p) => p.code === code)!;
  expect(src.searchParams.get('q')).toBe(`${place.capital}, ${nameOf(code)}`);
  await expect(page.locator('.app-photo')).toHaveAttribute(
    'alt',
    `${place.landmark}, ${place.capital}`,
  );
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

  await expect(page.locator('.app-status')).toContainText('Mauvaise réponse');
  await expect(page.locator('.app-status')).toContainText(nameOf(code));
  await expect(page.locator('.fd-button--danger')).toHaveCount(1);
  await expect(page.locator('.app-option.fd-button--success')).toContainText(nameOf(code));
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 1');
});

test('Capitale suivante pose une nouvelle question sans réponse ni carte', async ({ page }) => {
  await openQuiz(page);
  const first = await answer(page, true);
  await page.getByRole('button', { name: 'Capitale suivante' }).click();

  await expect(page.locator('.app-photo')).not.toHaveAttribute('src', `places/world/${first}.jpg`);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.app-fun-fact')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Capitale suivante' })).toHaveCount(0);
  await expect(page.locator('.app-option')).toHaveCount(4);
  await expect(page.locator('.app-stats')).toContainText('Série 1');
});

test('une question répond une seule fois', async ({ page }) => {
  await openQuiz(page);
  await answer(page, false);
  // Playwright n'attend pas un élément aria-disabled : le clic est forcé, comme celui d'un joueur pressé.
  await page.locator('.app-option[aria-disabled="true"]').first().click({ force: true });
  await expect(page.locator('.app-stats')).toContainText('Score 0 / 1');
});

test('le clavier suffit : répondre, puis passer à la capitale suivante', async ({ page }) => {
  await openQuiz(page);
  const first = await currentCode(page);

  // Les arrêts de tabulation : les deux boutons de mode, le sélecteur de thème, puis les 4 propositions.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await expect(page.locator('.app-option').first()).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('button', { name: 'Capitale suivante' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.app-photo')).not.toHaveAttribute('src', `places/world/${first}.jpg`);
  await expect(page.locator('.app-option').first()).toBeFocused();
});

test('toute la partie tient avec le mouvement réduit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openQuiz(page);
  await answer(page, true);
  await expect(page.locator('.app-status')).toContainText('Bonne réponse');
  await page.getByRole('button', { name: 'Capitale suivante' }).click();
  await expect(page.locator('.app-option')).toHaveCount(4);
});

test('la bascule de thème pose data-theme="dark" sur <html>', async ({ page }) => {
  await openQuiz(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  await page.getByText('Thème nuit').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('les 4 propositions tiennent sur un écran de téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openQuiz(page);
  await answer(page, true);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test.describe('mode États-Unis', () => {
  test('pose la question sur un état et propose des états', async ({ page }) => {
    await openQuiz(page);
    await switchMode(page, 'us');

    const { code, mode } = await currentPlace(page);
    expect(mode).toBe('us');
    const state = US_STATE_LIST.find((p) => p.code === code)!;
    await expect(page.locator('.app-place-card')).toContainText(
      `Quel état a pour capitale ${state.capital} ?`,
    );
    await expect(
      page.getByRole('group', { name: 'Choisis l’état de cette capitale' }),
    ).toBeVisible();
    expect(await page.locator('.app-option').allInnerTexts()).toContain(nameOf(code, 'us'));
    await expect(page.locator('.app-photo')).toHaveAttribute('alt', 'Lieu à deviner');
  });

  test('répondre révèle la capitale sur la carte, puis changer de mode remet le score à zéro', async ({
    page,
  }) => {
    await openQuiz(page);
    await switchMode(page, 'us');
    const code = await answer(page, true);
    const state = US_STATE_LIST.find((p) => p.code === code)!;

    await expect(page.locator('.app-stats')).toContainText('Score 1 / 1');
    const src = new URL((await page.locator('iframe.app-map').getAttribute('src'))!);
    expect(src.searchParams.get('q')).toBe(`${state.capital}, ${nameOf(code, 'us')}`);

    await switchMode(page, 'world');
    await expect(page.locator('.app-stats')).toContainText('Score 0 / 0');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.app-place-card')).toContainText('Quel pays a pour capitale');
  });

  test('le focus va sur la première proposition après un changement de mode', async ({ page }) => {
    await openQuiz(page);
    await switchMode(page, 'us');
    await expect(page.locator('.app-option').first()).toBeFocused();
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
