import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { acceptedAnswers } from '../data/answer-aliases';
import { COUNTRY_LIST } from '../data/countries';
import { Mode, Place } from '../data/place';
import { US_STATE_LIST } from '../data/us-states';
import { matchesAnswer } from './answer-match';

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

export interface Question {
  /** Le pays ou l'état posé : son `capital` est la réponse attendue (la photo montre cette capitale). */
  readonly place: Place;
}

/**
 * Déroulé d'une partie sans fin : chaque pays (ou état) est posé une fois par paquet, dans un ordre mélangé,
 * puis le paquet est refait. Le joueur tape le nom de la capitale ; une question se répond une seule fois.
 * Changer de mode repart de zéro.
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
  /** Texte envoyé par le joueur (vide s'il a passé), `null` tant qu'il n'a pas répondu. */
  readonly answer = signal<string | null>(null);
  readonly score = signal(0);
  readonly streak = signal(0);
  readonly bestStreak = signal(0);
  /** Nombre de questions répondues (ou passées). */
  readonly asked = signal(0);

  readonly isAnswered = computed(() => this.answer() !== null);
  /** Le joueur a passé la question avec « Je ne sais pas ». */
  readonly skipped = computed(() => this.answer() === '');
  readonly isCorrect = computed(() => {
    const answer = this.answer();
    return answer !== null && matchesAnswer(answer, this.accepted());
  });
  /** Les réponses acceptées pour la question courante, la capitale en tête. */
  readonly accepted = computed(() => acceptedAnswers(this.mode(), this.question().place));

  /** Valide une réponse. Sans effet si la question est déjà répondue ou si la saisie est vide. */
  submit(text: string): void {
    if (this.isAnswered()) return;
    const answer = text.trim();
    if (!answer) return;
    this.record(answer);
  }

  /** « Je ne sais pas » : révèle la réponse et compte comme une erreur. Sans effet si la question est répondue. */
  giveUp(): void {
    if (this.isAnswered()) return;
    this.record('');
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
    this.assertNotEmpty(mode);
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

  private record(answer: string): void {
    this.answer.set(answer);
    this.asked.update((n) => n + 1);
    if (this.isCorrect()) {
      this.score.update((n) => n + 1);
      this.streak.update((n) => n + 1);
      this.bestStreak.update((best) => Math.max(best, this.streak()));
    } else {
      this.streak.set(0);
    }
  }

  private assertNotEmpty(mode: Mode): void {
    if (this.lists[mode].length === 0) throw new Error('Il faut au moins une entrée.');
  }

  private draw(): Question {
    this.assertNotEmpty(this.mode());
    if (this.deck.length === 0) {
      this.deck = this.shuffled(this.lists[this.mode()]);
      // Début de paquet : on évite de reposer tout de suite la question qui vient d'être vue.
      if (this.deck.length > 1 && this.deck[this.deck.length - 1].code === this.lastCode) {
        this.deck.unshift(this.deck.pop()!);
      }
    }
    const place = this.deck.pop()!;
    this.lastCode = place.code;
    return { place };
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
