import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { FdCard } from 'fuda';
import { Country } from '../data/country';
import { countryName } from '../data/country-name';

/** Le drapeau à deviner. Tant qu'il n'est pas répondu, son texte alternatif ne donne pas le nom du pays. */
@Component({
  selector: 'app-flag-card',
  imports: [FdCard],
  templateUrl: './flag-card.html',
  styleUrl: './flag-card.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-flag-card' },
})
export class FlagCard {
  readonly country = input.required<Country>();
  readonly revealed = input(false);

  protected readonly src = computed(() => `flags/4x3/${this.country().code}.svg`);
  protected readonly alt = computed(() =>
    this.revealed() ? `Drapeau : ${countryName(this.country().code)}` : 'Drapeau à deviner',
  );
}
