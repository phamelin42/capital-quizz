import { Mode } from '../data/place';

/** Chemin de la photo d'une capitale, relatif à la page (`public/places/<mode>/<code>.jpg`). */
export function photoSrc(mode: Mode, code: string): string {
  return `places/${mode === 'us' ? 'us' : 'world'}/${code}.jpg`;
}
