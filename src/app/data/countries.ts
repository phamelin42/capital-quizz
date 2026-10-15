import { AFRICA } from './africa';
import { AMERICAS } from './americas';
import { ASIA } from './asia';
import { EUROPE } from './europe';
import { OCEANIA } from './oceania';
import { Place } from './place';

/** Les 193 États membres de l’ONU, plus le Vatican et la Palestine, observateurs. */
export const COUNTRY_LIST: readonly Place[] = [
  ...EUROPE,
  ...ASIA,
  ...AFRICA,
  ...AMERICAS,
  ...OCEANIA,
];
