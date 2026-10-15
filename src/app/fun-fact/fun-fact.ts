import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { FdBadge, FdCard } from 'fuda';
import { Mode, Place } from '../data/place';
import { placeName } from '../data/us-state-name';

/** Une anecdote sur la capitale. Le parent ne l'affiche qu'une fois la question répondue. */
@Component({
  selector: 'app-fun-fact',
  imports: [FdBadge, FdCard],
  templateUrl: './fun-fact.html',
  styleUrl: './fun-fact.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-fun-fact' },
})
export class FunFact {
  readonly place = input.required<Place>();
  readonly mode = input<Mode>('world');

  protected readonly region = computed(() => placeName(this.mode(), this.place().code));
}
