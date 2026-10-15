import credits from '../../../public/places/credits.json';
import { COUNTRY_LIST } from './countries';
import { US_STATE_LIST } from './us-states';

const FREE = /^(CC BY(-SA)?\b|CC0\b|Public domain\b|PD[ -]|PDM\b)/i;
const entries = credits as Record<
  string,
  { title: string; author: string; license: string; licenseUrl: string; source: string }
>;

for (const [mode, places] of [
  ['world', COUNTRY_LIST],
  ['us', US_STATE_LIST],
] as const) {
  describe(`crédits des photos (${mode})`, () => {
    it('a un crédit pour chaque fiche', () => {
      const missing = places.filter(({ code }) => !entries[`${mode}/${code}`]).map((p) => p.code);
      expect(missing).toEqual([]);
    });

    it('n’a un crédit que pour une fiche existante', () => {
      const codes = new Set(places.map((p) => p.code));
      const extra = Object.keys(entries)
        .filter((key) => key.startsWith(`${mode}/`))
        .filter((key) => !codes.has(key.slice(mode.length + 1)));
      expect(extra).toEqual([]);
    });

    it('n’accepte que des licences libres, avec auteur et source', () => {
      for (const { code } of places) {
        const credit = entries[`${mode}/${code}`];
        if (!credit) continue;
        expect(credit.license, code).toMatch(FREE);
        expect(credit.license, code).not.toMatch(/\b(NC|ND)\b/);
        expect(credit.author.trim(), code).not.toBe('');
        expect(credit.source, code).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      }
    });
  });
}
