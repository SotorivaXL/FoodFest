import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { BarracasService } from "../../core/services/barraca.service";
import { Barraca } from "../../core/models/barraca.model";
@Component({
  selector: "app-admin",
  imports: [RouterLink],
  templateUrl: "./admin.html",
  styleUrl: "./admin.css",
})

export class Admin {
  private barracaService = inject(BarracasService);
  private router = inject(Router);

  barracas: Barraca[] = [];
  loading = false;
  errorMessage = "";
  sucessMessage = "";

  loadBarracas(): void{
    this.loading = true;
    this.errorMessage = "";
    this.barracaService.getAll().subscribe({
      next: (response) => {
        this.barracas = response;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = "Erro ao carregar barracas";
        this.loading = false;
      },
    });
  }

  ngInit(): void {
    this.loadBarracas();
  }

  edit(id: string): void {
    this.router.navigate(["/admin/form"], {
      queryParams: { id },
    });
  }

  remove(id: string): void {
    const confirmDelete = confirm("Está certo disso?");
    if (!confirmDelete) {
        return;
    }

    this.barracaService.delete(id).subscribe({
      next: () => {
        this.sucessMessage = "Barraca removida com sucesso!";
        this.loadBarracas();
        setTimeout(() => {
          this.sucessMessage = "";
        }, 2000);
      },
      error: () => {
        this.errorMessage = "Erro ao remover barraca.";
      },
    });
  }
}
