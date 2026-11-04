import { Routes } from "@angular/router";
export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./features/home/home").then((m) => m.Home),
    title: "Início | FoodFest",
  },
  {
    path: "sobre",
    loadComponent: () => import("./features/sobre/sobre").then((m) => m.Sobre),
    title: "Sobre | FoodFest",
  },
  {
    path: "barracas",
    loadComponent: () =>
      import("./features/barracas/barracas").then((m) => m.Barracas),
    title: "Barracas | FoodFest",
  },
  {
    path: "barracas/:id",
    loadComponent: () =>
      import("./features/detalhe-barraca/detalhe-barraca").then(
        (m) => m.DetalheBarraca,
      ),
    title: "Detalhes da barraca | FoodFest",
  },
  {
    path: "admin",
    loadComponent: () => import("./features/admin/admin").then((m) => m.Admin),
    title: "Admin | FoodFest",
  },
  {
    path: "admin/novo",
    loadComponent: () =>
      import("./features/manutencao-barraca/manutencao-barraca").then(
        (m) => m.ManutencaoBarraca,
      ),
    title: "Nova barraca | FoodFest",
  },
  {
    path: "admin/editar/:id",
    loadComponent: () =>
      import("./features/manutencao-barraca/manutencao-barraca").then(
        (m) => m.ManutencaoBarraca,
      ),
    title: "Editar barraca | FoodFest",
  },
  { path: "**", redirectTo: "" },
];
