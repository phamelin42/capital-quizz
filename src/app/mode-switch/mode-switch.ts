import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { FdButton } from 'fuda';
import { Mode } from '../data/place';

/** Choix du jeu : les capitales du monde ou celles des états des États-Unis. */
@Component({
  selector: 'app-mode-switch',
  imports: [FdButton],
  templateUrl: './mode-switch.html',
  styleUrl: './mode-switch.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-mode-switch' },
})
export class ModeSwitch {
  readonly mode = input.required<Mode>();
  readonly modeChange = output<Mode>();

  protected readonly modes: readonly { value: Mode; label: string }[] = [
    { value: 'world', label: 'Monde' },
    { value: 'us', label: 'États-Unis' },
  ];
}
