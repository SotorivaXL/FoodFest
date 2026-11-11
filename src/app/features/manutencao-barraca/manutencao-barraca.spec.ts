import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Barraca } from '../../core/models/barraca.model';
import { BarracasService } from '../../core/services/barraca.service';
import { ManutencaoBarraca } from './manutencao-barraca';

describe('ManutencaoBarraca', () => {
  const dados: Omit<Barraca, 'id'> = {
    nome: 'Sabores da Feira',
    responsavel: 'Ana Silva',
    especialidade: 'Pastéis',
    localizacao: 'Praça central',
    precoMedio: 12.5,
    telefone: '(43) 99999-1234',
    ativa: false,
  };
  let fixture: ComponentFixture<ManutencaoBarraca>;
  let service: {
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getById: vi.fn().mockReturnValue(of({ id: 'b1', ...dados })),
      create: vi.fn().mockReturnValue(of({ id: 'b1', ...dados })),
      update: vi.fn().mockReturnValue(of({ id: 'b1', ...dados })),
    };
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
  });

  async function setup(pathId?: string, queryId?: string) {
    await TestBed.configureTestingModule({
      imports: [ManutencaoBarraca],
      providers: [
        provideRouter([]),
        { provide: BarracasService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(pathId ? { id: pathId } : {}),
              queryParamMap: convertToParamMap(queryId ? { id: queryId } : {}),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ManutencaoBarraca);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('cadastra todos os campos do formulário com preço numérico e ativa desmarcada', async () => {
    vi.useFakeTimers();
    await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const element: HTMLElement = fixture.nativeElement;
    for (const [campo, valor] of Object.entries(dados)) {
      const input = element.querySelector<HTMLInputElement>(`#${campo}`)!;
      expect(input).toBeTruthy();
      if (typeof valor === 'boolean') {
        input.checked = valor;
        input.dispatchEvent(new Event('change'));
      } else {
        input.value = String(valor);
        input.dispatchEvent(new Event('input'));
      }
    }
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(service.create).toHaveBeenCalledWith(dados);
    expect(service.update).not.toHaveBeenCalled();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('criada com sucesso');
    expect(element.querySelector('fieldset')?.disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it.each(['path', 'query'])(
    'carrega e atualiza uma barraca inativa usando ID de %s',
    async (origem) => {
      const component = await setup(
        origem === 'path' ? 'b1' : undefined,
        origem === 'query' ? 'b1' : undefined,
      );
      expect(service.getById).toHaveBeenCalledWith('b1');
      expect(component.form.getRawValue()).toEqual(dados);
      expect(fixture.nativeElement.querySelector('#ativa').checked).toBe(false);
      component.submit();
      expect(service.update).toHaveBeenCalledWith('b1', dados);
      expect(service.create).not.toHaveBeenCalled();
    },
  );

  it('impede envio com campos obrigatórios vazios, nome curto ou preço negativo', async () => {
    const component = await setup();
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Informe o telefone');
    component.form.setValue({ ...dados, nome: 'AB', precoMedio: -1 });
    component.submit();
    expect(component.form.controls.nome.invalid).toBe(true);
    expect(component.form.controls.precoMedio.invalid).toBe(true);
    expect(service.create).not.toHaveBeenCalled();
    component.form.patchValue({ nome: dados.nome, precoMedio: 0 });
    expect(component.form.valid).toBe(true);
  });

  it('bloqueia gravação após falha no carregamento e permite tentar carregar novamente', async () => {
    service.getById.mockReturnValueOnce(throwError(() => new Error('Falha na rede')));
    const component = await setup('b1');
    component.form.setValue(dados);
    component.submit();
    expect(service.update).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.loadError).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(service.getById).toHaveBeenCalledTimes(2);
  });

  it('evita envios duplicados e mantém os dados quando a gravação falha', async () => {
    const resposta = new Subject<Barraca>();
    service.create.mockReturnValue(resposta);
    const component = await setup();
    component.form.setValue(dados);
    component.submit();
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(component.loading).toBe(true);
    resposta.error(new Error('Falha na rede'));
    fixture.detectChanges();
    expect(component.loading).toBe(false);
    expect(component.form.getRawValue()).toEqual(dados);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Erro ao criar',
    );
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(false);
  });
});
