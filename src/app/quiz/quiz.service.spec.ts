import { TestBed } from '@angular/core/testing';
import { Place } from '../data/place';
import { COUNTRIES, QuizService, RANDOM, US_STATES } from './quiz.service';

const codes = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'];
const place = (code: string): Place => ({
  code,
  capital: `Capitale${code}`,
  landmark: `monument ${code}`,
  funFact: `anecdote ${code}`,
});
const countries: Place[] = codes.map(place);
const states: Place[] = ['s1', 's2', 's3', 's4', 's5'].map(place);

/** Générateur déterministe (LCG) pour des tirages reproductibles. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function setup(random: () => number = seeded(7), pool: Place[] = countries): QuizService {
  TestBed.configureTestingModule({
    providers: [
      { provide: COUNTRIES, useValue: pool },
      { provide: US_STATES, useValue: states },
      { provide: RANDOM, useValue: random },
    ],
  });
  return TestBed.inject(QuizService);
}

const answerCorrectly = (quiz: QuizService) => quiz.submit(quiz.question().place.capital);
const answerWrongly = (quiz: QuizService) => quiz.submit('Une autre ville');

describe('QuizService', () => {
  it('ne répète aucun pays avant d’avoir épuisé tous les pays', () => {
    const quiz = setup();
    const seen: string[] = [];
    countries.forEach(() => {
      seen.push(quiz.question().place.code);
      answerCorrectly(quiz);
      quiz.next();
    });
    expect(new Set(seen).size).toBe(countries.length);
  });

  it('repioche un nouveau paquet à épuisement, sans répéter le dernier pays d’affilée', () => {
    const quiz = setup();
    let previous = '';
    for (let i = 0; i < countries.length * 4; i++) {
      const code = quiz.question().place.code;
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
    expect(quiz.skipped()).toBe(false);
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

  it('accepte la réponse sans tenir compte de la casse, des accents ni d’une faute de frappe', () => {
    const quiz = setup();
    quiz.submit(`  ${quiz.question().place.capital.toUpperCase().slice(0, -1)}  `); // une lettre oubliée
    expect(quiz.isCorrect()).toBe(true);
    expect(quiz.answer()).not.toBe(quiz.question().place.capital);
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

  it('ignore une réponse vide ou faite d’espaces', () => {
    const quiz = setup();
    quiz.submit('');
    quiz.submit('   ');
    expect(quiz.isAnswered()).toBe(false);
    expect(quiz.asked()).toBe(0);
  });

  it('ignore une seconde réponse une fois la question répondue', () => {
    const quiz = setup();
    answerWrongly(quiz);
    const chosen = quiz.answer();
    answerCorrectly(quiz);
    quiz.giveUp();
    expect(quiz.answer()).toBe(chosen);
    expect(quiz.score()).toBe(0);
    expect(quiz.asked()).toBe(1);
  });

  it('« Je ne sais pas » révèle la réponse, compte une erreur et casse la série', () => {
    const quiz = setup();
    answerCorrectly(quiz);
    quiz.next();
    quiz.giveUp();
    expect(quiz.isAnswered()).toBe(true);
    expect(quiz.skipped()).toBe(true);
    expect(quiz.isCorrect()).toBe(false);
    expect(quiz.score()).toBe(1);
    expect(quiz.streak()).toBe(0);
    expect(quiz.bestStreak()).toBe(1);
    expect(quiz.asked()).toBe(2);
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
    expect(quiz.skipped()).toBe(false);
  });

  it('refuse de démarrer sans aucun pays', () => {
    expect(() => setup(seeded(1), [])).toThrow();
  });

  describe('réponses acceptées', () => {
    it('donne la capitale en premier', () => {
      const quiz = setup();
      expect(quiz.accepted()[0]).toBe(quiz.question().place.capital);
    });

    it('accepte toutes les villes d’une capitale partagée', () => {
      const bolivia: Place = {
        code: 'bo',
        capital: 'La Paz',
        landmark: 'x',
        funFact: 'y'.repeat(30),
      };
      TestBed.configureTestingModule({
        providers: [
          { provide: COUNTRIES, useValue: [bolivia] },
          { provide: US_STATES, useValue: states },
          { provide: RANDOM, useValue: seeded(1) },
        ],
      });
      const quiz = TestBed.inject(QuizService);
      quiz.submit('Sucre');
      expect(quiz.isCorrect()).toBe(true);
    });
  });

  describe('modes', () => {
    it('commence en mode monde', () => {
      const quiz = setup();
      expect(quiz.mode()).toBe('world');
      expect(codes).toContain(quiz.question().place.code);
    });

    it('tire ses questions dans la liste des états en mode États-Unis', () => {
      const quiz = setup();
      quiz.setMode('us');
      expect(quiz.mode()).toBe('us');
      for (let i = 0; i < 12; i++) {
        expect(states.map((s) => s.code)).toContain(quiz.question().place.code);
        answerCorrectly(quiz);
        quiz.next();
      }
    });

    it('remet tout à zéro en changeant de mode', () => {
      const quiz = setup();
      answerCorrectly(quiz);
      quiz.next();
      answerCorrectly(quiz);
      quiz.setMode('us');
      expect(quiz.score()).toBe(0);
      expect(quiz.streak()).toBe(0);
      expect(quiz.bestStreak()).toBe(0);
      expect(quiz.asked()).toBe(0);
      expect(quiz.answer()).toBeNull();
      expect(quiz.isAnswered()).toBe(false);
    });

    it('ne fait rien en demandant le mode déjà actif', () => {
      const quiz = setup();
      answerCorrectly(quiz);
      const question = quiz.question();
      quiz.setMode('world');
      expect(quiz.question()).toBe(question);
      expect(quiz.score()).toBe(1);
      expect(quiz.isAnswered()).toBe(true);
    });

    it('épuise tous les états avant d’en reposer un (50 questions d’affilée)', () => {
      const fifty = Array.from({ length: 50 }, (_, i) => place(`t${i}`));
      TestBed.configureTestingModule({
        providers: [
          { provide: COUNTRIES, useValue: countries },
          { provide: US_STATES, useValue: fifty },
          { provide: RANDOM, useValue: seeded(5) },
        ],
      });
      const quiz = TestBed.inject(QuizService);
      quiz.setMode('us');
      const seen: string[] = [];
      for (let i = 0; i < 50; i++) {
        seen.push(quiz.question().place.code);
        answerCorrectly(quiz);
        quiz.next();
      }
      expect(new Set(seen).size).toBe(50);
    });

    it('refuse un mode dont la liste est vide, sans rien changer', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: COUNTRIES, useValue: countries },
          { provide: US_STATES, useValue: [] },
          { provide: RANDOM, useValue: seeded(1) },
        ],
      });
      const quiz = TestBed.inject(QuizService);
      answerCorrectly(quiz);
      expect(() => quiz.setMode('us')).toThrow();
      expect(quiz.mode()).toBe('world');
      expect(quiz.score()).toBe(1);
    });
  });
});
