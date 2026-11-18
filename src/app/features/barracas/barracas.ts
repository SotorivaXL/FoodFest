import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { filtrarBarracas, Ordenacao, Participacao } from '../../core/utils/barracas';
import { BarracaCard } from '../../shared/components/barraca-card/barraca-card';

@Component({
  selector: 'app-barracas',
  imports: [FormsModule, BarracaCard],
  templateUrl: './barracas.html',
  styleUrl: './barracas.css',
})
export class Barracas implements OnInit {
  private service = inject(BarracasService);
  private destroyRef = inject(DestroyRef);
  barracas = signal<Barraca[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  busca = signal('');
  participacao = signal<Participacao>('ativas');
  ordem = signal<Ordenacao>('nome');
  filtradas = computed(() =>
    filtrarBarracas(this.barracas(), this.busca(), this.participacao(), this.ordem()),
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
          this.errorMessage.set(
            'Não foi possível carregar as barracas. Confira sua conexão e tente novamente.',
          );
          this.loading.set(false);
        },
      });
  }
  limparFiltros(): void {
    this.busca.set('');
    this.participacao.set('ativas');
    this.ordem.set('nome');
  }
}
