# Circuito ADM

Painel administrativo em Angular para gestão de eventos e publicação de postagens do Circuito.

## Objetivo

Este projeto centraliza operações internas:
- autenticação de acesso ao painel;
- CRUD de eventos;
- publicação de postagens com upload de imagem;
- sincronização de bucket via API.

## Stack

- Angular 18 (standalone components, router, HttpClient)
- TypeScript
- Tailwind CSS
- RxJS

## Pré-requisitos

- Node.js 18+ (recomendado: 20 LTS)
- npm 9+

## Configuração de ambiente

O projeto gera `src/environments/environment.ts` automaticamente a partir de variáveis de ambiente (arquivo `.env` ou variáveis do sistema).

Crie um arquivo `.env` na raiz com os campos:

```env
API_URL=
API_KEY=
POSTS_API_URL=
POSTS_API_KEY=
ADMIN_USER=
ADMIN_PASS=
```

Variáveis usadas:
- `API_URL`: base da API de eventos (ex.: `https://api.exemplo.com`)
- `POSTS_API_URL`: endpoint de publicação de posts
- `ADMIN_USER` e `ADMIN_PASS`: credenciais de login do painel
- `API_KEY` e `POSTS_API_KEY`: disponíveis no environment gerado

## Execução local

```bash
npm install
npm start
```

O app sobe em modo de desenvolvimento com `ng serve`.  
O script `prestart` executa `generate-env` automaticamente antes de iniciar.

## Scripts

```bash
npm run start   # desenvolvimento
npm run build   # build de produção
npm run watch   # build em modo watch
npm run test    # testes com Karma
```

## Fluxo funcional

### 1. Login

- Rota pública: `/login`
- Rotas protegidas: `/events` e `/posts`
- A autenticação compara usuário e senha com `ADMIN_USER` e `ADMIN_PASS`
- Sessão em `sessionStorage` (`circuito_auth`)

### 2. Eventos

- Listagem paginada
- Filtro por texto
- Criação, edição e remoção
- Ação de sincronização de bucket

### 3. Postagens

- Formulário de publicação
- Upload de imagem principal
- Geração automática de slug a partir do título

## API Key por ação sensível

Chamadas que exigem chave usam interceptor HTTP:
- ao executar a ação, o sistema abre um modal;
- a chave informada é enviada no header `x-api-key`;
- se o modal for cancelado, a requisição é abortada.

## Estrutura principal

```text
src/app/
  core/            # guardas, serviços, interceptor e contexto HTTP
  features/
    auth/          # login
    events/        # listagem e formulário de eventos
    posts/         # publicação de postagens
  layouts/         # layout principal do painel
  shared/          # componentes e modelos compartilhados
scripts/
  generate-env.js  # gera environment.ts a partir do .env
```
