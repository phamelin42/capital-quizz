import { matchesAnswer } from './answer-match';

describe('matchesAnswer', () => {
  it('accepte la bonne réponse, sans tenir compte de la casse', () => {
    expect(matchesAnswer('Budapest', ['Budapest'])).toBe(true);
    expect(matchesAnswer('budapest', ['Budapest'])).toBe(true);
    expect(matchesAnswer('  BUDAPEST  ', ['Budapest'])).toBe(true);
  });

  it('ignore les accents, dans la saisie comme dans la réponse', () => {
    expect(matchesAnswer('Brasilia', ['Brasília'])).toBe(true);
    expect(matchesAnswer('Séoul', ['Seoul'])).toBe(true);
    expect(matchesAnswer('Reykjavik', ['Reykjavík'])).toBe(true);
    expect(matchesAnswer('Chisinau', ['Chișinău'])).toBe(true);
  });

  it('ignore les tirets, les espaces et les apostrophes', () => {
    expect(matchesAnswer('port d espagne', ['Port-d’Espagne'])).toBe(true);
    expect(matchesAnswer("Port-d'Espagne", ['Port-d’Espagne'])).toBe(true);
    expect(matchesAnswer('ndjamena', ['N’Djamena'])).toBe(true);
    expect(matchesAnswer('Oulan Bator', ['Oulan-Bator'])).toBe(true);
    expect(matchesAnswer('NewDelhi', ['New Delhi'])).toBe(true);
  });

  it('développe St et Ste en Saint et Sainte', () => {
    expect(matchesAnswer('St John’s', ['Saint John’s'])).toBe(true);
    expect(matchesAnswer('saint johns', ['Saint John’s'])).toBe(true);
    expect(matchesAnswer('Ste Lucie', ['Sainte Lucie'])).toBe(true);
  });

  it('accepte le nom avec ou sans article initial', () => {
    expect(matchesAnswer('Havane', ['La Havane'])).toBe(true);
    expect(matchesAnswer('la havane', ['La Havane'])).toBe(true);
    expect(matchesAnswer('Caire', ['Le Caire'])).toBe(true);
    expect(matchesAnswer('Le Caire', ['Caire'])).toBe(true);
  });

  it('accepte l’une quelconque des réponses acceptées', () => {
    expect(matchesAnswer('Sucre', ['La Paz', 'Sucre'])).toBe(true);
    expect(matchesAnswer('la paz', ['La Paz', 'Sucre'])).toBe(true);
    expect(matchesAnswer('Beijing', ['Pékin', 'Beijing'])).toBe(true);
  });

  it('pardonne une faute de frappe pour les noms de 7 lettres ou plus', () => {
    expect(matchesAnswer('Budapets', ['Budapest'])).toBe(true); // lettres échangées
    expect(matchesAnswer('Ouagadougu', ['Ouagadougou'])).toBe(true); // lettre oubliée
    expect(matchesAnswer('Bruxelless', ['Bruxelles'])).toBe(true); // lettre en trop
    expect(matchesAnswer('Canbera', ['Canberra'])).toBe(true);
    expect(matchesAnswer('Moscoy', ['Moscou'])).toBe(false); // 6 lettres : exact seulement
  });

  it('ne pardonne pas les fautes sur les noms courts', () => {
    expect(matchesAnswer('Lime', ['Lima'])).toBe(false);
    expect(matchesAnswer('Roma', ['Rome'])).toBe(false);
    expect(matchesAnswer('Kiev', ['Kyiv'])).toBe(false);
    expect(matchesAnswer('Rome', ['Rome'])).toBe(true);
  });

  it('ne pardonne pas deux fautes', () => {
    expect(matchesAnswer('Budapxxt', ['Budapest'])).toBe(false);
    expect(matchesAnswer('Ouagadugu', ['Ouagadougou'])).toBe(false);
  });

  it('refuse une autre ville, une saisie vide ou sans lettre', () => {
    expect(matchesAnswer('Paris', ['Londres'])).toBe(false);
    expect(matchesAnswer('', ['Paris'])).toBe(false);
    expect(matchesAnswer('   ', ['Paris'])).toBe(false);
    expect(matchesAnswer('?!', ['Paris'])).toBe(false);
  });

  it('ne se laisse pas tromper par un article seul', () => {
    expect(matchesAnswer('la', ['La Havane'])).toBe(false);
    expect(matchesAnswer('le', ['Le Caire'])).toBe(false);
  });
});
