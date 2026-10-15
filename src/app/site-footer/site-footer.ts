import { Component, ViewEncapsulation } from '@angular/core';
import { FdLink } from 'fuda';

/** Pied de page : renvois vers le portfolio, le Flag Quizz et les crédits des photos. */
@Component({
  selector: 'app-site-footer',
  imports: [FdLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-site-footer' },
})
export class SiteFooter {}
