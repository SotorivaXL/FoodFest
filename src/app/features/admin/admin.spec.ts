import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { Admin } from './admin';

registerLocaleData(localePt);
const item: Barraca = {
  id: 42,
  nome: 'Sabores da Praça',
  responsavel: 'Ana',
  especialidade: 'Massas',
  localizacao: 'Setor A',
  precoMedio: 25.5,
  telefone: '(46) 99999-1234',
  ativa: true,
};

describe('Admin', () => {
  let fixture: ComponentFixture<Admin>;
  let service: {
    getAll: ReturnType<typeof vi.fn>;
    setAtiva: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {
    service = {
      getAll: vi.fn().mockReturnValue(of([item])),
      setAtiva: vi.fn().mockReturnValue(of(undefined)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: BarracasService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Admin);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('carrega a lista e mostra os dados e o preço em reais', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Sabores da Praça');
    expect(fixture.nativeElement.textContent).toContain('25,50');
    expect(fixture.componentInstance.ativas()).toBe(1);
  });
  it('altera a participação e atualiza os filtros sem recarregar a página', () => {
    const component = fixture.componentInstance;
    component.alterarParticipacao(item);
    expect(service.setAtiva).toHaveBeenCalledWith(42, false);
    expect(component.barracas()[0].ativa).toBe(false);
    expect(component.ativas()).toBe(0);
    component.participacao.set('ativas');
    expect(component.filtradas()).toHaveLength(0);
  });
  it('preserva a barraca quando uma alteração falha', () => {
    service.setAtiva.mockReturnValue(throwError(() => new Error('offline')));
    fixture.componentInstance.alterarParticipacao(item);
    expect(fixture.componentInstance.barracas()[0].ativa).toBe(true);
    expect(fixture.componentInstance.pendingId()).toBeNull();
    expect(fixture.componentInstance.errorMessage()).toContain('Não foi possível');
  });
  it('exige confirmação antes de excluir e não duplica operações pendentes', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const component = fixture.componentInstance;
    component.remove(item);
    expect(service.delete).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    const response = new Subject<void>();
    service.delete.mockReturnValue(response);
    component.remove(item);
    component.remove(item);
    component.alterarParticipacao(item);
    expect(service.delete).toHaveBeenCalledTimes(1);
    expect(service.setAtiva).not.toHaveBeenCalled();
    response.next();
    expect(component.barracas()).toEqual([]);
    expect(component.pendingId()).toBeNull();
  });
});
