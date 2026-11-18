# FoodFest — Organização de Feiras Gastronômicas

Aplicação Angular para gerenciar estabelecimentos participantes e apresentar os sabores da feira ao público.

## Executar

Use a pasta principal do repositório:

```powershell
cd D:\FACULDADE\Fontes\FoodFest
npm ci
npm start
```

Abra [http://localhost:4200](http://localhost:4200). É necessário Node.js compatível com Angular 21 e acesso à internet para consultar o Firebase.

## Páginas e funcionalidades

- **Início:** contagens reais de estabelecimentos, participantes ativos e especialidades; carrossel de até dez barracas ativas.
- **Barracas:** busca por nome, responsável, especialidade e localização; filtro de participação e ordenação por nome ou preço.
- **Detalhes:** informações completas, preço em reais, participação e link para telefonar.
- **Admin:** resumo da feira, busca e filtro; cadastro, edição, exclusão com confirmação e ativação/desativação de participação.
- **Formulário:** todos os campos do model, validações e tratamento de carregamento, sucesso e falha.
- **Sobre:** apresentação do projeto e orientações para visitantes e organizadores.

As páginas funcionam em telas pequenas e grandes. Falhas de rede e resultados vazios têm mensagens próprias e opção de repetir a consulta.

## Model

```typescript
export interface Barraca {
  id: number;
  nome: string;
  responsavel: string;
  especialidade: string;
  localizacao: string;
  precoMedio: number;
  telefone: string;
  ativa: boolean;
}
```

O ID é gerenciado pelo serviço. Não é necessário digitá-lo no formulário.
O preço aceita zero e valores com até duas casas decimais. O telefone aceita de 10 a 13 dígitos, com DDD e código de país opcional. A participação pode ser ativa ou inativa.

## Persistência

O projeto utiliza o Firebase Realtime Database já configurado em
`src/app/core/services/barraca.service.ts`, na coleção `barracas`.

O model usa ID numérico, enquanto o serviço mantém internamente o vínculo com a chave do Firebase. Novos registros salvam o ID numérico junto aos dados. Registros antigos sem esse campo recebem um ID numérico estável durante a leitura, sem alteração do banco; links antigos com a chave do Firebase também continuam aceitos. Na edição, o ID é preservado.

A ativação/desativação usa PATCH apenas no campo `ativa`. O cadastro, a edição e a exclusão persistem no Firebase. As permissões para essas operações são as configuradas nesse banco.

## Verificação

```powershell
npm test -- --watch=false
npm run build
```

Os testes usam respostas simuladas do Firebase e não gravam nem excluem dados reais. Cobrem os fluxos de manutenção, compatibilidade de IDs, filtros, participação, carregamento e falhas de rede.

O build é gerado em `dist/FoodFest`. Para executar a versão compilada com SSR:

```powershell
npm run serve:ssr:FoodFest
```

As páginas públicas consultam os dados durante a renderização no servidor. A administração é renderizada no navegador para buscar sempre os registros atuais; a página Sobre é pré-renderizada.
