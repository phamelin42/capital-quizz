import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FdCard } from 'fuda';
import { Mode, Place } from '../data/place';
import { placeName } from '../data/us-state-name';
import { mapUrl } from './map-url';

/**
 * Cadre en bas à droite : la capitale sur Google Maps. Le parent ne l'affiche qu'une fois la question
 * répondue : l'iframe n'existe pas avant, donc on ne contacte pas Google et la carte ne donne pas la réponse.
 */
@Component({
  selector: 'app-map-panel',
  imports: [FdCard],
  templateUrl: './map-panel.html',
  styleUrl: './map-panel.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-map-panel' },
})
export class MapPanel {
  readonly place = input.required<Place>();
  readonly mode = input<Mode>('world');

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly region = computed(() => placeName(this.mode(), this.place().code));
  protected readonly label = computed(() => `${this.place().capital}, ${this.region()}`);
  /** L'URL est construite uniquement à partir de nos données (capitale et `placeName`), donc sûre à approuver. */
  protected readonly src = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl(this.place().capital, this.region())),
  );
}
