const names = new Intl.DisplayNames(['fr'], { type: 'region' });

/** Noms que la locale `fr` rend de façon trop lourde pour un bouton de quiz. */
const OVERRIDES: Record<string, string> = {
  va: 'Vatican',
  ps: 'Palestine',
};

/** Nom français d'un pays à partir de son code ISO 3166-1 alpha-2. */
export function countryName(code: string): string {
  const key = code.toLowerCase();
  return OVERRIDES[key] ?? names.of(key.toUpperCase()) ?? key.toUpperCase();
}
