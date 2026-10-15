import { placeName, usStateName } from './us-state-name';

describe('usStateName', () => {
  it('donne le nom français de l’état', () => {
    expect(usStateName('tx')).toBe('Texas');
    expect(usStateName('ga')).toBe('Géorgie');
    expect(usStateName('wv')).toBe('Virginie-Occidentale');
  });

  it('accepte les majuscules', () => {
    expect(usStateName('CA')).toBe('Californie');
  });

  it('connaît 50 états aux noms distincts', () => {
    const codes =
      'al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy'.split(
        ' ',
      );
    expect(codes).toHaveLength(50);
    const names = codes.map(usStateName);
    expect(new Set(names).size).toBe(50);
    names.forEach((name, i) => expect(name, codes[i]).not.toBe(codes[i].toUpperCase()));
  });
});

describe('placeName', () => {
  it('nomme un pays en mode monde et un état en mode États-Unis', () => {
    expect(placeName('world', 'ge')).toBe('Géorgie');
    expect(placeName('world', 'us')).toBe('États-Unis');
    expect(placeName('us', 'ga')).toBe('Géorgie');
  });
});
