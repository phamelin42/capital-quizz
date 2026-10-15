import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { COUNTRY_LIST } from '../data/countries';
import { Mode, Place } from '../data/place';
import { US_STATE_LIST } from '../data/us-states';

/** Les pays tirés par le quiz en mode monde. Remplaçable dans les tests. */
export const COUNTRIES = new InjectionToken<readonly Place[]>('COUNTRIES', {
  providedIn: 'root',
  factory: () => COUNTRY_LIST,
});

/** Les états tirés par le quiz en mode États-Unis. Remplaçable dans les tests. */
export const US_STATES = new InjectionToken<readonly Place[]>('US_STATES', {
  providedIn: 'root',
  factory: () => US_STATE_LIST,
});

/** Source de hasard dans [0, 1[. Remplaçable dans les tests pour des tirages reproductibles. */
export const RANDOM = new InjectionToken<() => number>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

const OPTION_COUNT = 4;

export interface Question {
  /** La capitale posée ; son `code` désigne le pays ou l'état à trouver. */
  readonly place: Place;
  /** Les 4 propositions, dans l'ordre d'affichage ; la bonne s'y trouve une seule fois. */
  readonly options: readonly Place[];
}

/**
 * Déroulé d'une partie sans fin : chaque capitale est posée une fois par paquet, dans un ordre mélangé,
 * puis le paquet est refait. Une question se répond une seule fois. Changer de mode repart de zéro.
 */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly lists: Record<Mode, readonly Place[]> = {
    world: inject(COUNTRIES),
    us: inject(US_STATES),
  };
  private readonly random = inject(RANDOM);

  private deck: Place[] = [];
  private lastCode: string | null = null;

  readonly mode = signal<Mode>('world');
  readonly question = signal<Question>(this.draw());
  /** Code choisi par le joueur, `null` tant qu'il n'a pas répondu. */
  readonly answer = signal<string | null>(null);
  readonly score = signal(0);
  readonly streak = signal(0);
  readonly bestStreak = signal(0);
  /** Nombre de questions répondues. */
  readonly asked = signal(0);

  readonly isAnswered = computed(() => this.answer() !== null);
  readonly isCorrect = computed(() => this.answer() === this.question().place.code);

  /** Valide un choix. Sans effet si la question est déjà répondue ou si le code n'est pas proposé. */
  choose(code: string): void {
    if (this.isAnswered()) return;
    const { place, options } = this.question();
    if (!options.some((option) => option.code === code)) return;

    this.answer.set(code);
    this.asked.update((n) => n + 1);
    if (code === place.code) {
      this.score.update((n) => n + 1);
      this.streak.update((n) => n + 1);
      this.bestStreak.update((best) => Math.max(best, this.streak()));
    } else {
      this.streak.set(0);
    }
  }

  /** Passe à la question suivante. Sans effet tant que la question courante n'est pas répondue. */
  next(): void {
    if (!this.isAnswered()) return;
    this.answer.set(null);
    this.question.set(this.draw());
  }

  /** Change de mode et repart de zéro : score, séries, paquet et question. Sans effet si le mode est déjà actif. */
  setMode(mode: Mode): void {
    if (mode === this.mode()) return;
    this.assertEnough(mode);
    this.mode.set(mode);
    this.deck = [];
    this.lastCode = null;
    this.answer.set(null);
    this.score.set(0);
    this.streak.set(0);
    this.bestStreak.set(0);
    this.asked.set(0);
    this.question.set(this.draw());
  }

  private assertEnough(mode: Mode): void {
    const count = this.lists[mode].length;
    if (count < OPTION_COUNT) {
      throw new Error(`Il faut au moins ${OPTION_COUNT} entrées, ${count} fournies.`);
    }
  }

  private draw(): Question {
    this.assertEnough(this.mode());
    const places = this.lists[this.mode()];
    if (this.deck.length === 0) {
      this.deck = this.shuffled(places);
      // Début de paquet : on évite de reposer tout de suite la capitale qui vient d'être vue.
      if (this.deck[this.deck.length - 1].code === this.lastCode) {
        this.deck.unshift(this.deck.pop()!);
      }
    }
    const place = this.deck.pop()!;
    this.lastCode = place.code;

    const others = this.shuffled(places.filter((p) => p.code !== place.code));
    const options = this.shuffled([place, ...others.slice(0, OPTION_COUNT - 1)]);
    return { place, options };
  }

  /** Mélange de Fisher-Yates sur une copie. */
  private shuffled<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
