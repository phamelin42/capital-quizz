import { Component, computed, inject, viewChild, ViewEncapsulation } from '@angular/core';
import { FdBadge, FdSwitch, FdThemeService } from 'fuda';
import { AnswerForm } from './answer-form/answer-form';
import { Mode } from './data/place';
import { FunFact } from './fun-fact/fun-fact';
import { MapPanel } from './map-panel/map-panel';
import { ModeSwitch } from './mode-switch/mode-switch';
import { PlaceCard } from './place-card/place-card';
import { QuizService } from './quiz/quiz.service';
import { SiteFooter } from './site-footer/site-footer';

@Component({
  selector: 'app-root',
  imports: [AnswerForm, FdBadge, FdSwitch, FunFact, MapPanel, ModeSwitch, PlaceCard, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class App {
  protected readonly quiz = inject(QuizService);
  private readonly themeService = inject(FdThemeService);
  private readonly form = viewChild.required(AnswerForm);

  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected setDark(dark: boolean): void {
    this.themeService.set(dark ? 'dark' : 'light');
  }

  /** Change de jeu, puis remet le focus dans le champ de réponse de la nouvelle question. */
  protected setMode(mode: Mode): void {
    if (mode === this.quiz.mode()) return;
    this.quiz.setMode(mode);
    this.form().focusField();
  }
}
