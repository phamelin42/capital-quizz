import { ANSWER_ALIASES, acceptedAnswers } from './answer-aliases';
import articles from './photo-articles.json';
import { COUNTRY_LIST } from './countries';
import { countryName } from './country-name';
import { Place } from './place';
import { placeOf } from './place-of';
import { usStateName } from './us-state-name';
import { US_STATE_LIST } from './us-states';

const lists: { label: string; places: readonly Place[]; size: number; key: 'world' | 'us' }[] = [
  { label: 'COUNTRY_LIST', places: COUNTRY_LIST, size: 195, key: 'world' },
  { label: 'US_STATE_LIST', places: US_STATE_LIST, size: 50, key: 'us' },
];

for (const { label, places, size, key } of lists) {
  describe(label, () => {
    it(`compte ${size} entrées`, () => {
      expect(places).toHaveLength(size);
    });

    it('n’a aucun code en double, écrit en minuscules sur deux lettres', () => {
      const codes = places.map((place) => place.code);
      expect(new Set(codes).size).toBe(codes.length);
      for (const code of codes) expect(code).toMatch(/^[a-z]{2}$/);
    });

    it('a une capitale, un monument et une anecdote rédigée pour chaque entrée', () => {
      for (const { code, capital, landmark, funFact } of places) {
        expect(capital.trim().length, `capitale de ${code}`).toBeGreaterThan(2);
        expect(landmark.trim().length, `monument de ${code}`).toBeGreaterThan(2);
        expect(funFact.trim().length, `anecdote de ${code}`).toBeGreaterThan(20);
      }
    });

    it('n’écrit aucun nom de capitale avec un article, hors noms propres', () => {
      // L'article fait partie du nom de ces villes.
      const proper = ['La Valette', 'La Havane', 'Le Caire', 'La Paz'];
      for (const { code, capital } of places) {
        if (proper.includes(capital)) continue;
        expect(capital, code).not.toMatch(/^(le|la|les|l’|l') /i);
      }
    });

    it('a un article de photo pour chaque entrée, et rien d’autre', () => {
      const codes = places.map((place) => place.code).sort();
      expect(Object.keys(articles[key]).sort()).toEqual(codes);
      for (const [code, article] of Object.entries(articles[key])) {
        expect(article.trim(), code).not.toBe('');
        if (!/^(search(-en)?|commons|file):/.test(article))
          expect(article, code).not.toContain(' ');
      }
    });
  });
}

describe('noms', () => {
  it('donne un nom français distinct à chaque pays', () => {
    const names = COUNTRY_LIST.map(({ code }) => countryName(code));
    names.forEach((name, i) =>
      expect(name, COUNTRY_LIST[i].code).not.toBe(COUNTRY_LIST[i].code.toUpperCase()),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('donne un nom français distinct à chaque état', () => {
    const names = US_STATE_LIST.map(({ code }) => usStateName(code));
    names.forEach((name, i) =>
      expect(name, US_STATE_LIST[i].code).not.toBe(US_STATE_LIST[i].code.toUpperCase()),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('place Washington D.C. dans le monde et pas dans les états', () => {
    expect(COUNTRY_LIST.find(({ code }) => code === 'us')?.capital).toBe('Washington D.C.');
    expect(US_STATE_LIST.some(({ capital }) => capital.includes('D.C.'))).toBe(false);
  });
});

describe('countryName', () => {
  it('donne le nom français du pays', () => {
    expect(countryName('fr')).toBe('France');
    expect(countryName('hu')).toBe('Hongrie');
  });

  it('raccourcit les noms trop lourds', () => {
    expect(countryName('va')).toBe('Vatican');
    expect(countryName('ps')).toBe('Palestine');
  });

  it('accepte les majuscules', () => {
    expect(countryName('BR')).toBe('Brésil');
  });
});

describe('placeOf', () => {
  it('écrit la question avec l’article', () => {
    expect(placeOf('world', 'hu')).toBe('de la Hongrie');
    expect(placeOf('world', 'jp')).toBe('du Japon');
    expect(placeOf('world', 'nl')).toBe('des Pays-Bas');
    expect(placeOf('world', 'de')).toBe('de l’Allemagne');
    expect(placeOf('world', 'il')).toBe('d’Israël');
    expect(placeOf('us', 'tx')).toBe('du Texas');
    expect(placeOf('us', 'ny')).toBe('de l’État de New York');
  });

  for (const { label, places, key } of lists) {
    it(`a une forme avec « de » pour chaque entrée (${label})`, () => {
      for (const { code } of places) {
        expect(placeOf(key, code), code).toMatch(/^(de la |de l’|du |des |de |d’)\S/);
      }
    });

    it(`ne répète aucune forme (${label})`, () => {
      const forms = places.map(({ code }) => placeOf(key, code));
      expect(new Set(forms).size).toBe(forms.length);
    });
  }

  it('distingue la Géorgie du Caucase de l’état américain, et Washington D.C. de l’état', () => {
    expect(placeOf('world', 'ge')).toBe('de la Géorgie');
    expect(placeOf('us', 'ga')).toBe('de la Géorgie (États-Unis)');
    expect(placeOf('us', 'wa')).toBe('de l’État de Washington');
  });
});

describe('réponses acceptées', () => {
  it('ne sont définies que pour des fiches qui existent', () => {
    const known = new Set([
      ...COUNTRY_LIST.map(({ code }) => `world/${code}`),
      ...US_STATE_LIST.map(({ code }) => `us/${code}`),
    ]);
    expect(Object.keys(ANSWER_ALIASES).filter((key) => !known.has(key))).toEqual([]);
  });

  it('donnent la capitale en premier, puis les variantes', () => {
    const bolivia = COUNTRY_LIST.find(({ code }) => code === 'bo')!;
    expect(acceptedAnswers('world', bolivia)).toEqual(['La Paz', 'Sucre']);
    const unknown = US_STATE_LIST.find(({ code }) => code === 'tx')!;
    expect(acceptedAnswers('us', unknown)).toEqual(['Austin']);
  });

  it('acceptent toutes les villes qui se disputent le titre de capitale', () => {
    const accepted = (code: string) =>
      acceptedAnswers(
        'world',
        COUNTRY_LIST.find((p) => p.code === code)!,
      );
    expect(accepted('za')).toEqual(expect.arrayContaining(['Pretoria', 'Le Cap', 'Bloemfontein']));
    expect(accepted('ci')).toEqual(expect.arrayContaining(['Yamoussoukro', 'Abidjan']));
    expect(accepted('tz')).toEqual(expect.arrayContaining(['Dodoma', 'Dar es Salaam']));
    expect(accepted('bj')).toEqual(expect.arrayContaining(['Porto-Novo', 'Cotonou']));
    expect(accepted('ps')).toEqual(expect.arrayContaining(['Ramallah', 'Jérusalem']));
  });
});
