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
