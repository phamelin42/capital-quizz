import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { FdCard } from 'fuda';
import { Mode, Place } from '../data/place';
import { photoSrc } from './photo-src';

/**
 * La capitale à deviner et la photo d'un lieu emblématique. Tant que la question n'est pas répondue,
 * ni le texte alternatif de la photo ni la question ne donnent le nom du pays ou de l'état.
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

  protected readonly question = computed(() =>
    this.mode() === 'us' ? 'Quel état a pour capitale' : 'Quel pays a pour capitale',
  );
  protected readonly src = computed(() => photoSrc(this.mode(), this.place().code));
  protected readonly alt = computed(() =>
    this.revealed() ? `${this.place().landmark}, ${this.place().capital}` : 'Lieu à deviner',
  );
}
