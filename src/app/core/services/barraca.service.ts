import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable, of, switchMap, throwError, timeout } from 'rxjs';
import { Barraca } from '../models/barraca.model';

type FirebaseBarraca = Omit<Barraca, 'id'> & { id?: unknown };

export class BarracaNaoEncontradaError extends Error {
  constructor() {
    super('Barraca não encontrada.');
  }
}

@Injectable({ providedIn: 'root' })
export class BarracasService {
  private http = inject(HttpClient);
  private apiUrl = 'https://foodfest-111a6-default-rtdb.firebaseio.com/barracas';
  // A chave do Firebase fica separada do ID numérico exigido pelo model.
  private chaves = new Map<number, string>();

  getAll(): Observable<Barraca[]> {
    return this.http.get<Record<string, FirebaseBarraca | null> | null>(this.apiUrl + '.json').pipe(
      timeout(15000),
      map((response) => {
        const chaves = new Map<number, string>();
        const barracas: Barraca[] = [];
        for (const [chave, dados] of Object.entries(response ?? {})) {
          if (!dados) continue;
          const barraca = this.fromFirebase(chave, dados);
          if (chaves.has(barraca.id)) {
            throw new Error('Há IDs de barracas duplicados no banco de dados.');
          }
          chaves.set(barraca.id, chave);
          barracas.push(barraca);
        }
        this.chaves = chaves;
        return barracas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      }),
    );
  }

  getById(id: number | string): Observable<Barraca> {
    // Links antigos com a chave do Firebase continuam funcionando.
    if (typeof id === 'string' && !/^\d+$/.test(id)) {
      if (!/^[\w-]+$/.test(id)) return throwError(() => new BarracaNaoEncontradaError());
      return this.read(id);
    }
    return this.resolveKey(Number(id)).pipe(switchMap((chave) => this.read(chave)));
  }

  create(dados: Omit<Barraca, 'id'>): Observable<Barraca> {
    return defer(() => {
      let id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      while (this.chaves.has(id)) id++;
      const barraca: Barraca = { ...dados, id };
      return this.http.post<{ name: string }>(this.apiUrl + '.json', barraca).pipe(
        timeout(15000),
        map((response) => {
          this.chaves.set(id, response.name);
          return barraca;
        }),
      );
    });
  }

  update(id: number, dados: Omit<Barraca, 'id'>): Observable<Barraca> {
    return this.resolveKey(id).pipe(
      switchMap((chave) =>
        this.http
          .put<Barraca>(this.apiUrl + '/' + chave + '.json', { ...dados, id })
          .pipe(timeout(15000)),
      ),
      map(() => ({ ...dados, id })),
    );
  }

  setAtiva(id: number, ativa: boolean): Observable<void> {
    return this.resolveKey(id).pipe(
      switchMap((chave) =>
        this.http.patch(this.apiUrl + '/' + chave + '.json', { ativa }).pipe(timeout(15000)),
      ),
      map(() => undefined),
    );
  }

  delete(id: number): Observable<void> {
    return this.resolveKey(id).pipe(
      switchMap((chave) =>
        this.http.delete<void>(this.apiUrl + '/' + chave + '.json').pipe(timeout(15000)),
      ),
      map(() => {
        this.chaves.delete(id);
      }),
    );
  }

  private read(chave: string): Observable<Barraca> {
    return this.http.get<FirebaseBarraca | null>(this.apiUrl + '/' + chave + '.json').pipe(
      timeout(15000),
      map((dados) => {
        if (!dados) throw new BarracaNaoEncontradaError();
        const barraca = this.fromFirebase(chave, dados);
        this.chaves.set(barraca.id, chave);
        return barraca;
      }),
    );
  }

  private resolveKey(id: number): Observable<string> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      return throwError(() => new BarracaNaoEncontradaError());
    }
    const chave = this.chaves.get(id);
    if (chave) return of(chave);
    return this.getAll().pipe(
      map(() => {
        const encontrada = this.chaves.get(id);
        if (!encontrada) throw new BarracaNaoEncontradaError();
        return encontrada;
      }),
    );
  }

  private fromFirebase(chave: string, dados: FirebaseBarraca): Barraca {
    const id =
      typeof dados.id === 'number' && Number.isSafeInteger(dados.id) && dados.id > 0
        ? dados.id
        : /^\d+$/.test(chave) && Number.isSafeInteger(Number(chave)) && Number(chave) > 0
          ? Number(chave)
          : this.legacyId(chave);
    return { ...dados, id };
  }

  // Hash estável de 53 bits para registros antigos sem ID numérico.
  // A leitura não altera os dados salvos nem troca suas chaves.
  private legacyId(chave: string): number {
    let a = 0xdeadbeef,
      b = 0x41c6ce57;
    for (let i = 0; i < chave.length; i++) {
      a = Math.imul(a ^ chave.charCodeAt(i), 2654435761);
      b = Math.imul(b ^ chave.charCodeAt(i), 1597334677);
    }
    a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
    b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
    return 4294967296 * (b & 2097151) + (a >>> 0) || 1;
  }
}
