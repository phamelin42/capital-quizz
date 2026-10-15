import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { COUNTRY_LIST } from './data/countries';
import { countryName } from './data/country-name';
import { usStateName } from './data/us-state-name';
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
  const options = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.app-option'));
  const nameOf = (code: string) => (quiz.mode() === 'us' ? usStateName(code) : countryName(code));
  const optionFor = (code: string) => options().find((b) => b.textContent!.includes(nameOf(code)))!;
  const modeButton = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('.app-mode-button')).find(
      (b) => b.textContent!.trim() === label,
    )!;
  return { fixture, el, quiz, settle, options, optionFor, nameOf, modeButton };
}

describe('App', () => {
  it('affiche la capitale, une photo et 4 propositions', async () => {
    const { el, options, quiz } = await setup();
    const { place } = quiz.question();
    expect(el.querySelector('h1')!.textContent).toBe('Capital Quizz');
    expect(el.querySelector('.app-place-card')!.textContent).toContain(
      `Quel pays a pour capitale ${place.capital} ?`,
    );
    const img = el.querySelector<HTMLImageElement>('.app-photo')!;
    expect(img.getAttribute('src')).toBe(`places/world/${place.code}.jpg`);
    expect(options()).toHaveLength(4);
    expect(el.querySelector('.app-answer-options [role="group"]')!.getAttribute('aria-label')).toBe(
      'Choisis le pays de cette capitale',
    );
  });

  it('garde le pays et le monument secrets avant la réponse', async () => {
    const { el, quiz } = await setup();
    const { place, options } = quiz.question();
    const img = el.querySelector<HTMLImageElement>('.app-photo')!;
    expect(img.alt).toBe('Lieu à deviner');
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.textContent).not.toContain(place.funFact);
    expect(el.textContent).not.toContain(place.landmark);
    expect(el.querySelector('.app-place-card')!.textContent).not.toContain(countryName(place.code));
    expect(options).toHaveLength(4);
    expect(el.textContent).not.toContain('Capitale suivante');
  });

  it('n’affiche aucun encart avant la réponse', async () => {
    const { el } = await setup();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(el.querySelector('.app-map-panel')).toBeNull();
    expect(el.querySelector('fd-alert')).toBeNull();
  });

  it('valide une bonne réponse : verdict annoncé, anecdote, carte, monument', async () => {
    const { el, quiz, optionFor, settle } = await setup();
    const { place } = quiz.question();
    optionFor(place.code).click();
    await settle();

    expect(el.querySelector('.app-status')!.textContent).toContain('Bonne réponse');
    expect(el.querySelector('fd-alert')).toBeNull();
    expect(el.querySelector('.app-fun-fact')!.textContent).toContain(place.funFact);
    const iframe = el.querySelector<HTMLIFrameElement>('iframe.app-map')!;
    expect(new URL(iframe.src).searchParams.get('q')).toBe(
      `${place.capital}, ${countryName(place.code)}`,
    );
    expect(iframe.title).toContain(place.capital);
    expect(el.querySelector('.app-photo')!.getAttribute('alt')).toBe(
      `${place.landmark}, ${place.capital}`,
    );
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 1 / 1');
  });

  it('signale une mauvaise réponse et indique la bonne', async () => {
    const { el, quiz, options, optionFor, settle } = await setup();
    const { place } = quiz.question();
    const wrong = options().find((b) => b !== optionFor(place.code))!;
    wrong.click();
    await settle();

    expect(el.querySelector('.app-status')!.textContent).toContain(
      `Mauvaise réponse. La bonne réponse était : ${countryName(place.code)}`,
    );
    expect(optionFor(place.code).textContent).toContain('bonne réponse');
    expect(wrong.textContent).toContain('incorrecte');
    expect(wrong.className).toContain('fd-button--danger');
    expect(optionFor(place.code).className).toContain('fd-button--success');
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 1');
  });

  it('grise les autres propositions et ignore leurs clics', async () => {
    const { quiz, options, optionFor, settle } = await setup();
    optionFor(quiz.question().place.code).click();
    await settle();

    const good = optionFor(quiz.question().place.code);
    const others = options().filter((b) => b !== good);
    expect(others.every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true);
    others[0].click();
    await settle();
    expect(quiz.score()).toBe(1);
    expect(quiz.asked()).toBe(1);
  });

  it('passe à la capitale suivante, avec un bouton secondaire, et recache les encarts', async () => {
    const { el, quiz, optionFor, settle } = await setup();
    const first = quiz.question().place.code;
    optionFor(first).click();
    await settle();
    const next = el.querySelector<HTMLButtonElement>('button.fd-button--lg')!;
    expect(next.textContent).toContain('Capitale suivante');
    expect(next.className).not.toMatch(/fd-button--(primary|danger|success|ghost)/);
    next.click();
    await settle();

    expect(quiz.question().place.code).not.toBe(first);
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(el.querySelector('.app-status')!.textContent!.trim()).toBe('');
    expect(el.textContent).not.toContain('Capitale suivante');
  });

  it('met le focus sur « Capitale suivante » après une réponse, puis sur la première proposition', async () => {
    const { el, quiz, optionFor, options, settle } = await setup();
    document.body.appendChild(el);
    optionFor(quiz.question().place.code).click();
    await settle();
    const next = el.querySelector<HTMLButtonElement>('button.fd-button--lg')!;
    expect(document.activeElement).toBe(next);

    next.click();
    await settle();
    expect(document.activeElement).toBe(options()[0]);
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

    it('pose la question sur un état, avec des noms d’états, et remet le score à zéro', async () => {
      const { el, quiz, options, optionFor, modeButton, settle } = await setup();
      optionFor(quiz.question().place.code).click();
      await settle();
      expect(el.querySelector('.app-stats')!.textContent).toContain('Score 1 / 1');

      modeButton('États-Unis').click();
      await settle();

      const { place } = quiz.question();
      expect(quiz.mode()).toBe('us');
      expect(modeButton('États-Unis').getAttribute('aria-pressed')).toBe('true');
      expect(el.querySelector('.app-place-card')!.textContent).toContain(
        `Quel état a pour capitale ${place.capital} ?`,
      );
      expect(el.querySelector('.app-photo')!.getAttribute('src')).toBe(
        `places/us/${place.code}.jpg`,
      );
      expect(options().map((b) => b.textContent!.trim())).toContain(usStateName(place.code));
      expect(
        el.querySelector('.app-answer-options [role="group"]')!.getAttribute('aria-label'),
      ).toBe('Choisis l’état de cette capitale');
      expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 0');
      expect(el.querySelector('.app-fun-fact')).toBeNull();
      expect(el.querySelector('iframe')).toBeNull();
    });

    it('met le focus sur la première proposition après le changement de mode', async () => {
      const { el, options, modeButton, settle } = await setup();
      document.body.appendChild(el);
      modeButton('États-Unis').click();
      await settle();
      expect(document.activeElement).toBe(options()[0]);
      el.remove();
    });

    it('cherche la capitale de l’état sur la carte', async () => {
      const { el, quiz, optionFor, modeButton, settle } = await setup();
      modeButton('États-Unis').click();
      await settle();
      const { place } = quiz.question();
      optionFor(place.code).click();
      await settle();
      const iframe = el.querySelector<HTMLIFrameElement>('iframe.app-map')!;
      expect(new URL(iframe.src).searchParams.get('q')).toBe(
        `${place.capital}, ${usStateName(place.code)}`,
      );
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
