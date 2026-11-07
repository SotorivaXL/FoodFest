import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { BarracasService } from "../../core/services/barraca.service";
@Component({
  selector: "app-manutencao-barraca",
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: "./manutencao-barraca.html",
  styleUrl: "./manutencao-barraca.css",
})
export class ManutencaoBarraca {
  private fb = inject(FormBuilder);
  private barracaService = inject(BarracasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  editingId: string | null = null;
  loading = false;
  loadingData = false;
  successMessage = "";
  errorMessage = "";

  form = this.fb.nonNullable.group({
    nome: ["", [Validators.required]],
    responsavel: ["", [Validators.required]],
    especialidade: ["", [Validators.required]],
    localizacao: ["", [Validators.required]],
    precoMedio: [0, [Validators.required]],
    telefone: ["", [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get("id");
    if (id) {
      this.editingId = id;
      this.loadBarraca(id);
    }
  }

  loadBarraca(id: string): void {
    this.loadingData = true;
    this.barracaService.getById(id).subscribe({
      next: (barraca) => {
        this.form.patchValue({
          nome: barraca.nome,
          responsavel: barraca.responsavel,
          especialidade: barraca.especialidade,
          localizacao: barraca.localizacao,
          precoMedio: barraca.precoMedio,
          telefone: barraca.telefone,
        });

        this.loadingData = false;
        },
        error: (error) => {
          this.errorMessage = "Erro ao carregar a barraca." + error.message;
          this.loadingData = false;
      }
    })
  }

  submit(): void {
    this.successMessage = "";
    this.errorMessage = "";
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formValue = this.form.getRawValue();
    const barracaData = {
      especialidade: formValue.especialidade,
    };
    if (this.editingId !== null) {
      
    }
  }
}
