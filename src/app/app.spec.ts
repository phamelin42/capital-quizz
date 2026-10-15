import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { COUNTRY_LIST } from './data/countries';
import { countryName } from './data/country-name';
import { placeOf } from './data/place-of';
import { US_STATE_LIST } from './data/us-states';
import { COUNTRIES, QuizService, RANDOM, US_STATES } from './quiz/quiz.service';

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      { provide: COUNTRIES, useValue: COUNTRY_LIST },
      { provide: US_STATES, useValue: US_STATE_LIST },
      { provide: RANDOM, useValue: seeded(11) },
    ],
  });
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const quiz = TestBed.inject(QuizService);
  const settle = () => fixture.whenStable();
  const input = () => el.querySelector<HTMLInputElement>('.app-answer-field input')!;
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  const submit = async () => {
    el.querySelector<HTMLButtonElement>('.app-submit')!.click();
    await settle();
  };
  const answerWith = async (text: string) => {
    await type(text);
    await submit();
  };
  const nextButton = () => el.querySelector<HTMLButtonElement>('button.fd-button--lg');
  const modeButton = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('.app-mode-button')).find(
      (b) => b.textContent!.trim() === label,
    )!;
  const status = () => el.querySelector('.app-status')!;
  return {
    fixture,
    el,
    quiz,
    settle,
    input,
    type,
    submit,
    answerWith,
    nextButton,
    modeButton,
    status,
  };
}

describe('App', () => {
  it('pose la question avec l’article, une photo et un champ de réponse', async () => {
    const { el, input, quiz } = await setup();
    const { place } = quiz.question();
    expect(el.querySelector('h1')!.textContent).toBe('Capital Quizz');
    expect(el.querySelector('.app-place-card')!.textContent).toContain(
      `Quelle est la capitale ${placeOf('world', place.code)} ?`,
    );
    expect(el.querySelector<HTMLImageElement>('.app-photo')!.getAttribute('src')).toBe(
      `places/world/${place.code}.jpg`,
    );
    expect(input()).not.toBeNull();
    expect(el.querySelector('.app-answer-field label')!.textContent).toContain('Ta réponse');
    expect(el.querySelector('.app-option')).toBeNull();
  });

  it('ne nomme ni la capitale ni le monument avant la réponse', async () => {
    const { el, quiz } = await setup();
    const { place } = quiz.question();
    expect(el.querySelector<HTMLImageElement>('.app-photo')!.alt).toBe('Photo de la capitale');
    expect(el.textContent).not.toContain(place.capital);
    expect(el.textContent).not.toContain(place.landmark);
    expect(el.textContent).not.toContain(place.funFact);
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.textContent).not.toContain('Capitale suivante');
  });

  it('n’affiche aucun encart avant la réponse', async () => {
    const { el, status } = await setup();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(el.querySelector('.app-map-panel')).toBeNull();
    expect(el.querySelector('fd-alert')).toBeNull();
    expect(status().textContent!.trim()).toBe('');
  });

  it('valide une bonne réponse : verdict annoncé, anecdote, carte, monument', async () => {
    const { el, quiz, answerWith, status } = await setup();
    const { place } = quiz.question();
    await answerWith(place.capital);

    expect(status().textContent).toContain(`Bonne réponse : ${place.capital}.`);
    expect(status().className).toContain('app-status--correct');
    expect(status().getAttribute('aria-live')).toBe('polite');
    expect(el.querySelector('fd-alert')).toBeNull();
    expect(el.querySelector('.app-fun-fact')!.textContent).toContain(place.funFact);
    const iframe = el.querySelector<HTMLIFrameElement>('iframe.app-map')!;
    expect(new URL(iframe.src).searchParams.get('q')).toBe(
      `${place.capital}, ${countryName(place.code)}`,
    );
    expect(el.querySelector('.app-photo')!.getAttribute('alt')).toBe(
      `${place.landmark}, ${place.capital}`,
    );
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 1 / 1');
  });

  it('accepte une réponse sans accents, en minuscules, avec une faute de frappe', async () => {
    const { quiz, answerWith, el } = await setup();
    const capital = quiz.question().place.capital;
    // Une lettre oubliée : toléré pour les noms de 7 lettres ou plus, sinon seule la casse change.
    const typed = capital.length >= 7 ? capital.slice(0, -1) : capital;
    await answerWith(` ${typed.toLowerCase()} `);
    expect(quiz.isCorrect()).toBe(true);
    expect(el.querySelector('.app-status')!.textContent).toContain('Bonne réponse');
  });

  it('signale une mauvaise réponse et donne la bonne', async () => {
    const { quiz, answerWith, status, el } = await setup();
    const { place } = quiz.question();
    await answerWith('Une ville qui n’existe pas');

    expect(status().textContent).toContain('Mauvaise réponse.');
    expect(status().textContent).toContain(`La bonne réponse était : ${place.capital}.`);
    expect(status().className).toContain('app-status--wrong');
    expect(el.querySelector('.app-answer-field input')!.hasAttribute('disabled')).toBe(true);
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 1');
    expect(quiz.streak()).toBe(0);
  });

  it('ignore un envoi vide', async () => {
    const { quiz, type, submit, el } = await setup();
    await submit();
    await type('   ');
    await submit();
    expect(quiz.isAnswered()).toBe(false);
    expect(el.querySelector('.app-submit')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('envoie la réponse avec la touche Entrée', async () => {
    const { el, quiz, type, settle } = await setup();
    await type(quiz.question().place.capital);
    el.querySelector<HTMLFormElement>('form.app-form')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await settle();
    expect(quiz.isCorrect()).toBe(true);
  });

  it('« Je ne sais pas » révèle la bonne réponse et compte une erreur', async () => {
    const { el, quiz, status, settle } = await setup();
    const { place } = quiz.question();
    el.querySelector<HTMLButtonElement>('.app-giveup')!.click();
    await settle();

    expect(status().textContent).toContain('Tu as passé.');
    expect(status().textContent).toContain(`La bonne réponse était : ${place.capital}.`);
    expect(el.querySelector('.app-fun-fact')!.textContent).toContain(place.funFact);
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 1');
    expect(el.querySelector('.app-giveup')).toBeNull();
  });

  it('ignore un second envoi une fois la question répondue', async () => {
    const { quiz, answerWith, el, settle } = await setup();
    await answerWith('Une ville qui n’existe pas');
    quiz.submit(quiz.question().place.capital);
    el.querySelector<HTMLFormElement>('form.app-form')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await settle();
    expect(quiz.score()).toBe(0);
    expect(quiz.asked()).toBe(1);
  });

  it('passe à la capitale suivante avec un bouton secondaire, vide le champ et recache les encarts', async () => {
    const { el, quiz, answerWith, nextButton, input, settle, status } = await setup();
    const first = quiz.question().place.code;
    await answerWith(quiz.question().place.capital);
    const next = nextButton()!;
    expect(next.textContent).toContain('Capitale suivante');
    expect(next.className).not.toMatch(/fd-button--(primary|danger|success|ghost)/);
    next.click();
    await settle();

    expect(quiz.question().place.code).not.toBe(first);
    expect(input().value).toBe('');
    expect(input().hasAttribute('disabled')).toBe(false);
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(status().textContent!.trim()).toBe('');
    expect(el.textContent).not.toContain('Capitale suivante');
  });

  it('met le focus sur « Capitale suivante » après une réponse, puis sur le champ', async () => {
    const { el, quiz, answerWith, nextButton, input, settle } = await setup();
    document.body.appendChild(el);
    await answerWith(quiz.question().place.capital);
    await settle();
    expect(document.activeElement).toBe(nextButton());

    nextButton()!.click();
    await settle();
    expect(document.activeElement).toBe(input());
    el.remove();
  });

  it('bascule le thème Nuit', async () => {
    const { el, settle } = await setup();
    const input = el.querySelector<HTMLInputElement>('fd-switch input')!;
    input.click();
    await settle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    input.click();
    await settle();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  describe('mode États-Unis', () => {
    it('propose un groupe Monde / États-Unis, Monde étant actif', async () => {
      const { el, modeButton } = await setup();
      expect(el.querySelector('.app-mode-switch [role="group"]')!.getAttribute('aria-label')).toBe(
        'Mode de jeu',
      );
      expect(modeButton('Monde').getAttribute('aria-pressed')).toBe('true');
      expect(modeButton('États-Unis').getAttribute('aria-pressed')).toBe('false');
    });

    it('pose la question sur un état et remet le score à zéro', async () => {
      const { el, quiz, answerWith, modeButton, settle } = await setup();
      await answerWith(quiz.question().place.capital);
      expect(el.querySelector('.app-stats')!.textContent).toContain('Score 1 / 1');

      modeButton('États-Unis').click();
      await settle();

      const { place } = quiz.question();
      expect(quiz.mode()).toBe('us');
      expect(modeButton('États-Unis').getAttribute('aria-pressed')).toBe('true');
      expect(el.querySelector('.app-place-card')!.textContent).toContain(
        `Quelle est la capitale ${placeOf('us', place.code)} ?`,
      );
      expect(el.querySelector('.app-photo')!.getAttribute('src')).toBe(
        `places/us/${place.code}.jpg`,
      );
      expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 0');
      expect(el.querySelector('.app-fun-fact')).toBeNull();
      expect(el.querySelector('iframe')).toBeNull();
    });

    it('met le focus dans le champ de réponse après le changement de mode', async () => {
      const { el, input, modeButton, settle } = await setup();
      document.body.appendChild(el);
      modeButton('États-Unis').click();
      await settle();
      expect(document.activeElement).toBe(input());
      el.remove();
    });

    it('cherche la capitale de l’état sur la carte', async () => {
      const { el, quiz, answerWith, modeButton, settle } = await setup();
      modeButton('États-Unis').click();
      await settle();
      const { place } = quiz.question();
      await answerWith(place.capital);
      const iframe = el.querySelector<HTMLIFrameElement>('iframe.app-map')!;
      expect(new URL(iframe.src).searchParams.get('q')).toContain(`${place.capital}, `);
    });
  });

  describe('pied de page', () => {
    it('renvoie vers le portfolio, le Flag Quizz et les crédits', async () => {
      const { el } = await setup();
      const footer = el.querySelector('.app-site-footer')!;
      expect(footer.textContent).toContain('Vous voulez en voir plus ? Visitez mon portfolio');
      expect(footer.querySelector('a.app-footer-portfolio')!.getAttribute('href')).toBe(
        'https://phamelin.fr/#projects',
      );
      expect(footer.querySelector('a.app-footer-flags')!.getAttribute('href')).toBe(
        'https://flag-quizz.phamelin.fr',
      );
      expect(footer.querySelector('a.app-footer-credits')!.getAttribute('href')).toBe(
        'credits.html',
      );
    });
  });
});
