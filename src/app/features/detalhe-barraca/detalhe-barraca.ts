import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, of, startWith, Subject, switchMap } from 'rxjs';
import { Barraca } from '../../core/models/barraca.model';
import { BarracaNaoEncontradaError, BarracasService } from '../../core/services/barraca.service';
import { telefoneHref } from '../../core/utils/barracas';

@Component({
  selector: 'app-detalhe-barraca',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './detalhe-barraca.html',
  styleUrl: './detalhe-barraca.css',
})
export class DetalheBarraca implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(BarracasService);
  private destroyRef = inject(DestroyRef);
  private recarregar = new Subject<void>();
  barraca = signal<Barraca | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  telefoneHref = telefoneHref;

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.recarregar.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.loading.set(true);
          this.barraca.set(null);
          this.errorMessage.set('');
          return this.service.getById(params.get('id') ?? '').pipe(
            catchError((error: unknown) => {
              const notFound =
                error instanceof BarracaNaoEncontradaError ||
                (error instanceof HttpErrorResponse && error.status === 404);
              if (!notFound)
                this.errorMessage.set(
                  'Não foi possível carregar esta barraca. Confira sua conexão e tente novamente.',
                );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((barraca) => {
        this.barraca.set(barraca);
        this.loading.set(false);
      });
  }
  retry(): void {
    this.recarregar.next();
  }
}
