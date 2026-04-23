# Sigma Reserva

Aplicativo interno em React Native + Expo para reserva corporativa de veiculos.


As etapas `B03`, `B01` e `B02` agora estao estruturadas no codigo:

- `B03`: backend persistente e multiusuario com Supabase como fonte unica de verdade
- `B01`: autenticacao real com Supabase Auth, sessao persistida, rotas protegidas e troca obrigatoria da senha temporaria no primeiro acesso
- `B02`: autorizacao por perfil e ownership com RLS no Supabase para `Solicitante`, `Operacao` e `Administrador`

## Estado atual

O app agora foi estruturado para:

- carregar `users`, `resources`, `reservations` e `reservation_history` a partir do backend;
- manter `AsyncStorage` apenas como cache auxiliar e persistencia de sessao no mobile;
- exigir sessao autenticada para entrar no app;
- restaurar a sessao ao reabrir o app;
- obrigar a troca da senha temporaria no primeiro login;
- restringir leitura e escrita por perfil e ownership no backend;
- persistir criacao de reserva, cancelamento, check-in e check-out no backend;
- refletir a mesma fonte de verdade em Agenda, Minhas Reservas, Frota, Painel e Detalhes.

Perfis suportados nesta fase:

- `Solicitante`
- `Operacao`
- `Administrador`

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
docs/
  README.md
  PROJECT_CONTEXT.md
  DOCUMENTACAO_TECNICA.md
  GUIA_DEPLOY.md
  GUIA_PROVISIONAMENTO_USUARIOS.md
  TEMPLATE_ARQUITETURA_BACKEND_DEPLOY.md
  todo.md
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
  reset-supabase-auth-password.mjs
.env.example
README.md
```

## Documentacao

A documentacao complementar do projeto agora fica centralizada em [`docs/`](./docs/README.md):

- contexto funcional e escopo em [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md)
- documentacao tecnica em [`docs/DOCUMENTACAO_TECNICA.md`](./docs/DOCUMENTACAO_TECNICA.md)
- guia de deploy em [`docs/GUIA_DEPLOY.md`](./docs/GUIA_DEPLOY.md)
- guia de provisionamento em [`docs/GUIA_PROVISIONAMENTO_USUARIOS.md`](./docs/GUIA_PROVISIONAMENTO_USUARIOS.md)
- template arquitetural reutilizavel em [`docs/TEMPLATE_ARQUITETURA_BACKEND_DEPLOY.md`](./docs/TEMPLATE_ARQUITETURA_BACKEND_DEPLOY.md)
- backlog tecnico em [`docs/todo.md`](./docs/todo.md)

## Como configurar o backend

### 1. Criar o projeto no Supabase

Crie um projeto no Supabase e copie:

- `Project URL`
- `publishable key` para o app
- `secret/service role key` apenas para seed e scripts administrativos

### 2. Aplicar as migrations

Execute as migrations na ordem abaixo no Supabase:

1. [supabase/migrations/202604130001_b03_backend_persistente.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130001_b03_backend_persistente.sql:1)
2. [supabase/migrations/202604130002_b01_auth_real.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130002_b01_auth_real.sql:1)
3. [supabase/migrations/202604140003_b02_roles_iniciais.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604140003_b02_roles_iniciais.sql:1)
4. [supabase/migrations/202604140004_drop_campos_obsoletos_resources.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604140004_drop_campos_obsoletos_resources.sql:1)
5. [supabase/migrations/202604140005_b02_rls_por_papel_e_ownership.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604140005_b02_rls_por_papel_e_ownership.sql:1)
6. [supabase/migrations/202604150007_users_schema_compatibilidade.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604150007_users_schema_compatibilidade.sql:1)
7. [supabase/migrations/202604150009_username_login.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604150009_username_login.sql:1)
8. [supabase/migrations/202604150008_users_schema_limpeza.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604150008_users_schema_limpeza.sql:1)

Resumo:

- `202604130001`: cria o modelo persistente principal;
- `202604130002`: adiciona `auth_user_id` e fecha acesso anonimo;
- `202604140003`: remove `Gestor` como papel e padroniza `Solicitante`, `Operacao` e `Administrador`;
- `202604140004`: remove campos obsoletos de `public.resources`;
- `202604140005`: aplica RLS real por perfil e ownership, alem das RPCs seguras de vinculacao e cancelamento do solicitante;
- `202604150007`: adiciona compatibilidade para o novo schema simplificado de `users` e libera `cpf`/`cnh_numero` vazios;
- `202604150009`: adiciona `username`, permite `email` vazio, resolve login por `username` ou `email` e cria email tecnico interno no Auth quando o usuario nao possui email real;
- `202604150008`: remove definitivamente `name`, `area`, `email_corporativo`, `cnh_uf_emissao` e `gestor_id`.

O bloco de autenticacao e autorizacao:

- adiciona `auth_user_id` em `public.users`;
- fecha o acesso anonimo;
- deixa as tabelas operacionais acessiveis apenas por usuarios autenticados;
- restringe leitura e escrita por ownership e papel.

### 3. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local` ou `.env` e preencha:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key

# Apenas para seed e scripts administrativos locais
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
SUPABASE_AUTH_TEMP_PASSWORD=123456
```

Observacoes:

- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ir para o repositorio.
- `SUPABASE_AUTH_TEMP_PASSWORD` e usada apenas no script que cria usuarios de teste no Supabase Auth.
- O padrao do projeto agora e senha numerica com minimo de 6 digitos.

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

Regra de login atual:

- se o usuario tem `email`, o Auth usa esse email;
- se o usuario nao tem `email`, o Auth usa um email tecnico interno no formato `username@auth.sigmalithium.local`;
- no app, o login aceito para o usuario final e `username` ou `email`.

Todos os usuarios provisionados recebem a mesma senha temporaria definida em `SUPABASE_AUTH_TEMP_PASSWORD`.
No primeiro login com essa senha, o app redireciona para a tela de definicao da senha definitiva, que agora aceita senha numerica com minimo de 6 digitos.

#### Passo a passo para cadastrar um novo usuario e vincular ao Auth

1. Crie o usuario em `public.users`.
Pode ser pelo app, em `Configuracoes > Gerenciar usuarios`, ou direto no `Table Editor` do Supabase.

2. Preencha obrigatoriamente o `username`.
O `email` agora e opcional. Se ele existir, o Auth usa esse email real. Se ele ficar vazio, o sistema usa um email tecnico interno baseado no `username`.

3. Salve o cadastro do usuario em `public.users`.

4. Na raiz do projeto, rode:

```bash
npm run auth:provision:supabase
```

5. O script vai:
- ler os registros de `public.users`;
- criar a conta no `Supabase Auth` se ela ainda nao existir;
- reaproveitar a conta do `Auth` se ja existir com o mesmo login resolvido;
- gravar o `auth_user_id` em `public.users`;
- marcar `must_change_password = true` para primeiro acesso.

6. Confirme no Supabase:
- `Authentication > Users`: o usuario deve aparecer no Auth;
- `Table Editor > public.users`: a coluna `auth_user_id` deve ficar preenchida.

7. Passe ao usuario:
- o `username`;
- o `email`, se existir;
- a senha temporaria definida em `SUPABASE_AUTH_TEMP_PASSWORD`.

8. No primeiro login, o usuario entra com a senha temporaria e o app obriga a definicao da senha definitiva.

Observacao:
- se o usuario ja existir em `auth.users` com o mesmo login resolvido, o script apenas faz o vinculo;
- o app tambem tenta vincular automaticamente no primeiro login, mas o fluxo administrativo correto continua sendo rodar `npm run auth:provision:supabase`.

### 6. Resetar senha de um usuario sem email

Para listar os usuarios disponiveis para reset:

```bash
npm run auth:reset:supabase -- --list
```

Para resetar por `id` interno:

```bash
npm run auth:reset:supabase -- --user=usr-01 --password=123456
```

Para resetar por `matricula`:

```bash
npm run auth:reset:supabase -- --matricula=SIG-20451 --password=123456
```

Para resetar por `username`:

```bash
npm run auth:reset:supabase -- --username=TBIZACHA --password=123456
```

Por padrao, o reset ja marca o usuario para trocar a senha no proximo login.
Se voce quiser resetar sem forcar nova troca:

```bash
npm run auth:reset:supabase -- --user=usr-01 --password=123456 --no-force-change
```

### 7. Importar usuarios em massa de uma planilha oficial

O projeto agora tem um importador em massa com leitura de `.xlsx` e `.csv`, sem depender de seed mockada.

Dry-run:

```bash
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --dry-run
```

Aplicacao real:

```bash
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --apply
```

Comportamento:

- le a primeira aba por padrao;
- mapeia a planilha oficial para `public.users`;
- gera e persiste `username`;
- usa `email` quando ele existir;
- usa login por `username` quando o usuario nao tiver email;
- preserva usuarios ja existentes fora da planilha;
- insere ou atualiza por correspondencia de `email`, `matricula` ou `username`;
- nao apaga usuarios;
- gera relatorio de linhas prontas, ignoradas e com alerta.

Colunas esperadas da planilha:

- `NomeCompleto`
- `Gestor_Veiculo`
- `Matricula`
- `Matriz`
- `EmailCorporativo`
- `Telefone`
- `AreaDepartamento`
- `CentroCusto`
- `GestorNome`
- `CNH_Numero`
- `CNH_Categoria`
- `CNH_Status(Valida/vencida)`
- `CNH_DataUltimaValidacao`
- `CNH_Anexo`
- `Termos_Paytrack`
- `Observação`
- `Perfil`

Observacoes:

- `CPF` e `CNH_Numero` podem ficar vazios;
- usuarios sem `email` agora podem ser importados normalmente, desde que tenham `matricula`;
- se `CNH_Status` vier ausente ou invalido, o importador assume `Vencida` por seguranca;
- se `CNH_DataUltimaValidacao` vier ausente ou invalida, o importador assume a data atual e registra alerta;
- aplique primeiro as migrations `202604150007` e `202604150009` antes de usar esse comando.

## Deploy web (produção)

**App em produção:** [https://sigma-reserva.vercel.app](https://sigma-reserva.vercel.app)

Projeto Vercel: `sigma-reserva` — qualquer celular abre o link, faz login e usa o app.
Para adicionar o ícone na tela inicial: Chrome → menu ⋮ → "Adicionar à tela inicial".

### Publicar atualização

Após alterar o código, rode **um único comando** na raiz do projeto:

```bash
npm run deploy:web
```

Esse comando faz tudo: gera o bundle, vincula ao projeto `sigma-reserva` no Vercel e faz o deploy.
O link permanece o mesmo após cada deploy — não precisa repassar para os usuários.

#### Passo a passo para resetar a senha de um usuario

1. Abra o terminal na raiz do projeto.

2. Liste os usuarios disponiveis para reset:

```bash
npm run auth:reset:supabase -- --list
```

3. Escolha como vai identificar o usuario:
- por `id` interno, exemplo `usr-01`;
- por `username`, exemplo `TBIZACHA`;
- por `matricula`, exemplo `SIG-20451`.

4. Rode o reset com uma senha numerica de pelo menos 6 digitos.

Por `id`:

```bash
npm run auth:reset:supabase -- --user=usr-01 --password=123456
```

Por `matricula`:

```bash
npm run auth:reset:supabase -- --matricula=SIG-20451 --password=123456
```

Por `username`:

```bash
npm run auth:reset:supabase -- --username=TBIZACHA --password=123456
```

5. O resultado esperado no terminal e algo neste formato:
- `Senha resetada com sucesso.`
- identificacao do usuario;
- confirmacao de `Troca obrigatoria no proximo login: sim`.

6. Depois do reset, informe ao usuario:
- o `username` de login dele;
- o email, se existir;
- a nova senha temporaria.

7. No proximo acesso, o app vai obrigar a troca da senha.

Observacoes:
- se o comando disser que o usuario esta `sem-auth`, rode antes `npm run auth:provision:supabase`;
- use `--no-force-change` apenas se voce realmente nao quiser forcar troca da senha no proximo login.

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

Depois do provisionamento do Auth, use o `username` ou o `email` do usuario e a senha temporaria definida em `SUPABASE_AUTH_TEMP_PASSWORD`.

Exemplos:

- `TBIZACHA`
- `GBANDEIRA`
- `thiago.bizacha@sigmalithium.com.br`

## Validacao tecnica

Checklist automatizado desta etapa:

- `npm run typecheck`

Checklist manual recomendado para homologacao de `B03` + `B01` + `B02`:

1. Aplicar as migrations do backend na ordem documentada.
2. Rodar `npm run seed:supabase`.
3. Rodar `npm run auth:provision:supabase`.
4. Abrir o app sem sessao e confirmar que a tela inicial e o login.
5. Fazer login com `username` ou `email` e senha temporaria.
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
16. Entrar com `Solicitante` e confirmar que ele ve apenas as proprias reservas e nao faz check-in/check-out.
17. Entrar com `Operacao` e confirmar que ele faz check-in/check-out e ve operacao global.
18. Entrar com `Administrador` e confirmar acesso a gestao completa.

## Decisoes tecnicas

- `src/hooks/useAuthSession.tsx` concentra sessao, `signInWithPassword`, `signOut`, restauracao e observacao de mudancas de auth.
- `src/hooks/useAuthSession.tsx` tambem concentra a obrigacao de troca da senha temporaria e a atualizacao da senha definitiva via `Supabase Auth`.
- `src/hooks/useReservationStore.tsx` continua sendo a API de consumo das telas, mas agora depende da sessao autenticada para sincronizar o backend.
- `src/hooks/useReservationStore.tsx` tambem expoe `currentUserPermissions` e filtra acoes visiveis por papel.
- O usuario corrente deixou de vir de `EXPO_PUBLIC_DEFAULT_USER_ID`. O app resolve o colaborador pelo `auth_user_id`, com fallback pelo login resolvido (`email` real ou email tecnico derivado do `username`) para vinculo inicial.
- O app mobile persiste a sessao via AsyncStorage. Na web, a sessao usa o storage do navegador.
- O banco agora exige usuario autenticado para acessar as tabelas operacionais e aplica RLS por perfil e ownership.
- O cancelamento do `Solicitante` passa por `cancel_own_reservation`, evitando `update` amplo de reservas pelo dono.

## Limites atuais

- O app nao cria usuarios no Supabase Auth pelo frontend. O provisionamento inicial e administrativo ainda acontece por script local com chave secreta.
- O fluxo automatizado de recuperacao de senha ainda nao entrou.
- `B06`, `B07` e `B08` ainda faltam para fechar o go-live com risco controlado.

## Proximos passos

- `B05` regras operacionais minimas de elegibilidade
- `B06` tratamento real de atraso e SLA
- `B07` auditoria e historico persistido
- `B08` testes automatizados das regras centrais
- evoluir onboarding administrativo de usuarios
