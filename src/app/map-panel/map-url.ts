/**
 * URL d’intégration Google Maps pour une capitale, sans clé d’API. La capitale et le pays (ou l’état)
 * viennent de nos données, jamais d’une saisie.
 */
export function mapUrl(capital: string, region: string): string {
  const params = new URLSearchParams({ q: `${capital}, ${region}`, output: 'embed', hl: 'fr' });
  return `https://www.google.com/maps?${params.toString()}`;
}
