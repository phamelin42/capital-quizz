import { countryName } from './country-name';
import { Mode } from './place';

const US_STATE_NAMES: Record<string, string> = {
  al: 'Alabama',
  ak: 'Alaska',
  az: 'Arizona',
  ar: 'Arkansas',
  ca: 'Californie',
  co: 'Colorado',
  ct: 'Connecticut',
  de: 'Delaware',
  fl: 'Floride',
  ga: 'Géorgie',
  hi: 'Hawaï',
  id: 'Idaho',
  il: 'Illinois',
  in: 'Indiana',
  ia: 'Iowa',
  ks: 'Kansas',
  ky: 'Kentucky',
  la: 'Louisiane',
  me: 'Maine',
  md: 'Maryland',
  ma: 'Massachusetts',
  mi: 'Michigan',
  mn: 'Minnesota',
  ms: 'Mississippi',
  mo: 'Missouri',
  mt: 'Montana',
  ne: 'Nebraska',
  nv: 'Nevada',
  nh: 'New Hampshire',
  nj: 'New Jersey',
  nm: 'Nouveau-Mexique',
  ny: 'New York',
  nc: 'Caroline du Nord',
  nd: 'Dakota du Nord',
  oh: 'Ohio',
  ok: 'Oklahoma',
  or: 'Oregon',
  pa: 'Pennsylvanie',
  ri: 'Rhode Island',
  sc: 'Caroline du Sud',
  sd: 'Dakota du Sud',
  tn: 'Tennessee',
  tx: 'Texas',
  ut: 'Utah',
  vt: 'Vermont',
  va: 'Virginie',
  wa: 'Washington',
  wv: 'Virginie-Occidentale',
  wi: 'Wisconsin',
  wy: 'Wyoming',
};

/** Nom français d'un état des États-Unis à partir de son abréviation postale. */
export function usStateName(code: string): string {
  return US_STATE_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

/** Nom français de ce que le joueur devine : un pays ou un état selon le mode. */
export function placeName(mode: Mode, code: string): string {
  return mode === 'us' ? usStateName(code) : countryName(code);
}
