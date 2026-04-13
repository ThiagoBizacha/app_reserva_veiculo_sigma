# Sigma Reserva

Aplicativo interno em React Native + Expo para reserva corporativa de veiculos.


As etapas `B03` e `B01` agora estao estruturadas no codigo:

- `B03`: backend persistente e multiusuario com Supabase como fonte unica de verdade
- `B01`: autenticacao real com Supabase Auth, sessao persistida, rotas protegidas e troca obrigatoria da senha temporaria no primeiro acesso

## Estado atual

O app agora foi estruturado para:

- carregar `users`, `resources`, `reservations` e `reservation_history` a partir do backend;
- manter `AsyncStorage` apenas como cache auxiliar e persistencia de sessao no mobile;
- exigir sessao autenticada para entrar no app;
- restaurar a sessao ao reabrir o app;
- obrigar a troca da senha temporaria no primeiro login;
- persistir criacao de reserva, cancelamento, check-in e check-out no backend;
- refletir a mesma fonte de verdade em Agenda, Minhas Reservas, Frota, Painel e Detalhes.

`src/data/*` continua no repositorio apenas como insumo de seed e bootstrap de usuarios de teste. Nao e mais fluxo operacional do app.

## Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase (`@supabase/supabase-js`)
- AsyncStorage

## Estrutura relevante

```text
app/
src/
  backend/
  hooks/
    useAuthSession.tsx
    useReservationStore.tsx
  screens/
  services/
supabase/
  migrations/
scripts/
  seed-supabase-from-mocks.mjs
  provision-supabase-auth-users.mjs
.env.example
README.md
```

## Como configurar o backend

### 1. Criar o projeto no Supabase

Crie um projeto no Supabase e copie:

- `Project URL`
- `publishable key` para o app
- `secret/service role key` apenas para seed e scripts administrativos

### 2. Aplicar as migrations

Execute as duas migrations no Supabase:

1. [supabase/migrations/202604130001_b03_backend_persistente.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130001_b03_backend_persistente.sql:1)
2. [supabase/migrations/202604130002_b01_auth_real.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130002_b01_auth_real.sql:1)

A primeira cria o modelo persistente. A segunda:

- adiciona `auth_user_id` em `public.users`;
- fecha o acesso anonimo;
- deixa as tabelas operacionais acessiveis apenas por usuarios autenticados.

### 3. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local` ou `.env` e preencha:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key

# Apenas para seed e scripts administrativos locais
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
SUPABASE_AUTH_TEMP_PASSWORD=ChangeMe123!
```

Observacoes:

- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ir para o repositorio.
- `SUPABASE_AUTH_TEMP_PASSWORD` e usada apenas no script que cria usuarios de teste no Supabase Auth.

### 4. Popular o backend inicial

Depois de aplicar a migration do `B03`, rode:

```bash
npm run seed:supabase
```

Esse script:

- le `src/data/users.ts`;
- le `src/data/resources.ts`;
- le `src/data/reservations.ts`;
- faz `upsert` no Supabase para bootstrap inicial.

### 5. Provisionar usuarios autenticados

Depois de aplicar a migration do `B01`, rode:

```bash
npm run auth:provision:supabase
```

Esse script:

- le os usuarios ja persistidos em `public.users`;
- cria usuarios equivalentes no `Supabase Auth`;
- marca o email como confirmado;
- marca `must_change_password = true` para primeiro acesso quando o usuario ainda nao trocou a senha definitiva;
- grava `auth_user_id` em `public.users`.

Todos os usuarios provisionados recebem a mesma senha temporaria definida em `SUPABASE_AUTH_TEMP_PASSWORD`.
No primeiro login com essa senha, o app redireciona para a tela de definicao da senha definitiva, que agora aceita senha numerica com minimo de 4 digitos.

## Deploy web (produção)

**App em produção:** [https://sigma-reserva.vercel.app](https://sigma-reserva.vercel.app)

Projeto Vercel: `sigma-reserva` — qualquer celular abre o link, faz login e usa o app.
Para adicionar o ícone na tela inicial: Chrome → menu ⋮ → "Adicionar à tela inicial".

### Publicar atualização

Após alterar o código, rode os 2 comandos abaixo na raiz do projeto:

```bash
# 1. Gera o bundle web atualizado
npm run build:web

# 2. Faz o deploy para https://sigma-reserva.vercel.app
cd dist && npx vercel --prod --yes && cd ..
```

O link permanece o mesmo após cada deploy — não precisa repassar para os usuários.

## Como rodar o app

1. Instale as dependencias:

```bash
npm install
```

2. Configure `.env.local`.

3. Rode o app:

```bash
npm run android
```

Ou:

```bash
npm run start
```

Para testar no celular com Expo Go:

```bash
npx expo start --tunnel --clear
```

## Como entrar no app

Depois do provisionamento do Auth, use qualquer email corporativo seeded e a senha temporaria definida em `SUPABASE_AUTH_TEMP_PASSWORD`.

Exemplos do dataset atual:

- `thiago.bizacha@sigma.local`
- `marina.souto@sigma.local`
- `caio.mota@sigma.local`
- `roberto.alves@sigma.local`
- `maria.silva@sigma.local`

## Validacao tecnica

Checklist automatizado desta etapa:

- `npm run typecheck`

Checklist manual recomendado para homologacao de `B01` + `B03`:

1. Aplicar as duas migrations.
2. Rodar `npm run seed:supabase`.
3. Rodar `npm run auth:provision:supabase`.
4. Abrir o app sem sessao e confirmar que a tela inicial e o login.
5. Fazer login com email e senha temporaria.
6. Confirmar redirecionamento obrigatorio para a tela de nova senha.
7. Definir a senha definitiva no proprio app.
8. Fechar o app e abrir novamente para confirmar restauracao da sessao.
9. Criar uma reserva.
10. Confirmar a mesma reserva em Minhas Reservas, Agenda, Frota e Detalhe.
11. Fazer check-in.
12. Confirmar status `Em uso`.
13. Fazer check-out.
14. Confirmar status `Concluida`.
15. Fazer logout e confirmar retorno para a tela de login.

## Decisoes tecnicas

- `src/hooks/useAuthSession.tsx` concentra sessao, `signInWithPassword`, `signOut`, restauracao e observacao de mudancas de auth.
- `src/hooks/useAuthSession.tsx` tambem concentra a obrigacao de troca da senha temporaria e a atualizacao da senha definitiva via `Supabase Auth`.
- `src/hooks/useReservationStore.tsx` continua sendo a API de consumo das telas, mas agora depende da sessao autenticada para sincronizar o backend.
- O usuario corrente deixou de vir de `EXPO_PUBLIC_DEFAULT_USER_ID`. O app resolve o colaborador pelo `auth_user_id`, com fallback por email para vinculo inicial.
- O app mobile persiste a sessao via AsyncStorage. Na web, a sessao usa o storage do navegador.
- O banco agora exige usuario autenticado para acessar as tabelas operacionais. Ownership por perfil e recurso fica para `B02`.

## Limites atuais

- `B02` ainda nao foi implementado. As politicas RLS estao fechadas para anonimo, mas ainda nao restringem por papel ou ownership.
- O app nao cria usuarios no Supabase Auth pelo frontend. O provisionamento inicial e administrativo ainda acontece por script local com chave secreta.
- O fluxo automatizado de recuperacao de senha ainda nao entrou.

## Proximos passos

- `B02` autorizacao por perfil e ownership
- endurecer politicas RLS por usuario, papel e reserva
- evoluir onboarding administrativo de usuarios
- adicionar fluxo real de redefinicao de senha
