import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Barraca } from '../../../core/models/barraca.model';

@Component({
  selector: 'app-barraca-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './barraca-card.html',
  styleUrl: './barraca-card.css',
})
export class BarracaCard {
  barraca = input.required<Barraca>();
}
