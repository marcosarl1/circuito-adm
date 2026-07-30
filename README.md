# Circuito ADM

Painel administrativo para gestão de eventos, publicação de postagens e sincronização de dados do Circuito. Construído com Angular e implantado na Vercel.

## Funcionalidades

- **Autenticacao** -- Login com sessão gerenciada via cookie HttpOnly. Middleware na Vercel protege todas as rotas exceto `/login`.
- **Eventos** -- CRUD completo com listagem paginada, busca por texto, formulário de criação/edição e sincronização com bucket externo.
- **Postagens** -- Publicação de conteúdo com upload de imagem, geração automática slug e validação de campos obrigatórios.
- **API Key sob demanda** -- Operações sensíveis disparam um modal para inserção de chave de API, enviada via header `x-api-key`.

## Stack

| Tecnologia   | Versao                                                 |
| ------------ | ------------------------------------------------------ |
| Angular      | v22 (standalone components, zoneless change detection) |
| TypeScript   | v6                                                     |
| Tailwind CSS | v3                                                     |
| RxJS         | v7                                                     |
| Vercel       | Serverless + Edge Middleware                           |

## Pre-requisitos

- Node.js >= 18 (recomendado: 20 LTS)
- npm >= 9

## Configuração de ambiente

Variáveis de ambiente podem ser definidas via arquivo `.env` na raiz do projeto ou via environment variables do sistema/CI.

```env
API_URL=
API_KEY=
POSTS_API_URL=
POSTS_API_KEY=
ADMIN_USER=
ADMIN_PASS=
```

O script `scripts/generate-env.js` gera `src/environments/environment.ts` automaticamente antes do build, substituindo os valores do template pelas variáveis fornecidas.

### Variáveis

| Variavel        | Descricao                        |
| --------------- | -------------------------------- |
| `API_URL`       | URL base da API de eventos       |
| `API_KEY`       | Chave de autenticacao da API     |
| `POSTS_API_URL` | Endpoint de publicacao de posts  |
| `POSTS_API_KEY` | Chave para o endpoint de posts   |
| `ADMIN_USER`    | Usuario do painel administrativo |
| `ADMIN_PASS`    | Senha do painel administrativo   |

## Execução local

```bash
npm install
npm start
```

O servidor de desenvolvimento inicia em `http://localhost:4200`. O script `prestart` executa `generate-env` automaticamente.

### Scripts disponíveis

| Comando         | Descricao                    |
| --------------- | ---------------------------- |
| `npm start`     | Servidor de desenvolvimento  |
| `npm run build` | Build de producao            |
| `npm run watch` | Build em modo watch          |
| `npm test`      | Execucao de testes com Karma |

## Rotas

| Rota      | Visibilidade | Descricao                    |
| --------- | ------------ | ---------------------------- |
| `/login`  | Publica      | Tela de autenticacao         |
| `/events` | Protegida    | Listagem e gestao de eventos |
| `/posts`  | Protegida    | Publicacao de postagens      |

A rota raiz (`/`) redireciona para `/events`. A autenticação e feita via middleware na Vercel, validando o cookie de sessão em cada requisição.

## Estrutura do projeto

```
src/app/
  core/              # Guards, interceptors, servicos e contexto HTTP
    guards/          # Auth guard
    interceptors/    # api-key e loading interceptors
    services/        # Auth, API key, loading e inactivity
  features/
    auth/            # Modulo de login
    events/          # CRUD de eventos com paginacao e busca
    posts/           # Publicacao de postagens com upload
  layouts/
    main-layout/     # Layout principal apos autenticacao
  shared/
    components/      # Componentes reutilizaveis
    models/          # Interfaces e tipos compartilhados
    services/        # Toast, confirm modal e outros servicos
scripts/
  generate-env.js    # Gerador de environment.ts a partir de .env
```

## Deploy

O deploy e feito na Vercel. O arquivo `vercel.json` define:

- Comando de build: `npm run build`
- Diretório de saída: `dist/admin-panel/browser`

O middleware em `middleware.ts` executa como Edge Function, interceptando requisições para proteger rotas e expor endpoints de autenticação (`/api/login`, `/api/logout`, `/api/me`).
