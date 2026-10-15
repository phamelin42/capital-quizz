import { AFRICA } from './africa';
import { AMERICAS } from './americas';
import { ASIA } from './asia';
import { Country } from './country';
import { EUROPE } from './europe';
import { OCEANIA } from './oceania';

/** Les 193 États membres de l’ONU, plus le Vatican et la Palestine, observateurs. */
export const COUNTRY_LIST: readonly Country[] = [
  ...EUROPE,
  ...ASIA,
  ...AFRICA,
  ...AMERICAS,
  ...OCEANIA,
];
