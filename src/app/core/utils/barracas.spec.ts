import { describe, expect, it } from 'vitest';
import { Barraca } from '../models/barraca.model';
import { filtrarBarracas, telefoneHref } from './barracas';

const items: Barraca[] = [
  {
    id: 1,
    nome: 'Café da Praça',
    responsavel: 'João',
    especialidade: 'Cafés',
    localizacao: 'Setor A',
    precoMedio: 12,
    telefone: '46999991234',
    ativa: true,
  },
  {
    id: 2,
    nome: 'Massas da Ana',
    responsavel: 'Ana',
    especialidade: 'Italiana',
    localizacao: 'Setor B',
    precoMedio: 30,
    telefone: '46999991235',
    ativa: false,
  },
  {
    id: 3,
    nome: 'Doce Encontro',
    responsavel: 'Maria',
    especialidade: 'Doces',
    localizacao: 'Praça',
    precoMedio: 8,
    telefone: '46999991236',
    ativa: true,
  },
];
describe('Busca e filtros das barracas', () => {
  it('busca sem diferenciar acentos e combina termos de campos diferentes', () => {
    expect(filtrarBarracas(items, '  CAFE   JOAO ', 'todas').map((b) => b.id)).toEqual([1]);
    expect(filtrarBarracas(items, 'setor b', 'todas').map((b) => b.id)).toEqual([2]);
  });
  it('filtra participação e ordena por preço sem alterar a lista original', () => {
    expect(filtrarBarracas(items, '', 'ativas', 'menor-preco').map((b) => b.id)).toEqual([3, 1]);
    expect(filtrarBarracas(items, '', 'inativas').map((b) => b.id)).toEqual([2]);
    expect(filtrarBarracas(items, '', 'todas', 'maior-preco').map((b) => b.id)).toEqual([2, 1, 3]);
    expect(items.map((b) => b.id)).toEqual([1, 2, 3]);
  });
  it('monta um link de telefone utilizável', () => {
    expect(telefoneHref('+55 (46) 99999-1234')).toBe('tel:+5546999991234');
  });
});
