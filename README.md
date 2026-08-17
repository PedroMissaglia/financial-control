# Fin Control — Fase 2

O Fin Control é um app de gerenciamento financeiro da POSTECH (Tech Challenge Fase 2). O **host** é Next.js 16 (App Router, React 19, TypeScript) com SSR, Redux Toolkit e formulários. A **listagem de transações** é um microfrontend Angular 19 (Native Federation) em `/transacoes`. O **dashboard** (visão e editor de layout) é um microfrontend React/Vite em `/` e `/profile`.

Os dados vêm de um json-server (`db.json`). Quando a API da FIAP estiver disponível, troque só o `NEXT_PUBLIC_API_URL`.

## Antes de rodar

- Node 20.19+ ou 22.12+
- npm 10+
- Para Docker: Docker Desktop / Compose

## Ambiente de desenvolvimento

```bash
npm install
npm --prefix mf-transacoes install
npm --prefix mf-dashboard install

# sobe Next (3000), json-server (3001), Angular (4200) e dashboard (4300)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Login de exemplo: `pedromissaglia@gmail.com` / `123456`.

Storybook do design system:

```bash
npm run storybook
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` se quiser alterar os padrões:

| Variável | Padrão | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API (json-server ou API da FIAP) |
| `NEXT_PUBLIC_MF_TRANSACOES_URL` | `http://localhost:4200` | URL pública do remote Angular |
| `NEXT_PUBLIC_MF_DASHBOARD_URL` | `http://localhost:4300` | URL pública do remote do dashboard |

## Docker Compose

Sobe API, host Next e os remotes (nginx):

```bash
docker compose up --build
```

- App: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)
- Microfrontend de transações: [http://localhost:4200](http://localhost:4200)
- Microfrontend do dashboard: [http://localhost:4300](http://localhost:4300)

## Arquitetura

Documentação técnica completa: [ARQUITETURA.md](ARQUITETURA.md).

```
Next.js (host / Vercel)
  ├── Home SSR: carrega o remote React do dashboard
  ├── /profile: editor de layout e preferências
  ├── Formulário: validação Zod, sugestão de categoria, anexos
  └── /transacoes → carrega o remote Angular (Native Federation)

Angular 19 (mf-transacoes)
  └── ./Transacoes — listagem com busca, filtros, paginação e exclusão

React/Vite (mf-dashboard)
  ├── ./DashboardView — gráficos, saldo, extrato e transação rápida
  └── ./DashboardEditor — arrastar painéis e grupos do layout
```

Comunicação: cookie `fincontrol_uid` para o usuário; `CustomEvent` (`fincontrol:navigate`, `fincontrol:transacoes-changed`) entre host e remotes. Se o remote Angular não subir, a listagem React entra como fallback.

Estado global do host: Redux Toolkit (`auth`, `dashboard`).

## Deploy na Vercel

São **três projetos Hobby** no mesmo Git repo (o `next build` não empacota os remotes). A API Nest fica fora da Vercel. Publique os dois microfrontends **antes** do host — as URLs entram no bundle do Next no build.

1. **`mf-transacoes`** — Root Directory `mf-transacoes`, Framework Other. Build e CORS já estão em `mf-transacoes/vercel.json` (`dist/mf-transacoes/browser`). Confira `https://…/remoteEntry.json`.
2. **`mf-dashboard`** — Root Directory `mf-dashboard`, Framework Other. Env de build: `VITE_API_URL=https://sua-api`. Output `dist`. Confira `https://…/remoteEntry.json`.
3. **Host (raiz)** — Root Directory `.`, Framework Next.js. Env (sem barra no final):

```
NEXT_PUBLIC_API_URL=https://sua-api
API_URL=https://sua-api
NEXT_PUBLIC_MF_TRANSACOES_URL=https://mf-transacoes-xxx.vercel.app
NEXT_PUBLIC_MF_DASHBOARD_URL=https://mf-dashboard-xxx.vercel.app
```

Se mudar `NEXT_PUBLIC_*` ou `VITE_API_URL` depois, faça **Redeploy**. No Nest, libere CORS para os três `*.vercel.app`. `output: 'standalone'` continua só para Docker; na Vercel o `next.config.ts` desliga isso sozinho.

## API mockada

Base: `http://localhost:3001`

| Método | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/transacoes?usuarioId=` | lista do usuário |
| GET | `/transacoes/:id` | detalhe |
| POST | `/transacoes` | cria (aceita `categoria` e `anexo`) |
| PUT | `/transacoes/:id` | atualiza |
| DELETE | `/transacoes/:id` | apaga |
| GET | `/usuarios` | login |
| GET/PUT/POST | `/profiles` | preferências e layout do dashboard |

## Licença

Projeto acadêmico — POSTECH Tech Challenge Fase 2.
