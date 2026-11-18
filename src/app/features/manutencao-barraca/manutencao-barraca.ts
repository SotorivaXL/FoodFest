import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timer } from 'rxjs';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';

function validarTelefone(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  const tamanho = valor.replace(/\D/g, '').length;
  return /^\+?[\d\s().-]+$/.test(valor) && tamanho >= 10 && tamanho <= 13
    ? null
    : { telefone: true };
}

function validarPreco(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  return typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor >= 0 &&
    Math.abs(valor * 100 - Math.round(valor * 100)) < 0.000001
    ? null
    : { preco: true };
}

@Component({
  selector: 'app-manutencao-barraca',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './manutencao-barraca.html',
  styleUrl: './manutencao-barraca.css',
})
export class ManutencaoBarraca implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(BarracasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  editingId: number | null = null;
  editing = false;
  requestedId: string | null = null;
  loading = false;
  loadingData = false;
  loadError = false;
  successMessage = '';
  errorMessage = '';

  form = this.fb.nonNullable.group({
    nome: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/\S/),
      ],
    ],
    responsavel: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    especialidade: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    localizacao: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    precoMedio: [0, [Validators.required, validarPreco]],
    telefone: ['', [Validators.required, validarTelefone]],
    ativa: [true],
  });

  ngOnInit(): void {
    this.requestedId =
      this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('id');
    this.editing = this.requestedId !== null;
    if (this.requestedId !== null) this.loadBarraca(this.requestedId);
  }

  loadBarraca(id: number | string): void {
    this.loadingData = true;
    this.loadError = false;
    this.errorMessage = '';
    this.service
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (barraca) => {
          this.editingId = barraca.id;
          const { id: _id, ...dados } = barraca;
          this.form.setValue(dados);
          this.loadingData = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage =
            'Não foi possível carregar a barraca. Verifique o endereço e sua conexão.';
          this.loadingData = false;
          this.loadError = true;
          this.cdr.markForCheck();
        },
      });
  }

  submit(): void {
    if (
      this.loading ||
      this.loadingData ||
      this.loadError ||
      this.successMessage ||
      (this.editing && this.editingId === null)
    )
      return;
    this.errorMessage = '';
    const valor = this.form.getRawValue();
    this.form.patchValue({
      nome: valor.nome.trim(),
      responsavel: valor.responsavel.trim(),
      especialidade: valor.especialidade.trim(),
      localizacao: valor.localizacao.trim(),
      telefone: valor.telefone.trim(),
    });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revise os campos indicados antes de salvar.';
      return;
    }
    this.loading = true;
    const dados: Omit<Barraca, 'id'> = this.form.getRawValue();
    const request$ =
      this.editingId !== null
        ? this.service.update(this.editingId, dados)
        : this.service.create(dados);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.editing
          ? 'Barraca atualizada com sucesso!'
          : 'Barraca criada com sucesso!';
        this.cdr.markForCheck();
        timer(1000)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            void this.router.navigate(['/admin']);
          });
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.editing
          ? 'Erro ao atualizar a barraca. Seus dados foram mantidos; tente novamente.'
          : 'Erro ao criar a barraca. Seus dados foram mantidos; tente novamente.';
        this.cdr.markForCheck();
      },
    });
  }
}
