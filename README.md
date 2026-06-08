# Fin Control
O fin-control é um app Next.js 16 (App Router) com React 19 e TypeScript, onde as telas são majoritariamente Server Components e só o interativo (forms, modais, tabela) vira client. Os dados são mockados por um json-server lendo o `db.json`, os formulários usam react-hook-form + Zod, e a autenticação é fake (sessão no localStorage + cookie pra filtrar transações por usuário).

No visual, é Tailwind v4 com tokens semânticos em CSS (facilita trocar a paleta), variantes via class-variance-authority, ícones do lucide-react e o design system documentado no Storybook 10.

Para rodar, basta `npm install` e depois `npm run dev` — esse comando sobe o Next (em `http://localhost:3000`) e o json-server (em `http://localhost:3001`) ao mesmo tempo. Para ver o design system isolado, use `npm run storybook` (em `http://localhost:6006`).

## Antes de rodar

Você vai precisar de:

- Node 20.19+ ou 22.12+ (o Storybook 10 exige essa faixa)
- npm 10+

## Rodando o projeto

```bash
npm install

# sobe o Next (porta 3000) e o json-server (porta 3001) juntos
npm run dev
```

Depois é só abrir [http://localhost:3000](http://localhost:3000).

Pra ver o Storybook:

```bash
npm run storybook
```

Ele abre em [http://localhost:6006](http://localhost:6006).

E pra gerar o build de produção:

```bash
npm run build
npm start
```

## Vídeo de apresentação

O vídeo de apresentação se encontra na raíz do projeto, nomeado APRESENTACAO_FINCONTROL.mkv.

## Endpoints da API mockada

Como é json-server, os endpoints seguem o padrão REST em cima de `/transacoes`:

| Método | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/transacoes` | lista tudo |
| GET | `/transacoes/:id` | pega uma transação |
| POST | `/transacoes` | cria |
| PUT | `/transacoes/:id` | atualiza |
| DELETE | `/transacoes/:id` | apaga |
| GET | `/usuarios` | lista os usuários (usado no login) |

A base é `http://localhost:3001`, e dá pra trocar pelo `NEXT_PUBLIC_API_URL`.

## Licença

Projeto acadêmico feito pra POSTECH — Tech Challenge Fase 1.
