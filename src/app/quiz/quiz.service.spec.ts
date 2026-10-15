import { TestBed } from '@angular/core/testing';
import { Country } from '../data/country';
import { COUNTRIES, QuizService, RANDOM } from './quiz.service';

const codes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'];
const countries: Country[] = codes.map((code) => ({
  code,
  funFact: `anecdote ${code}`,
}));

/** Générateur déterministe (LCG) pour des tirages reproductibles. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function setup(random: () => number = seeded(7), pool: Country[] = countries): QuizService {
  TestBed.configureTestingModule({
    providers: [
      { provide: COUNTRIES, useValue: pool },
      { provide: RANDOM, useValue: random },
    ],
  });
  return TestBed.inject(QuizService);
}

function answerCorrectly(quiz: QuizService): void {
  quiz.choose(quiz.question().country.code);
}

function answerWrongly(quiz: QuizService): void {
  const wrong = quiz.question().options.find((o) => o.code !== quiz.question().country.code)!;
  quiz.choose(wrong.code);
}

describe('QuizService', () => {
  it('pose une question à 4 options distinctes dont exactement une est juste', () => {
    const quiz = setup();
    for (let i = 0; i < 30; i++) {
      const { country, options } = quiz.question();
      expect(options).toHaveLength(4);
      expect(new Set(options.map((o) => o.code)).size).toBe(4);
      expect(options.filter((o) => o.code === country.code)).toHaveLength(1);
      answerCorrectly(quiz);
      quiz.next();
    }
  });

  it('ne répète aucun pays avant d’avoir épuisé tous les pays', () => {
    const quiz = setup();
    const seen: string[] = [];
    countries.forEach(() => {
      seen.push(quiz.question().country.code);
      answerCorrectly(quiz);
      quiz.next();
    });
    expect(new Set(seen).size).toBe(countries.length);
  });

  it('repioche un nouveau paquet à épuisement, sans répéter le dernier pays d’affilée', () => {
    const quiz = setup();
    let previous = '';
    for (let i = 0; i < countries.length * 4; i++) {
      const code = quiz.question().country.code;
      expect(code).not.toBe(previous);
      previous = code;
      answerCorrectly(quiz);
      quiz.next();
    }
  });

  it('commence sans réponse', () => {
    const quiz = setup();
    expect(quiz.isAnswered()).toBe(false);
    expect(quiz.isCorrect()).toBe(false);
    expect(quiz.score()).toBe(0);
    expect(quiz.asked()).toBe(0);
  });

  it('compte un point et prolonge la série sur une bonne réponse', () => {
    const quiz = setup();
    answerCorrectly(quiz);
    expect(quiz.isAnswered()).toBe(true);
    expect(quiz.isCorrect()).toBe(true);
    expect(quiz.score()).toBe(1);
    expect(quiz.streak()).toBe(1);
    expect(quiz.asked()).toBe(1);
  });

  it('remet la série à zéro sur une mauvaise réponse et garde la meilleure série', () => {
    const quiz = setup();
    answerCorrectly(quiz);
    quiz.next();
    answerCorrectly(quiz);
    quiz.next();
    answerWrongly(quiz);
    expect(quiz.isCorrect()).toBe(false);
    expect(quiz.score()).toBe(2);
    expect(quiz.streak()).toBe(0);
    expect(quiz.bestStreak()).toBe(2);
    expect(quiz.asked()).toBe(3);
  });

  it('ignore un second clic une fois la question répondue', () => {
    const quiz = setup();
    answerWrongly(quiz);
    const chosen = quiz.answer();
    answerCorrectly(quiz);
    expect(quiz.answer()).toBe(chosen);
    expect(quiz.score()).toBe(0);
    expect(quiz.asked()).toBe(1);
  });

  it('ignore un code qui ne fait pas partie des options', () => {
    const quiz = setup();
    quiz.choose('zz');
    expect(quiz.isAnswered()).toBe(false);
  });

  it('ne passe pas à la question suivante tant qu’on n’a pas répondu', () => {
    const quiz = setup();
    const first = quiz.question();
    quiz.next();
    expect(quiz.question()).toBe(first);
  });

  it('efface la réponse en passant à la question suivante', () => {
    const quiz = setup();
    answerCorrectly(quiz);
    quiz.next();
    expect(quiz.answer()).toBeNull();
    expect(quiz.isAnswered()).toBe(false);
  });

  it('mélange la place de la bonne réponse', () => {
    const quiz = setup(seeded(3));
    const positions = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const { country, options } = quiz.question();
      positions.add(options.findIndex((o) => o.code === country.code));
      answerCorrectly(quiz);
      quiz.next();
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('refuse de démarrer avec moins de 4 pays', () => {
    expect(() => setup(seeded(1), countries.slice(0, 3))).toThrow();
  });
});
