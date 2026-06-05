# Fin Control

App de controle financeiro feito para o Tech Challenge da Fase 1 da POSTECH. A ideia é simples: o usuário consegue ver o saldo da conta, acompanhar o extrato e cadastrar, editar ou apagar transações.

Como o desafio pedia só o front-end, não tem back-end de verdade aqui. Os dados ficam mockados num `db.json` servido pelo json-server, então dá pra rodar tudo localmente sem banco nem autenticação.

## O que dá pra fazer

- Entrar com um usuário mockado e sair da conta pelo header
- Ver o saldo atual e o extrato das últimas movimentações logo na home
- Cadastrar uma transação rápida direto da página inicial
- Listar todas as transações numa tabela, com botões pra ver, editar e excluir
- Abrir o formulário de criar/editar tanto em modal quanto em página cheia
- Conferir os componentes isolados no Storybook

## Stack

O fin-control é um app Next.js 16 (App Router) com React 19 e TypeScript, onde as telas são majoritariamente Server Components e só o interativo (forms, modais, tabela) vira client. Os dados são mockados por um json-server lendo o `db.json`, os formulários usam react-hook-form + Zod, e a autenticação é fake (sessão no localStorage + cookie pra filtrar transações por usuário).

No visual, é Tailwind v4 com tokens semânticos em CSS (facilita trocar a paleta), variantes via class-variance-authority, ícones do lucide-react e o design system documentado no Storybook 10.

Para rodar, basta `npm install` e depois `npm run dev` — esse comando sobe o Next (em `http://localhost:3000`) e o json-server (em `http://localhost:3001`) ao mesmo tempo. Para ver o design system isolado, use `npm run storybook` (em `http://localhost:6006`).

## Como ele foi construído

Vou explicar as decisões principais, porque elas respondem boa parte das dúvidas de quem for mexer no código.

### Next.js e o App Router

As rotas ficam em `src/app/`. As páginas de leitura (home, listagem, detalhes) são Server Components assíncronos: elas buscam os dados no servidor, na hora de renderizar. Só o que precisa de interação vira Client Component (`'use client'`), tipo os formulários, a tabela com as ações, o menu mobile e os modais.

Os formulários de criar e editar usam intercepting routes com o slot `@modal`. Na prática: quando você clica num botão dentro da listagem, o formulário abre como um modal por cima da página. Se você acessar a mesma URL direto ou der refresh, ele cai numa página cheia normal. É o mesmo conteúdo, só muda a forma de exibir dependendo de como você chegou ali.

### json-server pros dados

Em vez de escrever um back-end, usei o json-server. Ele lê o `db.json` e já expõe uma API REST com os endpoints de CRUD na porta 3001. Enquanto o servidor está de pé, o que você cria ou edita fica salvo no `db.json` mesmo.

Toda a conversa com essa API passa por um único arquivo, o `src/app/services/transacoes.ts`. Concentrei os `fetch` ali pra não espalhar chamada de rede pelo projeto e pra padronizar o tratamento de erro. A URL base vem do `NEXT_PUBLIC_API_URL`, e se não tiver nada configurado ele assume `http://localhost:3001`.

Se a API estiver fora do ar por algum motivo, o serviço cai num conjunto de dados de exemplo que mora no `src/data/transacoes.ts`, só pra interface não quebrar. Esse mesmo arquivo guarda as regras de domínio (cálculo de saldo, ordenação, filtros) como funções puras, separadas da parte de rede.

Pra não precisar abrir dois terminais, o `npm run dev` sobe o Next e o json-server ao mesmo tempo usando o concurrently.

### Autenticação mockada

Não tem back-end de autenticação de verdade, então a verificação de usuário também é mockada. Os usuários ficam no `db.json` (array `usuarios`) e o json-server expõe eles em `/usuarios`. O serviço `src/app/services/usuarios.ts` busca essa lista e valida e-mail e senha; se a API estiver fora do ar, ele cai no seed de `src/data/usuarios.ts`, igual ao que já acontece com as transações.

A sessão é resolvida no client com Context API (`src/contexts/auth-context.tsx`). Ao logar, o usuário (sem a senha) é guardado no `localStorage` na chave `fincontrol:auth` e exposto pelo hook `useAuth()`, que entrega `usuario`, `isAuthenticated`, `login()` e `logout()`.

O `AuthGuard` (`src/components/auth-guard.tsx`) fica no layout raiz e protege todas as rotas: quem não está autenticado é redirecionado pra `/login`. A única rota pública é a própria tela de login. Como a sessão vive no `localStorage`, essa proteção é client-side. O header aparece logado e deslogado, com um avatar no canto superior direito que alterna conforme o `isAuthenticated`: um ícone padrão quando ninguém está logado e a primeira letra do nome do usuário quando há sessão. A navegação e o botão "Sair" só aparecem quando alguém está logado.

Usuários de teste:

| E-mail                 | Senha        |
| ---------------------- | ------------ |
| `maria@fincontrol.com` | `123456`     |
| `joao@fincontrol.com`  | `fincontrol` |

### Tailwind na estilização

Estou usando o Tailwind v4, que dispensa o `tailwind.config.js` — a configuração fica no próprio CSS. As cores e medidas do design system estão como variáveis CSS no `src/app/globals.css` e são expostas pro Tailwind pelo bloco `@theme inline`.

A ideia foi ter tokens semânticos (`primary`, `muted`, `destructive`, `success` e por aí vai) em vez de cor solta no meio do código. No contexto financeiro isso ajuda bastante: entrada de dinheiro aparece em verde, saída em vermelho, e isso vem do token, não de um valor fixo repetido em cada componente.

Pros componentes que têm variação (o `Button`, por exemplo, com tamanhos e estilos diferentes), usei o class-variance-authority. E pra juntar classes sem dor de cabeça com conflito tem o helper `cn()`, que é só clsx + tailwind-merge.

### Storybook pra documentação

O desafio pedia documentação do design system, e o Storybook resolve isso bem. Cada componente tem seu arquivo `.stories.tsx` dentro de `src/components/`. Documentei os básicos (`Button`, `Card`) e os de domínio (`SaldoCard`, `TransacaoCard`) com dados de exemplo.

Um detalhe que vale citar: o Storybook importa o mesmo `globals.css` da aplicação, então os componentes aparecem lá com as cores e estilos de verdade, não com um tema à parte. Ele roda separado do app, na porta 6006.

### Formulários

Criar e editar transação usa react-hook-form com validação via Zod. As regras são as óbvias: valor maior que zero, data e tipo obrigatórios. As mensagens de erro aparecem campo a campo.

## Antes de rodar

Você vai precisar de:

- Node 20.19+ ou 22.12+ (o Storybook 10 exige essa faixa)
- npm 10+

## Rodando o projeto

```bash
npm install

# opcional, os valores padrão já funcionam
cp .env.local.example .env.local

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

Vale lembrar que o json-server precisa estar rodando pra aplicação carregar os dados. Pra desenvolvimento e demonstração, o `npm run dev` já resolve isso.

## Como o projeto está organizado

```
fin-control/
├── db.json                 # dados mockados (transações e usuários)
├── .storybook/             # config do Storybook
├── src/
│   ├── app/                # rotas (App Router)
│   │   ├── @modal/         # modais via intercepting routes
│   │   ├── login/          # tela de login
│   │   ├── services/       # camada que fala com a API
│   │   └── transacoes/     # listagem, detalhes, criar, editar
│   ├── components/         # componentes de UI e de domínio (Header, AuthGuard...)
│   │   └── ui/             # base do design system (Button, Card, Input...)
│   ├── contexts/           # AuthProvider / useAuth
│   ├── data/               # tipos e funções puras
│   └── lib/                # utilitários (cn, formatCurrency...)
└── public/
```

## Como o saldo é calculado

A regra é direta: depósito soma, o resto subtrai.

```
saldo = soma dos depósitos − soma de (transferências + saques + pagamentos)
```

## Endpoints da API mockada

Como é json-server, os endpoints seguem o padrão REST em cima de `/transacoes`:

| Método | Endpoint          | O que faz                          |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/transacoes`     | lista tudo                         |
| GET    | `/transacoes/:id` | pega uma transação                 |
| POST   | `/transacoes`     | cria                               |
| PUT    | `/transacoes/:id` | atualiza                           |
| DELETE | `/transacoes/:id` | apaga                              |
| GET    | `/usuarios`       | lista os usuários (usado no login) |

A base é `http://localhost:3001`, e dá pra trocar pelo `NEXT_PUBLIC_API_URL`.

## Referência de layout

O design partiu do [Figma do projeto](https://www.figma.com/design/ns5TC3X5Xr8V7I3LYKg9KA/Projeto-Financeiro?node-id=503-4264). Segui como referência, sem a obrigação de copiar pixel a pixel.

## Roteiro do vídeo (até 5 min)

Uma sugestão de ordem pra gravar a demonstração:

1. Abrir a home e apresentar o app rapidinho
2. Mostrar o saldo e o extrato, e registrar uma transação rápida
3. Ir pra listagem e mostrar a tabela com as ações
4. Criar uma transação pelo formulário
5. Editar uma que já existe
6. Excluir uma (com a confirmação)
7. Abrir o Storybook pra fechar mostrando os componentes

## Scripts

| Script              | O que faz               |
| ------------------- | ----------------------- |
| `npm run dev`       | sobe Next + json-server |
| `npm run dev:next`  | só o Next               |
| `npm run dev:api`   | só o json-server        |
| `npm run storybook` | Storybook na porta 6006 |
| `npm run build`     | build de produção       |
| `npm run lint`      | ESLint                  |
| `npm run format`    | Prettier                |

## Licença

Projeto acadêmico feito pra POSTECH — Tech Challenge Fase 1.
