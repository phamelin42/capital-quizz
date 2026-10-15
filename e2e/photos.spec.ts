import { statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { COUNTRY_LIST } from '../src/app/data/countries';
import { US_STATE_LIST } from '../src/app/data/us-states';

/** Chaque fiche a sa photo, lisible dans le dossier public (un JPEG 800 × 600 d'au moins 5 Ko). */
for (const [mode, places] of [
  ['world', COUNTRY_LIST],
  ['us', US_STATE_LIST],
] as const) {
  test(`une photo existe pour chaque fiche (${mode})`, () => {
    const missing: string[] = [];
    for (const { code } of places) {
      try {
        if (statSync(join('public/places', mode, `${code}.jpg`)).size < 5_000) missing.push(code);
      } catch {
        missing.push(code);
      }
    }
    expect(missing).toEqual([]);
  });
}
