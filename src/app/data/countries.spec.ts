import flagIcons from 'flag-icons/country.json';
import { COUNTRY_LIST } from './countries';
import { countryName } from './country-name';

const available = new Set(flagIcons.filter((flag) => flag.iso).map((flag) => flag.code));

describe('COUNTRY_LIST', () => {
  it('compte les 193 États membres de l’ONU et les 2 États observateurs', () => {
    expect(COUNTRY_LIST).toHaveLength(195);
  });

  it('n’a aucun code en double', () => {
    const codes = COUNTRY_LIST.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('écrit les codes en minuscules, sur deux lettres', () => {
    for (const { code } of COUNTRY_LIST) {
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });

  it('a un drapeau SVG pour chaque pays', () => {
    const missing = COUNTRY_LIST.filter(({ code }) => !available.has(code)).map((c) => c.code);
    expect(missing).toEqual([]);
  });

  it('a une anecdote rédigée pour chaque pays', () => {
    for (const { code, funFact } of COUNTRY_LIST) {
      expect(funFact.trim().length, `anecdote de ${code}`).toBeGreaterThan(20);
    }
  });

  it('a un nom français distinct pour chaque pays', () => {
    const names = COUNTRY_LIST.map(({ code }) => countryName(code));
    for (const [i, name] of names.entries()) {
      expect(name, COUNTRY_LIST[i].code).not.toBe(COUNTRY_LIST[i].code.toUpperCase());
    }
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('countryName', () => {
  it('donne le nom français du pays', () => {
    expect(countryName('fr')).toBe('France');
    expect(countryName('de')).toBe('Allemagne');
    expect(countryName('jp')).toBe('Japon');
  });

  it('raccourcit les noms trop lourds', () => {
    expect(countryName('va')).toBe('Vatican');
    expect(countryName('ps')).toBe('Palestine');
  });

  it('accepte les majuscules', () => {
    expect(countryName('BR')).toBe('Brésil');
  });
});
