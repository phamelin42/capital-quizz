import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { FdButton, FdIcon } from 'fuda';
import { countryName } from '../data/country-name';
import { QuizService } from '../quiz/quiz.service';

type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

/** Les 4 réponses, le verdict (annoncé, sans encart) et le bouton pour passer à la suivante. */
@Component({
  selector: 'app-answer-options',
  imports: [FdButton, FdIcon],
  templateUrl: './answer-options.html',
  styleUrl: './answer-options.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-answer-options' },
})
export class AnswerOptions {
  protected readonly quiz = inject(QuizService);
  private readonly injector = inject(Injector);

  private readonly optionButtons = viewChildren('option', { read: ElementRef<HTMLButtonElement> });
  private readonly nextButton = viewChild('nextBtn', { read: ElementRef<HTMLButtonElement> });

  protected readonly name = countryName;

  /** État visuel de chaque proposition : le verdict ne repose jamais sur la couleur seule (icône + texte masqué). */
  protected readonly states = computed(() => {
    const { country, options } = this.quiz.question();
    const answer = this.quiz.answer();
    return Object.fromEntries(
      options.map((option): [string, OptionState] => {
        if (answer === null) return [option.code, 'idle'];
        if (option.code === country.code) return [option.code, 'correct'];
        return [option.code, option.code === answer ? 'wrong' : 'dimmed'];
      }),
    );
  });

  protected choose(code: string): void {
    if (this.quiz.isAnswered()) return;
    this.quiz.choose(code);
    // Le bouton cliqué ne disparaît pas, mais l'action utile est désormais « suivant » : le clavier y va directement.
    afterNextRender(() => this.nextButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected next(): void {
    this.quiz.next();
    // « Suivant » disparaît avec la question : le focus reprend sur la première proposition.
    afterNextRender(() => this.optionButtons()[0]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
