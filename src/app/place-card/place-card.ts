import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { FdCard } from 'fuda';
import { Mode, Place } from '../data/place';
import { placeOf } from '../data/place-of';
import { photoSrc } from './photo-src';

/**
 * La question (« Quelle est la capitale de la Hongrie ? ») et la photo d'un lieu emblématique de la capitale.
 * Tant que la question n'est pas répondue, le texte alternatif de la photo ne nomme ni la capitale ni le monument.
 */
@Component({
  selector: 'app-place-card',
  imports: [FdCard],
  templateUrl: './place-card.html',
  styleUrl: './place-card.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-place-card' },
})
export class PlaceCard {
  readonly place = input.required<Place>();
  readonly mode = input<Mode>('world');
  readonly revealed = input(false);

  protected readonly question = computed(
    () => `Quelle est la capitale ${placeOf(this.mode(), this.place().code)} ?`,
  );
  protected readonly src = computed(() => photoSrc(this.mode(), this.place().code));
  protected readonly alt = computed(() =>
    this.revealed() ? `${this.place().landmark}, ${this.place().capital}` : 'Photo de la capitale',
  );
}
