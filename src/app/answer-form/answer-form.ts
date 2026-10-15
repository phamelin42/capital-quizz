import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FdButton, FdIcon, FdTextField } from 'fuda';
import { QuizService } from '../quiz/quiz.service';

/** Le champ où le joueur tape la capitale, « Je ne sais pas », le verdict (annoncé) et le bouton pour passer à la suivante. */
@Component({
  selector: 'app-answer-form',
  imports: [FdButton, FdIcon, FdTextField],
  templateUrl: './answer-form.html',
  styleUrl: './answer-form.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-answer-form' },
})
export class AnswerForm {
  protected readonly quiz = inject(QuizService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly nextButton = viewChild('nextBtn', { read: ElementRef<HTMLButtonElement> });

  protected readonly text = signal('');
  protected readonly canSubmit = computed(() => this.text().trim().length > 0);
  protected readonly wrong = computed(() => this.quiz.isAnswered() && !this.quiz.isCorrect());
  protected readonly capital = computed(() => this.quiz.question().place.capital);

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.canSubmit() || this.quiz.isAnswered()) return;
    this.quiz.submit(this.text());
    this.focusNext();
  }

  protected giveUp(): void {
    if (this.quiz.isAnswered()) return;
    this.quiz.giveUp();
    this.focusNext();
  }

  protected next(): void {
    this.quiz.next();
    this.text.set('');
    // « Suivant » disparaît avec la question : le focus reprend sur le champ de réponse.
    this.focusField();
  }

  /** Remet le focus dans le champ, une fois la nouvelle question affichée (après « suivant » ou un changement de mode). */
  focusField(): void {
    this.text.set('');
    afterNextRender(() => this.host.nativeElement.querySelector('input')?.focus(), {
      injector: this.injector,
    });
  }

  /** Le champ se verrouille après la réponse : l'action utile est désormais « suivant », où va le clavier. */
  private focusNext(): void {
    afterNextRender(() => this.nextButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
