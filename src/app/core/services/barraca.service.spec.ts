import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Barraca } from '../models/barraca.model';
import { BarracaNaoEncontradaError, BarracasService } from './barraca.service';

const api = 'https://foodfest-111a6-default-rtdb.firebaseio.com/barracas';
const dados: Omit<Barraca, 'id'> = {
  nome: 'Sabores da Praça',
  responsavel: 'Ana',
  especialidade: 'Massas',
  localizacao: 'Setor A',
  precoMedio: 25.5,
  telefone: '(46) 99999-1234',
  ativa: false,
};

describe('BarracasService', () => {
  let service: BarracasService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BarracasService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lê registros antigos e novos com IDs numéricos estáveis sem escrever no banco', () => {
    let primeiro = 0;
    service.getAll().subscribe((items) => {
      expect(items).toHaveLength(2);
      primeiro = items.find((b) => b.nome === dados.nome)!.id;
      expect(Number.isSafeInteger(primeiro)).toBe(true);
      expect(primeiro).toBeGreaterThan(0);
      expect(items.find((b) => b.nome === 'Outra')!.id).toBe(42);
      expect(items[1].ativa).toBe(false);
    });
    http.expectOne(api + '.json').flush({
      '-legado': dados,
      '-novo': { ...dados, id: 42, nome: 'Outra' },
      '-removido': null,
    });
    service.getAll().subscribe((items) => expect(items[0].id).toBe(primeiro));
    http.expectOne(api + '.json').flush({ '-legado': { ...dados, id: 'ignorar-id-antigo' } });
  });

  it('resolve acesso direto por ID numérico sem depender de uma visita à listagem', () => {
    service.getById(42).subscribe((item) => expect(item).toEqual({ ...dados, id: 42 }));
    http.expectOne(api + '.json').flush({ '-key42': { ...dados, id: 42 } });
    http.expectOne(api + '/-key42.json').flush({ ...dados, id: 42 });
  });

  it('mantém links antigos com chave Firebase e rejeita endereços inválidos', () => {
    service.getById('-antigo').subscribe((item) => expect(typeof item.id).toBe('number'));
    http.expectOne(api + '/-antigo.json').flush(dados);
    service
      .getById('../outro')
      .subscribe({ error: (error) => expect(error).toBeInstanceOf(BarracaNaoEncontradaError) });
  });

  it('trata lista vazia e ID inexistente sem criar cadastros', () => {
    service.getAll().subscribe((items) => expect(items).toEqual([]));
    http.expectOne(api + '.json').flush(null);
    service
      .getById(999)
      .subscribe({ error: (error) => expect(error).toBeInstanceOf(BarracaNaoEncontradaError) });
    http.expectOne(api + '.json').flush(null);
  });

  it('impede alterações quando dois registros usam o mesmo ID', () => {
    service
      .getAll()
      .subscribe({ error: (error: Error) => expect(error.message).toContain('duplicados') });
    http.expectOne(api + '.json').flush({ a: { ...dados, id: 42 }, b: { ...dados, id: 42 } });
  });

  it('cadastra, edita e exclui usando a chave do Firebase e preserva os campos completos', () => {
    let id = 0;
    service.create(dados).subscribe((item) => {
      id = item.id;
      expect(item.ativa).toBe(false);
    });
    const create = http.expectOne(api + '.json');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toMatchObject(dados);
    expect(Number.isSafeInteger(create.request.body.id)).toBe(true);
    create.flush({ name: '-novo' });
    service.update(id, { ...dados, precoMedio: 30 }).subscribe((item) => expect(item.id).toBe(id));
    const update = http.expectOne(api + '/-novo.json');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ ...dados, id, precoMedio: 30 });
    update.flush(update.request.body);
    service.delete(id).subscribe();
    const remove = http.expectOne(api + '/-novo.json');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });

  it('altera somente a participação sem sobrescrever os outros dados', () => {
    service.getAll().subscribe();
    http.expectOne(api + '.json').flush({ '-key42': { ...dados, id: 42 } });
    service.setAtiva(42, true).subscribe();
    const patch = http.expectOne(api + '/-key42.json');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ ativa: true });
    patch.flush({ ativa: true });
  });

  it('propaga falhas de acesso ao Firebase para as mensagens da interface', () => {
    service.getAll().subscribe({ error: (error) => expect(error.status).toBe(401) });
    http
      .expectOne(api + '.json')
      .flush({ error: 'Permission denied' }, { status: 401, statusText: 'Unauthorized' });
  });
});
