import { Barraca } from '../models/barraca.model';

export type Participacao = 'todas' | 'ativas' | 'inativas';
export type Ordenacao = 'nome' | 'menor-preco' | 'maior-preco';

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function filtrarBarracas(
  barracas: Barraca[],
  busca: string,
  participacao: Participacao,
  ordem: Ordenacao = 'nome',
): Barraca[] {
  const termos = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  return barracas
    .filter((barraca) => {
      if (participacao === 'ativas' && !barraca.ativa) return false;
      if (participacao === 'inativas' && barraca.ativa) return false;
      const texto = normalizarTexto(
        [barraca.nome, barraca.responsavel, barraca.especialidade, barraca.localizacao].join(' '),
      );
      return termos.every((termo) => texto.includes(termo));
    })
    .sort((a, b) => {
      if (ordem === 'menor-preco')
        return a.precoMedio - b.precoMedio || a.nome.localeCompare(b.nome, 'pt-BR');
      if (ordem === 'maior-preco')
        return b.precoMedio - a.precoMedio || a.nome.localeCompare(b.nome, 'pt-BR');
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

export function telefoneHref(telefone: string): string {
  return 'tel:' + telefone.replace(/[^\d+]/g, '');
}
