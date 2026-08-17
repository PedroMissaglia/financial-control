# Inventário Storybook (repo apartado)

Handoff para montar o design system **fora** deste repositório. **Não há Storybook local** neste repo (sem `.storybook`, sem `*.stories.tsx`). O DS vive no outro repositório.

Classificação:

| Tag | Significado |
|---|---|
| story-ready | UI isolável com args / estado local |
| needs-mocks | Redux, Next router, fetch, cookie ou CustomEvent |
| skip | Infra (auth, federation, loaders) — não entra no DS |

Runtime recomendado no outro repo: **React 19 + Vite + Storybook 10** (`@storybook/react-vite`). Casca e `mf-dashboard` compartilham tokens e primitivos. Angular **não** mistura no mesmo runtime.

---

## 1. Setup no repo apartado

### Copiar

| Origem neste repo | Para quê |
|---|---|
| [`shared/fincontrol-themes.css`](shared/fincontrol-themes.css) | Paletas, tipografia `.fc-*`, bridge Material (`--mat-sys-*`) |
| Bloco `@theme inline` de [`src/app/globals.css`](src/app/globals.css) | Mapeia `hsl(var(--primary))` → tokens Tailwind v4 |
| [`src/lib/utils.ts`](src/lib/utils.ts) (`cn`, `formatCurrency`, `formatDateShort`) | Primitivos e widgets |
| [`shared/dashboard-contract.ts`](shared/dashboard-contract.ts) | Tipos e eventos do dashboard |
| [`shared/dashboard-default-layout.ts`](shared/dashboard-default-layout.ts) | Layout padrão dos widgets |
| [`mf-dashboard/src/data/transacoes.ts`](mf-dashboard/src/data/transacoes.ts) (`seedTransacoes`) | Fixtures |
| [`mf-dashboard/src/lib/chart-theme.ts`](mf-dashboard/src/lib/chart-theme.ts) | Cores dos gráficos (lê CSS vars) |

Fonte: **Inter** (`--font-sans` / `--font-inter`). No host o default visual é `data-fin-theme="cyan"` em [`src/app/layout.tsx`](src/app/layout.tsx).

### Decorator de tema

No `preview`, setar no `document.documentElement`:

- `data-fin-theme`: `emerald` \| `teal` \| `cyan` \| `sky` \| `blue` \| `indigo` \| `violet` \| `rose` \| `orange` \| `amber`
- `data-fin-theme-mode`: `dark` (ausente = light)

Toolbar com os 10 temas × light/dark. Sem isso os tokens não batem com o app.

### `ui/` duplicado

Preferir a **casca** como fonte do DS. Cópias em `mf-dashboard/src/components/ui/` são quase iguais.

| Peça | Casca | mf-dashboard |
|---|---|---|
| Button, Label, CurrencyInput | canônico | cópia |
| Input | + estilos de search | base |
| Card | `Card`, `Header`, `Title`, `Description`, `Content` | + `CardMetric`, `CardFooter` |
| Badge, Modal, SelectMenu, DatePicker | só casca | — |

No DS: um Button/Card; incorporar `CardMetric` e `CardFooter` da cópia do dashboard.

---

## 2. Casca — primitivos (`src/components/ui/`)

| Componente | Arquivo | Variants / props | Tag |
|---|---|---|---|
| `Button` | [`button.tsx`](src/components/ui/button.tsx) | **variant:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`. **size:** `default`, `sm`, `lg`, `icon` | story-ready |
| `Card` (+ subpeças) | [`card.tsx`](src/components/ui/card.tsx) | `className`; título usa `.fc-card-title` | story-ready |
| `Badge` | [`badge.tsx`](src/components/ui/badge.tsx) | **variant:** `default`, `secondary`, `destructive`, `success`, `outline` | story-ready |
| `Input` | [`input.tsx`](src/components/ui/input.tsx) | `InputHTMLAttributes` | story-ready |
| `Label` | [`label.tsx`](src/components/ui/label.tsx) | `LabelHTMLAttributes` | story-ready |
| `SelectMenu` | [`select-menu.tsx`](src/components/ui/select-menu.tsx) | `value`, `onChange`, `options: {value, label}[]`, `id?`, `aria-label?` | story-ready |
| `CurrencyInput` | [`currency-input.tsx`](src/components/ui/currency-input.tsx) | `value?: number`, `onChange?: (n) => void` | story-ready |
| `DatePicker` | [`date-picker.tsx`](src/components/ui/date-picker.tsx) | `value` (`YYYY-MM-DD`), `onChange`, `min?`, `max?`, `placeholder?` (default `dd/mm/aaaa`), `align?: 'start' \| 'end'` | story-ready |
| `Modal` | [`modal.tsx`](src/components/ui/modal.tsx) | `children`, `title?` (default `Dialog`). Fecha com `useRouter().back()` | needs-mocks |

No outro repo, stories de Button devem cobrir as 7 variants e 4 sizes (incluindo `disabled`); Card deve incluir composto + `CardMetric` / `CardFooter` do dashboard.

Mock do Modal: stub de `next/navigation` com `back: fn()`, ou extrair o `<dialog>` controlado (como `ConfirmarExclusaoModal`) no repo do DS.

---

## 3. Casca — compostos (`src/components/`)

### story-ready

| Componente | Arquivo | Props |
|---|---|---|
| `Footer` | [`footer.tsx`](src/components/footer.tsx) | nenhum (texto fixo; `position: fixed`) |
| `ApiUnavailableBanner` | [`api-unavailable-banner.tsx`](src/components/api-unavailable-banner.tsx) | `onRetry` |
| `ConfirmarExclusaoModal` | [`confirmar-exclusao-modal.tsx`](src/components/confirmar-exclusao-modal.tsx) | `open`, `descricao?`, `isDeleting`, `error?`, `onConfirm`, `onClose` |
| `AnexoPreview` | [`anexo-preview.tsx`](src/components/anexo-preview.tsx) | `anexo: TransacaoAnexo`, `alt?`, `className?` |
| `AnexoDropzone` | [`anexo-dropzone.tsx`](src/components/anexo-dropzone.tsx) | `id`, `anexo`, `errorId?`, `onAnexoChange`, `onError` (JPEG/PNG/WebP/PDF, máx. 2 MB) |
| `TransacoesFilters` | [`transacoes-filters.tsx`](src/components/transacoes-filters.tsx) | `filtros`, `total`, `visiveis`, `onChange`. Tipo em [`transacao-filters.ts`](src/lib/transacao-filters.ts): `busca`, `tipo`, `categoria`, `dataInicio`, `dataFim`, `valorMin`, `valorMax` |

### needs-mocks

| Componente | Arquivo | Mocks |
|---|---|---|
| `Header` | [`header.tsx`](src/components/header.tsx) | Redux `useAuth`, `next/link`, `usePathname` / `useRouter`. Nav: `/`, `/transacoes`, mobile + `/transacoes/nova` |
| `UserMenu` | [`user-menu.tsx`](src/components/user-menu.tsx) | `nome?`, `onLogout`; `next/link` + `usePathname` |
| `ThemeModeToggle` | [`theme-mode-toggle.tsx`](src/components/theme-mode-toggle.tsx) | Redux `setThemeMode` |
| `ApiUnavailableCard` | [`api-unavailable-card.tsx`](src/components/api-unavailable-card.tsx) | `onRetry?`; fallback `router.refresh()` |
| `TransacaoTable` | [`transacao-table.tsx`](src/components/transacao-table.tsx) | `transacoes[]`; `deleteTransacao`, `useRouter`, `next/link` |
| `TransacaoForm` | [`transacao-form.tsx`](src/components/transacao-form.tsx) | `transacao?`, `mode?: 'create' \| 'edit'`, `onSuccess?`; RHF + Zod, API, Redux auth, router |
| `TransacaoModalForm` | [`transacao-modal-form.tsx`](src/components/transacao-modal-form.tsx) | igual ao form + `router.back` / `refresh` |
| `CriarUsuarioModal` | [`criar-usuario-modal.tsx`](src/components/criar-usuario-modal.tsx) | `open`, `onClose`; API cadastro + login |
| `ProfileBoard` | [`profile-board.tsx`](src/components/profile-board.tsx) | Redux (meta/alerta/extrato) + editor MFE |

### skip

| Componente | Por quê |
|---|---|
| `AuthGuard` | Gate de rota + redirect |
| `AuthTokenRefresher` | Refresh de JWT; renderiza `null` |
| `MfEventBridge` | Bus host ↔ remotes (`fincontrol:navigate`, `fincontrol:delete-transacao`, …) |
| `DashboardBoard` | Wrapper fino do remote |
| `DashboardViewMicrofrontend` | Loader Native Federation |
| `DashboardEditorMicrofrontend` | Idem |
| `TransacoesMicrofrontend` | Idem + profile API |

---

## 4. mf-dashboard (React / Vite)

Widgets: `saldo`, `evolucao`, `comparativo`, `categorias`, `extrato`, `rapida`, `meta`, `alerta` ([`dashboard-contract.ts`](shared/dashboard-contract.ts)).

Eventos: `fincontrol:navigate`, `fincontrol:transacoes-changed`, `fincontrol:theme-changed`.

### story-ready

| Componente | Arquivo | Props / notas |
|---|---|---|
| `SaldoCard` | [`saldo-card.tsx`](mf-dashboard/src/components/saldo-card.tsx) | `saldo: number` |
| `EvolucaoSaldoChart` | [`financeiro-charts.tsx`](mf-dashboard/src/components/financeiro-charts.tsx) | `evolucao: PontoSaldo[]` (recharts) |
| `ReceitasDespesasChart` | idem | `{ name, valor }[]` |
| `GastosCategoriaChart` | idem | `TotalPorGrupo[]` |
| `ExtratoRecente` | [`extrato-recente.tsx`](mf-dashboard/src/components/extrato-recente.tsx) | `transacoes`, `limit`; botão dispara `fincontrol:navigate` (logar no story) |
| `ConfirmarExclusaoGrupoModal` | [`confirmar-exclusao-grupo-modal.tsx`](mf-dashboard/src/components/confirmar-exclusao-grupo-modal.tsx) | `open`, `groupName`, `deleteTarget: 'above' \| 'below' \| null`, `onConfirm`, `onClose` |
| `ui/*` | [`mf-dashboard/src/components/ui/`](mf-dashboard/src/components/ui/) | Não duplicar stories se a casca já cobrir |

Meta e alerta são cards inline em `DashboardWidgetPreview` — storied via preview com `seedTransacoes` ou extraídos.

### needs-mocks

| Componente | Arquivo | Mocks |
|---|---|---|
| `NovaTransacaoRapida` | [`nova-transacao-rapida.tsx`](mf-dashboard/src/components/nova-transacao-rapida.tsx) | `apiUrl?`; POST `/transacoes`, cookie `fincontrol_uid`, eventos navigate/changed |
| `DashboardWidgetGrid` | [`dashboard-widget-grid.tsx`](mf-dashboard/src/components/dashboard-widget-grid.tsx) | `widgets`, `layoutRows?`, `layoutGroups?`, `renderWidget` |
| `DashboardLayoutEditor` | [`dashboard-layout-editor.tsx`](mf-dashboard/src/components/dashboard-layout-editor.tsx) | `@dnd-kit`; `onLayoutChange`, `onToggleVisibility`, `onSetCols` |
| `DashboardWidgetPreview` | [`dashboard-widget-preview.tsx`](mf-dashboard/src/components/dashboard-widget-preview.tsx) | `id: WidgetId` + transações + meta/alerta/extrato + `apiUrl?` (widget `rapida`) |
| `DashboardViewApp` / `DashboardEditorApp` | `mf-dashboard/src/apps/` | Composição completa; MSW + layout default |

### skip

`exposes/dashboard-view.tsx`, `exposes/dashboard-editor.tsx` (`mount()`), `standalone/*`, `lib/mf-root.tsx`.

Fixture mínima:

```ts
apiUrl: 'http://127.0.0.1:3001'
metaEconomia: 800
alertaGastos: 2500
extratoLimite: 10
// widgets + rows: createDefaultDashboardLayout()
// transacoes: seedTransacoes
```

---

## 5. mf-transacoes (Angular 19)

Um componente de UI: **`mf-transacoes-list`**.

| | |
|---|---|
| Arquivos | [`transacoes-list.component.ts`](mf-transacoes/src/app/transacoes-list.component.ts) + `.html` + `.css` |
| Stack | Angular Material (`mat-card`, `mat-table`, `mat-paginator`, `mat-chip`); tokens `--mat-sys-*` / `.fc-*` |
| `@Input()` | `apiUrl`, `usuarioId`, `accessToken`, `filtros` (`FILTROS_VAZIOS`), `pageSize` (5 / 8 / 10 / 20, default 8) |
| Lista | tabela desktop + cards mobile |
| Filtros | **não** estão no MFE — UI na casca (`TransacoesFilters`); o remote só recebe o objeto |
| API | `TransacoesService.listar` via `fetch` + Bearer |
| Ações | Ver/Editar → `fincontrol:navigate`; excluir → `fincontrol:delete-transacao`; refresh em `fincontrol:transacoes-changed` |
| Tag | needs-mocks (MSW `GET /transacoes`, token fake, log de eventos) |

### skip (Angular)

`bootstrap-mf.ts` (`mount` + custom element), `mf-app.ts`, `mf-providers.ts`, `app.component.ts` (shell de dev).

**Não** colocar este MFE no Storybook React. Opções: segundo projeto `@storybook/angular`, ou MDX com screenshot + tabela de inputs.

---

## 6. Prioridade no outro repo

1. Tokens + toolbar de tema + primitivos da casca (completar Button/Card; Badge, Input, Label, SelectMenu, CurrencyInput, DatePicker).
2. Compostos story-ready da casca (Footer, banners, confirmação, anexos, filtros).
3. Widgets do dashboard (SaldoCard, charts, ExtratoRecente, modal de grupo).
4. Header / UserMenu / ThemeModeToggle / TransacaoForm com mocks de router e Redux.
5. Lista Angular (Storybook Angular ou só documentação).

Infra (`AuthGuard`, `mount()`, event bridge) fica fora do DS.
