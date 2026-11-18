import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { Barracas } from './barracas';
registerLocaleData(localePt);
const base: Barraca = {
  id: 42,
  nome: 'Café da Praça',
  responsavel: 'Ana',
  especialidade: 'Cafés',
  localizacao: 'Setor A',
  precoMedio: 10,
  telefone: '(46) 99999-1234',
  ativa: true,
};

describe('Listagem pública', () => {
  let fixture: ComponentFixture<Barracas>;
  afterEach(() => fixture?.destroy());
  async function setup(getAll: ReturnType<typeof vi.fn>) {
    await TestBed.configureTestingModule({
      imports: [Barracas],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: BarracasService, useValue: { getAll } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Barracas);
    fixture.detectChanges();
  }
  it('exibe participantes ativos e permite consultar os inativos pelo filtro', async () => {
    await setup(
      vi.fn().mockReturnValue(of([base, { ...base, id: 43, nome: 'Doces da Ana', ativa: false }])),
    );
    expect(fixture.componentInstance.filtradas()).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('app-barraca-card')).toHaveLength(1);
    fixture.componentInstance.participacao.set('todas');
    fixture.componentInstance.busca.set('doces');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Doces da Ana');
    expect(fixture.nativeElement.textContent).toContain('Participação inativa');
  });
  it('informa lista vazia sem apresentar erro de conexão', async () => {
    await setup(vi.fn().mockReturnValue(of([])));
    expect(fixture.nativeElement.textContent).toContain('A feira está ganhando forma');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
  it('apresenta falha de rede e permite tentar novamente', async () => {
    const getAll = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValue(of([base]));
    await setup(getAll);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.componentInstance.loadBarracas();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(base.nome);
  });
});
