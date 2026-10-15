import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { COUNTRY_LIST } from '../data/countries';
import { Country } from '../data/country';

/** Les pays tirés par le quiz. Remplaçable dans les tests. */
export const COUNTRIES = new InjectionToken<readonly Country[]>('COUNTRIES', {
  providedIn: 'root',
  factory: () => COUNTRY_LIST,
});

/** Source de hasard dans [0, 1[. Remplaçable dans les tests pour des tirages reproductibles. */
export const RANDOM = new InjectionToken<() => number>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

const OPTION_COUNT = 4;

export interface Question {
  readonly country: Country;
  /** Les 4 propositions, dans l'ordre d'affichage ; la bonne s'y trouve une seule fois. */
  readonly options: readonly Country[];
}

/**
 * Déroulé d'une partie sans fin : chaque pays est posé une fois par paquet, dans un ordre mélangé,
 * puis le paquet est refait. Une question se répond une seule fois.
 */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly countries = inject(COUNTRIES);
  private readonly random = inject(RANDOM);

  private deck: Country[] = [];
  private lastCode: string | null = null;

  readonly question = signal<Question>(this.draw());
  /** Code choisi par le joueur, `null` tant qu'il n'a pas répondu. */
  readonly answer = signal<string | null>(null);
  readonly score = signal(0);
  readonly streak = signal(0);
  readonly bestStreak = signal(0);
  /** Nombre de questions répondues. */
  readonly asked = signal(0);

  readonly isAnswered = computed(() => this.answer() !== null);
  readonly isCorrect = computed(() => this.answer() === this.question().country.code);

  /** Valide un choix. Sans effet si la question est déjà répondue ou si le code n'est pas proposé. */
  choose(code: string): void {
    if (this.isAnswered()) return;
    const { country, options } = this.question();
    if (!options.some((option) => option.code === code)) return;

    this.answer.set(code);
    this.asked.update((n) => n + 1);
    if (code === country.code) {
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

  private draw(): Question {
    if (this.countries.length < OPTION_COUNT) {
      throw new Error(`Il faut au moins ${OPTION_COUNT} pays, ${this.countries.length} fournis.`);
    }
    if (this.deck.length === 0) {
      this.deck = this.shuffled(this.countries);
      // Début de paquet : on évite de reposer tout de suite le pays qui vient d'être vu.
      if (this.deck[this.deck.length - 1].code === this.lastCode) {
        this.deck.unshift(this.deck.pop()!);
      }
    }
    const country = this.deck.pop()!;
    this.lastCode = country.code;

    const others = this.shuffled(this.countries.filter((c) => c.code !== country.code));
    const options = this.shuffled([country, ...others.slice(0, OPTION_COUNT - 1)]);
    return { country, options };
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
