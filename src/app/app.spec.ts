import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { countryName } from './data/country-name';
import { COUNTRIES, QuizService, RANDOM } from './quiz/quiz.service';
import { COUNTRY_LIST } from './data/countries';

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
      { provide: RANDOM, useValue: seeded(11) },
    ],
  });
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const quiz = TestBed.inject(QuizService);
  const settle = () => fixture.whenStable();
  const options = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.app-option'));
  const optionFor = (code: string) =>
    options().find((b) => b.textContent!.includes(countryName(code)))!;
  return { fixture, el, quiz, settle, options, optionFor };
}

describe('App', () => {
  it('affiche un drapeau et 4 propositions', async () => {
    const { el, options, quiz } = await setup();
    const img = el.querySelector<HTMLImageElement>('.app-flag')!;
    expect(img.getAttribute('src')).toBe(`flags/4x3/${quiz.question().country.code}.svg`);
    expect(options()).toHaveLength(4);
  });

  it('garde le nom du pays secret avant la réponse', async () => {
    const { el, quiz } = await setup();
    const img = el.querySelector<HTMLImageElement>('.app-flag')!;
    expect(img.alt).toBe('Drapeau à deviner');
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.textContent).not.toContain(quiz.question().country.funFact);
    expect(el.textContent).not.toContain('Drapeau suivant');
  });

  it('n’affiche aucun encart avant la réponse', async () => {
    const { el } = await setup();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(el.querySelector('.app-map-panel')).toBeNull();
    expect(el.querySelector('fd-alert')).toBeNull();
  });

  it('valide une bonne réponse : verdict annoncé, anecdote, carte', async () => {
    const { el, quiz, optionFor, settle } = await setup();
    const { country } = quiz.question();
    optionFor(country.code).click();
    await settle();

    expect(el.querySelector('.app-status')!.textContent).toContain('Bonne réponse');
    expect(el.querySelector('fd-alert')).toBeNull();
    expect(el.querySelector('.app-fun-fact')!.textContent).toContain(country.funFact);
    const iframe = el.querySelector<HTMLIFrameElement>('iframe.app-map')!;
    expect(new URL(iframe.src).searchParams.get('q')).toBe(countryName(country.code));
    expect(iframe.title).toContain(countryName(country.code));
    expect(el.querySelector('.app-flag')!.getAttribute('alt')).toBe(
      `Drapeau : ${countryName(country.code)}`,
    );
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 1 / 1');
  });

  it('signale une mauvaise réponse et indique la bonne', async () => {
    const { el, quiz, options, optionFor, settle } = await setup();
    const { country } = quiz.question();
    const wrong = options().find((b) => b !== optionFor(country.code))!;
    wrong.click();
    await settle();

    expect(el.querySelector('.app-status')!.textContent).toContain('Mauvaise réponse');
    expect(el.querySelector('.app-status')!.textContent).toContain(countryName(country.code));
    expect(optionFor(country.code).textContent).toContain('bonne réponse');
    expect(wrong.textContent).toContain('incorrecte');
    expect(wrong.className).toContain('fd-button--danger');
    expect(optionFor(country.code).className).toContain('fd-button--success');
    expect(el.querySelector('.app-stats')!.textContent).toContain('Score 0 / 1');
  });

  it('grise les autres propositions et ignore leurs clics', async () => {
    const { quiz, options, optionFor, settle } = await setup();
    const { country } = quiz.question();
    optionFor(country.code).click();
    await settle();

    expect(optionFor(country.code).className).toContain('fd-button--success');
    const others = options().filter((b) => b !== optionFor(country.code));
    expect(others.every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true);
    others[0].click();
    await settle();
    expect(quiz.score()).toBe(1);
    expect(quiz.asked()).toBe(1);
  });

  it('passe au drapeau suivant, avec un bouton secondaire, et recache les encarts', async () => {
    const { el, quiz, optionFor, settle } = await setup();
    const first = quiz.question().country.code;
    optionFor(first).click();
    await settle();
    const next = el.querySelector<HTMLButtonElement>('button.fd-button--lg')!;
    expect(next.className).not.toMatch(/fd-button--(primary|danger|success|ghost)/);
    next.click();
    await settle();

    expect(quiz.question().country.code).not.toBe(first);
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.querySelector('.app-fun-fact')).toBeNull();
    expect(el.querySelector('.app-status')!.textContent!.trim()).toBe('');
    expect(el.textContent).not.toContain('Drapeau suivant');
  });

  it('met le focus sur « Drapeau suivant » après une réponse, puis sur la première proposition', async () => {
    const { el, quiz, optionFor, options, settle } = await setup();
    document.body.appendChild(el);
    optionFor(quiz.question().country.code).click();
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
});
