import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { FdBadge, FdCard } from 'fuda';
import { Country } from '../data/country';
import { countryName } from '../data/country-name';

/** Une anecdote ou un bout d'histoire sur le drapeau. Le parent ne l'affiche qu'une fois la question répondue. */
@Component({
  selector: 'app-fun-fact',
  imports: [FdBadge, FdCard],
  templateUrl: './fun-fact.html',
  styleUrl: './fun-fact.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-fun-fact' },
})
export class FunFact {
  readonly country = input.required<Country>();

  protected readonly name = computed(() => countryName(this.country().code));
}
