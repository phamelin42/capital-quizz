/** Ce que le joueur devine : un pays du monde, ou un état des États-Unis. */
export type Mode = 'world' | 'us';

/** Une capitale du quiz. Le nom du pays ou de l'état est calculé à partir du code (voir `placeName`). */
export interface Place {
  /** ISO 3166-1 alpha-2 en minuscules (monde) ou abréviation postale à 2 lettres en minuscules (états). Nomme aussi la photo : `places/<mode>/<code>.jpg`. */
  readonly code: string;
  /** Nom français de la capitale, sans article. */
  readonly capital: string;
  /** Nom français du lieu emblématique photographié. Révélé seulement après la réponse. */
  readonly landmark: string;
  /** Une anecdote sur la capitale. */
  readonly funFact: string;
}
