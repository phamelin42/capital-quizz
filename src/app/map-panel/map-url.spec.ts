import { mapUrl } from './map-url';

describe('mapUrl', () => {
  it('cherche la capitale dans son pays, en version intégrée et en français', () => {
    const url = new URL(mapUrl('Budapest', 'Hongrie'));
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps');
    expect(url.searchParams.get('q')).toBe('Budapest, Hongrie');
    expect(url.searchParams.get('output')).toBe('embed');
    expect(url.searchParams.get('hl')).toBe('fr');
  });

  it('encode les noms composés, les apostrophes et les points', () => {
    for (const [capital, region] of [
      ['Saint-Domingue', 'République dominicaine'],
      ['N’Djamena', 'Tchad'],
      ['Washington D.C.', 'États-Unis'],
      ['Port-d’Espagne', 'Trinité-et-Tobago'],
    ]) {
      const url = new URL(mapUrl(capital, region));
      expect(url.searchParams.get('q')).toBe(`${capital}, ${region}`);
      expect(url.hostname).toBe('www.google.com');
    }
  });

  it('ne laisse pas un nom injecter un paramètre', () => {
    const url = new URL(mapUrl('X&output=autre', 'Y#z'));
    expect(url.searchParams.get('output')).toBe('embed');
    expect(url.searchParams.get('q')).toBe('X&output=autre, Y#z');
  });
});
