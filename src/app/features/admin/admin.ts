import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { filtrarBarracas, Participacao, telefoneHref } from '../../core/utils/barracas';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, FormsModule, CurrencyPipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private service = inject(BarracasService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  barracas = signal<Barraca[]>([]);
  loading = signal(true);
  loadError = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  pendingId = signal<number | null>(null);
  busca = signal('');
  participacao = signal<Participacao>('todas');
  ativas = computed(() => this.barracas().filter((b) => b.ativa).length);
  filtradas = computed(() => filtrarBarracas(this.barracas(), this.busca(), this.participacao()));
  telefoneHref = telefoneHref;

  ngOnInit(): void {
    this.loadBarracas();
  }
  loadBarracas(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (barracas) => {
          this.barracas.set(barracas);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set('Não foi possível carregar os estabelecimentos. Tente novamente.');
          this.loading.set(false);
        },
      });
  }
  edit(id: number): void {
    void this.router.navigate(['/admin/form', id]);
  }
  alterarParticipacao(barraca: Barraca): void {
    if (this.pendingId() !== null) return;
    this.iniciarAcao(barraca.id);
    this.service
      .setAtiva(barraca.id, !barraca.ativa)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.barracas.update((items) =>
            items.map((b) => (b.id === barraca.id ? { ...b, ativa: !b.ativa } : b)),
          );
          this.pendingId.set(null);
          this.successMessage.set(
            'Participação de ' + barraca.nome + (barraca.ativa ? ' desativada.' : ' ativada.'),
          );
        },
        error: () => {
          this.pendingId.set(null);
          this.errorMessage.set('Não foi possível alterar a participação. Tente novamente.');
        },
      });
  }
  remove(barraca: Barraca): void {
    if (
      this.pendingId() !== null ||
      !confirm('Excluir a barraca "' + barraca.nome + '"? Esta ação não pode ser desfeita.')
    )
      return;
    this.iniciarAcao(barraca.id);
    this.service
      .delete(barraca.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.barracas.update((items) => items.filter((b) => b.id !== barraca.id));
          this.pendingId.set(null);
          this.successMessage.set('Barraca excluída com sucesso.');
        },
        error: () => {
          this.pendingId.set(null);
          this.errorMessage.set('Não foi possível excluir a barraca. Tente novamente.');
        },
      });
  }
  limparFiltros(): void {
    this.busca.set('');
    this.participacao.set('todas');
  }
  private iniciarAcao(id: number): void {
    this.pendingId.set(id);
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
