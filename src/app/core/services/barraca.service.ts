import { inject, Injectable } from "@angular/core";
import { map, Observable, of } from "rxjs";
import { Barraca } from "../models/barraca.model";
import { HttpClient } from "@angular/common/http";
import { response } from "express";

type FirebaseFood = Omit<Barraca, "id"> & {id?: unknown};

@Injectable({ providedIn: "root" })
export class BarracasService {
  
  private http = inject(HttpClient);
  private apiUrl = "https://foodfest-111a6-default-rtdb.firebaseio.com/barracas";
  private sufix = ".json";

  getAll(): Observable<Barraca[]> {
    return this.http
    .get<Record<string, FirebaseFood> | null>(this.apiUrl + this.sufix)
    .pipe(
      map((response) => {
        if (!response) {
          return [];
        }
        return Object.entries(response).map([id, barraca]) => {
          const { id: _ignoredId, ...barracaData } = barraca;
          return { id, ...barracaData } as Barraca;
        }
      })
    );
  }

  getById(id: string): Observable<Barraca> {
    return this.http
    .get<FirebaseFood | null>(`${this.apiUrl}/${id}${this.sufix}`)
    .pipe(
      map((response) => {
        if (!response) {
          throw new Error("Barraca não encontrada!");
        }
        const {id: _ignoredId, ...barracaData } = response;
        return { id, ...barracaData };
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}${this.sufix}`);
  }
}
