import { AsyncPipe, CurrencyPipe } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { map, switchMap } from "rxjs";
import { BarracasService } from "../../core/services/barraca.service";

@Component({
  selector: "app-detalhe-barraca",
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: "./detalhe-barraca.html",
  styleUrl: "./detalhe-barraca.css",
})
export class DetalheBarraca {
  readonly barraca$;

  constructor(route: ActivatedRoute, barracasService: BarracasService) {
    this.barraca$ = route.paramMap.pipe(
      map((parametros) => Number(parametros.get("id"))),
      switchMap((id) => barracasService.buscarPorId(id)),
    );
  }
}
