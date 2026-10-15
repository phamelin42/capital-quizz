import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FdCard } from 'fuda';
import { Country } from '../data/country';
import { countryName } from '../data/country-name';
import { mapUrl } from './map-url';

/**
 * Cadre en bas à droite : le pays sur Google Maps. Le parent ne l'affiche qu'une fois la question
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
  readonly country = input.required<Country>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly name = computed(() => countryName(this.country().code));
  /** L'URL est construite uniquement à partir de nos données (`countryName`), donc sûre à approuver. */
  protected readonly src = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl(this.name())),
  );
}
