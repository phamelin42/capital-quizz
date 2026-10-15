/** URL d’intégration Google Maps pour un pays, sans clé d’API. Le nom vient de nos données, jamais d’une saisie. */
export function mapUrl(countryName: string): string {
  const params = new URLSearchParams({ q: countryName, output: 'embed', hl: 'fr' });
  return `https://www.google.com/maps?${params.toString()}`;
}
