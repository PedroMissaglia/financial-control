# Fin Control — mobile (Capacitor iOS)

Casca nativa que abre o **host Next.js hospedado** (Vercel) no WKWebView. O `.ipa` **não** embute o monorepo Next/MFEs — só aponta para `CAPACITOR_SERVER_URL`.

Offline / service worker / sync: fora desta fase (ver plano Fase 1–3).

## Pré-requisitos

- Mac com **Xcode** (não só Command Line Tools)
- CocoaPods (`brew install cocoapods`)
- Node 20+ (recomendado; Capacitor 7)
- Host + remotes + API Nest em **HTTPS** (o iPhone não acessa `localhost`)
- Apple Developer para rodar em device físico / Ad Hoc

Se `xcode-select` apontar para CLT e `pod install` falhar:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Os scripts abaixo também exportam `DEVELOPER_DIR` automaticamente quando o Xcode.app existe.

## Setup

```bash
cd mobile
cp .env.example .env.local
# edite CAPACITOR_SERVER_URL=https://seu-host.vercel.app  (sem barra no final)

npm install
npm run sync
npm run open:ios
```

No Xcode: escolha Team (Signing), plugue o iPhone ou use o Simulator, e rode (**Run**).

## Scripts

| Script | Comando |
|--------|---------|
| `npm run sync` | Copia `www` + aplica `capacitor.config` + `pod install` |
| `npm run open:ios` | Abre o workspace no Xcode |

Wrapper: [`cap.sh`](cap.sh) (UTF-8 + `DEVELOPER_DIR`).

## Configuração

- [`capacitor.config.ts`](capacitor.config.ts) — `appId` `br.com.fincontrol.app`, `server.url` vindo de `CAPACITOR_SERVER_URL`
- [`www/index.html`](www/index.html) — placeholder; em runtime o WebView carrega o host remoto

Depois de mudar `.env.local`, rode `npm run sync` de novo.

## Gerar `.ipa` (Ad Hoc, sem App Store)

1. Defina `CAPACITOR_SERVER_URL` de produção/staging e `npm run sync`
2. Xcode → scheme **App** → **Any iOS Device** → **Product → Archive**
3. **Distribute App → Ad Hoc** (devices com UDID registrados no portal Developer)
4. Instale no device (Xcode / Apple Configurator)

Atualizar só o site na Vercel **não** exige novo `.ipa`. Novo binário só se mudar shell Capacitor, ícone, `appId`, etc.

## Checklist no device

- [ ] Abre o host (não fica só no HTML placeholder)
- [ ] Login e sessão (`localStorage` / cookies)
- [ ] Dashboard (remote Vite) e `/transacoes` (remote Angular)
- [ ] API Nest sem CORS / mixed content (tudo HTTPS)

## CORS

No Nest, libere a origem do **host** Vercel (a mesma de `CAPACITOR_SERVER_URL`). Remotes e API precisam estar nas URLs já configuradas no deploy do host (`NEXT_PUBLIC_*`).
