import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BarracasService } from '../../core/services/barraca.service';
import { Barraca } from '../../core/models/barraca.model';
import { timer } from 'rxjs';
@Component({
  selector: 'app-manutencao-barraca',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './manutencao-barraca.html',
  styleUrl: './manutencao-barraca.css',
})
export class ManutencaoBarraca implements OnInit {
  private fb = inject(FormBuilder);
  private barracaService = inject(BarracasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  editingId: string | null = null;
  loading = false;
  loadingData = false;
  loadError = false;
  successMessage = '';
  errorMessage = '';

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    responsavel: ['', [Validators.required]],
    especialidade: ['', [Validators.required]],
    localizacao: ['', [Validators.required]],
    precoMedio: [0, [Validators.required, Validators.min(0)]],
    telefone: ['', [Validators.required]],
    ativa: [true],
  });

  ngOnInit(): void {
    const id =
      this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.editingId = id;
      this.loadBarraca(id);
    }
  }

  loadBarraca(id: string): void {
    this.loadingData = true;
    this.loadError = false;
    this.errorMessage = '';
    this.barracaService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (barraca) => {
          this.form.patchValue({
            nome: barraca.nome,
            responsavel: barraca.responsavel,
            especialidade: barraca.especialidade,
            localizacao: barraca.localizacao,
            precoMedio: barraca.precoMedio,
            telefone: barraca.telefone,
            ativa: barraca.ativa,
          });

          this.loadingData = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Erro ao carregar a barraca. Tente novamente.';
          this.loadingData = false;
          this.loadError = true;
          this.cdr.markForCheck();
        },
      });
  }

  submit(): void {
    if (this.loading || this.loadingData || this.loadError || this.successMessage) {
      return;
    }
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const barracaData: Omit<Barraca, 'id'> = this.form.getRawValue();
    const editing = this.editingId !== null;
    const request$ =
      this.editingId !== null
        ? this.barracaService.update(this.editingId, barracaData)
        : this.barracaService.create(barracaData);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = editing
          ? 'Barraca atualizada com sucesso!'
          : 'Barraca criada com sucesso!';
        if (!editing) {
          this.form.reset();
        }
        this.cdr.markForCheck();
        timer(1000)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            void this.router.navigate(['/admin']);
          });
      },
      error: () => {
        this.loading = false;
        this.errorMessage = editing
          ? 'Erro ao atualizar a barraca. Tente novamente.'
          : 'Erro ao criar a barraca. Tente novamente.';
        this.cdr.markForCheck();
      },
    });
  }
}
