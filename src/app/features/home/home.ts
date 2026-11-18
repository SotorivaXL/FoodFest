import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { BarracaCard } from '../../shared/components/barraca-card/barraca-card';
import { FeiraVisual } from '../../shared/components/feira-visual/feira-visual';

@Component({
  selector: 'app-home',
  imports: [RouterLink, BarracaCard, FeiraVisual],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private service = inject(BarracasService);
  private destroyRef = inject(DestroyRef);
  barracas = signal<Barraca[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  ativas = computed(() => this.barracas().filter((b) => b.ativa));
  destaques = computed(() => this.ativas().slice(0, 10));
  especialidades = computed(
    () => new Set(this.ativas().map((b) => b.especialidade.trim().toLocaleLowerCase('pt-BR'))).size,
  );
  ngOnInit(): void {
    this.loadBarracas();
  }
  loadBarracas(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (barracas) => {
          this.barracas.set(barracas);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Não foi possível carregar os destaques da feira.');
          this.loading.set(false);
        },
      });
  }
  moverCarrossel(trilho: HTMLElement, direcao: number): void {
    trilho.scrollBy({ left: direcao * 334, behavior: 'smooth' });
  }
}
