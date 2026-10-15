import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { answer, Mode, openQuiz, switchMode } from './helpers';

const audit = (page: Parameters<typeof AxeBuilder>[0]['page']) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();

for (const theme of ['light', 'dark'] as const) {
  for (const mode of ['world', 'us'] as Mode[]) {
    test.describe(`axe, thème ${theme}, mode ${mode}`, () => {
      test('question en attente de réponse', async ({ page }) => {
        await openQuiz(page, theme);
        if (mode === 'us') await switchMode(page, mode);
        const { violations } = await audit(page);
        expect(violations).toEqual([]);
      });

      for (const correct of [true, false]) {
        test(`après une ${correct ? 'bonne' : 'mauvaise'} réponse`, async ({ page }) => {
          await openQuiz(page, theme);
          if (mode === 'us') await switchMode(page, mode);
          await answer(page, correct);
          await expect(page.locator('iframe.app-map')).toBeVisible();
          const { violations } = await audit(page);
          expect(violations).toEqual([]);
        });
      }
    });
  }
}
