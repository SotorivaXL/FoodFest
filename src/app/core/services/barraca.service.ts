import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { Barraca } from "../models/barraca.model";
import { HttpClient } from "@angular/common/http";

type FirebaseBarraca = Omit<Barraca, "id"> & { id?: unknown };

@Injectable({ providedIn: "root" })
export class BarracasService {
  private http = inject(HttpClient);
  private apiUrl = "https://foodfest-111a6-default-rtdb.firebaseio.com/barracas";
  private sufix = ".json";

  getAll(): Observable<Barraca[]> {
    return this.http
      .get<Record<string, FirebaseBarraca> | null>(this.apiUrl + this.sufix)
      .pipe(
        map((response) => {
          if (!response) {
            return [];
          }
          return Object.entries(response).map(([id, barraca]) => {
            const { id: _ignoredId, ...barracaData } = barraca;
            return { id, ...barracaData };
          });
        }),
      );
  }

  getById(id: string): Observable<Barraca> {
    return this.http
      .get<FirebaseBarraca | null>(`${this.apiUrl}/${id}${this.sufix}`)
      .pipe(
        map((response) => {
          if (!response) {
            throw new Error("Barraca não encontrada!");
          }
          const { id: _ignoredId, ...barracaData } = response;
          return { id, ...barracaData };
        }),
      );
  }

  create(barraca: Omit<Barraca, "id">): Observable<Barraca> {
    return this.http
      .post<{ name: string }>(this.apiUrl + this.sufix, barraca)
      .pipe(
        map((response) => ({
          id: response.name,
          ...barraca,
        })),
      );
  }

  update(id: string, barraca: Omit<Barraca, "id">): Observable<Barraca> {
    return this.http
      .put<Omit<Barraca, "id">>(`${this.apiUrl}/${id}${this.sufix}`, barraca)
      .pipe(
        map((response) => ({
          ...response,
          id,
        })),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}${this.sufix}`);
  }
}

