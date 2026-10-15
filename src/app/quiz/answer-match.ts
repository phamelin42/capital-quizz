/** Mots d'un nom sans accents, en minuscules, « st » et « ste » développés : « St John’s » → « saint johns ». */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’'ʻ`]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => (word === 'st' ? 'saint' : word === 'ste' ? 'sainte' : word));
}

const ARTICLES = new Set(['le', 'la', 'les', 'l']);

/** Les formes comparables d'un nom : avec et sans article initial (« La Havane », « Havane »), espaces et tirets retirés. */
function keys(text: string): string[] {
  const all = words(text);
  const withoutArticle = all.length > 1 && ARTICLES.has(all[0]) ? all.slice(1) : all;
  return [...new Set([all.join(''), withoutArticle.join('')])].filter(Boolean);
}

/** Distance de Damerau-Levenshtein : insertion, suppression, remplacement ou échange de deux lettres voisines. */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

/** Longueur à partir de laquelle on pardonne une faute de frappe : « Lima » doit être exact, « Ouagadougou » pas. */
const TYPO_FROM = 7;

/**
 * Vrai si la saisie correspond à l'une des réponses acceptées : sans tenir compte de la casse, des accents,
 * des tirets, des espaces, des apostrophes ni de l'article initial, et avec une faute de frappe pardonnée
 * pour les noms de 7 lettres ou plus.
 */
export function matchesAnswer(input: string, accepted: readonly string[]): boolean {
  const typed = keys(input);
  if (typed.length === 0) return false;
  return accepted.some((answer) =>
    keys(answer).some((key) =>
      typed.some((candidate) => {
        if (candidate === key) return true;
        return key.length >= TYPO_FROM && distance(candidate, key) <= 1;
      }),
    ),
  );
}
