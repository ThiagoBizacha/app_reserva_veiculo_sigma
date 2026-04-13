# Guia de Deploy — Sigma Reserva

Referência operacional para gerar e distribuir novas versões do app.

---

## Canais de distribuição

| Canal | Dispositivo | Instalação | Ideal para |
|---|---|---|---|
| **APK Android** | Celular Android | Uma vez (sideload) | Usuários de campo |
| **Web estático** | Qualquer navegador | Nenhuma | Acesso rápido, desktop |

---

## Deploy Android (APK)

### Pré-requisitos

- Conta no [expo.dev](https://expo.dev) com acesso ao projeto `tbizachas-organization`
- EAS CLI instalado: `npm install -g eas-cli`
- Login: `eas login`

### Gerar o APK

```bash
# Build de produção (demora ~10 min no servidor EAS)
eas build --profile production --platform android
```

Ao finalizar, o EAS exibe um **link de download** e um **QR Code** direto no terminal.

### Distribuir para os usuários

1. Copie o link gerado pelo EAS
2. Envie pelo Teams, email ou grupo — o usuário abre no celular e instala
3. **Importante:** na primeira instalação, o Android pede para ativar *"Instalar de fontes desconhecidas"* — o usuário precisa permitir uma única vez

> O link de download fica ativo por 30 dias no EAS. Para links permanentes, use o EAS Dashboard para baixar o APK e hospedá-lo internamente.

### Atualizar o app sem reinstalar (OTA)

Para mudanças de código (telas, lógica, textos) sem precisar que o usuário reinstale:

```bash
eas update --branch production --message "v1.1 - descrição do que mudou"
```

O app baixa a atualização automaticamente na próxima abertura.

**Quando é necessário rebuild completo:**
- Adição ou atualização de dependências nativas
- Mudanças em `app.json` (nome, ícone, permissões, versão)
- Mudança de `versionCode` para Play Store

### Versionar corretamente

Antes de cada rebuild de produção, atualize em `app.json`:

```json
"version": "1.1.0",         ← versão exibida ao usuário
"android": {
  "versionCode": 2           ← incrementar sempre (+1 a cada build)
}
```

---

## Deploy Web (navegador)

**URL de produção:** [https://sigma-reserva.vercel.app](https://sigma-reserva.vercel.app)
Projeto Vercel: `sigma-reserva` (thiagobizachas-projects)

### Publicar nova versão

```bash
# 1. Na raiz do projeto — gera o bundle
npm run build:web

# 2. Deploy para o projeto sigma-reserva
cd dist && npx vercel --prod --yes && cd ..
```

### Gerar o bundle estático

```bash
npm run build:web
```

Gera a pasta `dist/` com todos os arquivos HTML/JS/CSS prontos para hospedar.

**Resultado do último build:**
- 23 rotas pré-renderizadas
- Bundle JS: ~2.14 MB
- Sem dependência de servidor — arquivos estáticos puros

### Opções de hospedagem

#### Opção A — Vercel (recomendado para agilidade)

```bash
npm install -g vercel
vercel dist/
```

Gera um link público em segundos. Ideal para validação rápida.

#### Opção B — Netlify

1. Acesse [netlify.com](https://netlify.com) → *Add new site* → *Deploy manually*
2. Arraste a pasta `dist/` para a área de upload
3. Netlify gera um link imediatamente

#### Opção C — Servidor interno / intranet

```bash
# Servir localmente para testes
npx serve dist/

# Copiar para servidor interno (exemplo com scp)
scp -r dist/ usuario@servidor-interno:/var/www/sigma-reserva/
```

Configure o servidor HTTP (nginx, IIS, Apache) para:
- Servir `index.html` para qualquer rota não encontrada (SPA fallback)
- HTTPS obrigatório (Supabase Auth exige origem segura em produção)

#### Opção D — GitHub Pages

```bash
# Instalar gh-pages
npm install -D gh-pages

# Publicar
npx gh-pages -d dist
```

Disponível em `https://tbizachas-organization.github.io/reserva-de-veiculos-sigma/`

### Configurar SPA fallback (nginx)

Para que rotas como `/home` e `/agenda` funcionem corretamente ao acessar diretamente:

```nginx
server {
    listen 443 ssl;
    server_name reserva.sigma.internal;
    root /var/www/sigma-reserva;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Limitações conhecidas no navegador

| Funcionalidade | Android | Web |
|---|---|---|
| Câmera / seleção de fotos | Nativo | Limitado (file picker do browser) |
| Seletor de data/hora | Nativo | Pode variar por browser |
| Sessão persistente | AsyncStorage | localStorage (automático) |
| Notificações push | Suportado | Não implementado |

---

## Referência rápida

```bash
# Build APK produção
eas build --profile production --platform android

# Build APK preview (para testar antes de produção)
eas build --profile preview --platform android

# Publicar atualização OTA
eas update --branch production --message "descrição"

# Build web estático
npm run build:web

# Deploy web para produção (projeto sigma-reserva no Vercel)
cd dist && npx vercel --prod --yes && cd ..

# Servir web localmente para testes
npx serve dist/
```

---

## Fluxo de release recomendado

```
1. Desenvolver e testar localmente (npm run start)
2. Buildar preview: eas build --profile preview --platform android
3. Validar o APK preview com 1-2 usuários
4. Se ok: eas build --profile production --platform android
5. Distribuir link do APK via Teams/email
6. Para web: npm run build:web → upload para servidor interno
7. Documentar o que mudou (eas update --message já serve)
```
