import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Barraca } from '../../core/models/barraca.model';
import { BarracaNaoEncontradaError, BarracasService } from '../../core/services/barraca.service';
import { DetalheBarraca } from './detalhe-barraca';

registerLocaleData(localePt);
const item: Barraca = {
  id: 42,
  nome: 'Sabores da Praça',
  responsavel: 'Ana',
  especialidade: 'Massas',
  localizacao: 'Setor A',
  precoMedio: 25.5,
  telefone: '(46) 99999-1234',
  ativa: false,
};

describe('Detalhes da barraca', () => {
  let fixture: ComponentFixture<DetalheBarraca>;
  afterEach(() => fixture?.destroy());
  async function setup(getById: ReturnType<typeof vi.fn>) {
    await TestBed.configureTestingModule({
      imports: [DetalheBarraca],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: BarracasService, useValue: { getById } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '42' })) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DetalheBarraca);
    fixture.detectChanges();
  }
  it('mostra carregamento antes de receber a resposta, sem exibir um falso 404', async () => {
    const response = new Subject<Barraca>();
    await setup(vi.fn().mockReturnValue(response));
    expect(fixture.nativeElement.textContent).toContain('Carregando');
    expect(fixture.nativeElement.textContent).not.toContain('não encontrada');
    response.next(item);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(item.nome);
    expect(fixture.nativeElement.textContent).toContain('participação inativa');
    expect(fixture.nativeElement.querySelector('a[href="tel:46999991234"]')).toBeTruthy();
  });
  it('distingue barraca removida de falha na conexão', async () => {
    await setup(vi.fn().mockReturnValue(throwError(() => new BarracaNaoEncontradaError())));
    expect(fixture.nativeElement.textContent).toContain('Barraca não encontrada');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
  it('permite repetir a consulta após erro de rede', async () => {
    const getById = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValue(of(item));
    await setup(getById);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.componentInstance.retry();
    fixture.detectChanges();
    expect(getById).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain(item.nome);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
