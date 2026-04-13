# Sigma Reserva

Aplicativo interno em React Native + Expo para reserva corporativa de veiculos. A etapa `B03` foi iniciada com backend persistente e multiusuario usando Supabase como fonte unica de verdade.

## Estado atual

O app agora foi estruturado para:

- carregar `users`, `resources`, `reservations` e `reservation_history` a partir do backend;
- manter `AsyncStorage` apenas como cache auxiliar de leitura;
- sincronizar o store central com backend remoto e realtime;
- persistir criacao de reserva, cancelamento, check-in, check-out, cadastro de usuario e cadastro de veiculo;
- refletir a mesma fonte de verdade em Agenda, Minhas Reservas, Frota, Painel e Detalhes.

`src/data/*` continua no repositorio apenas como insumo de seed inicial do backend. Nao e mais fluxo operacional do app.

## Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase (`@supabase/supabase-js`)
- AsyncStorage apenas como cache auxiliar

## Estrutura relevante

```text
app/
src/
  backend/
    appState.ts
    cache.ts
    client.ts
    config.ts
    database.types.ts
    mappers.ts
    repositories/
  hooks/
    useReservationStore.tsx
  screens/
  services/
    reservationService.ts
supabase/
  migrations/
scripts/
  seed-supabase-from-mocks.mjs
.env.example
README.md
```

## Como configurar o backend

### 1. Criar o projeto no Supabase

Crie um projeto no Supabase e copie:

- `Project URL`
- `anon/public key`
- `service role key` apenas para seed local

### 2. Aplicar a migration

Use a migration em [supabase/migrations/202604130001_b03_backend_persistente.sql](/c:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130001_b03_backend_persistente.sql:1).

Voce pode aplicar de duas formas:

1. SQL Editor do Supabase
   Cole o arquivo inteiro e execute.
2. Supabase CLI
   Se a CLI estiver configurada, rode a migration no ambiente desejado.

Observacao:

- A migration ja cria as tabelas operacionais, historico, auditoria, indisponibilidade e a restricao de nao sobreposicao de reservas ativas por veiculo.
- O schema habilita RLS com politicas temporariamente abertas para `anon` e `authenticated`. Isso e intencional para fechar `B03` e destravar `B01`/`B02` depois.

### 3. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local` ou `.env` e preencha:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_DEFAULT_USER_ID=usr-01

# Somente para seed local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Popular o backend inicial

Depois de aplicar a migration, rode:

```bash
node scripts/seed-supabase-from-mocks.mjs
```

Esse script:

- le `src/data/users.ts`;
- le `src/data/resources.ts`;
- le `src/data/reservations.ts`;
- faz `upsert` no Supabase para bootstrap inicial.

## Como rodar o app

1. Instale as dependencias:

```bash
npm install
```

2. Configure o backend via `.env.local`.

3. Inicie o app:

```bash
npm run android
```

Ou:

```bash
npm run start
```

Se o backend nao estiver configurado, o app mostra um estado bloqueante de setup em vez de voltar para mocks locais.

## Decisoes tecnicas

- O store central em `src/hooks/useReservationStore.tsx` continua sendo a API de consumo das telas, mas deixou de ser a camada de persistencia.
- A leitura remota foi separada em `src/backend/*` com cliente, mapeadores, cache e repositorios.
- As regras de negocio de mutacao foram extraidas para `src/services/reservationService.ts`.
- O cache local agora e derivado do backend e usado apenas para acelerar bootstrap ou sobreviver a falhas temporarias de sincronizacao.
- A consistencia entre telas depende do mesmo snapshot em memoria e de refresh remoto apos mutacoes, alem de subscription de realtime do Supabase.
- O banco passou a impor a regra critica de nao sobreposicao de reservas ativas para o mesmo veiculo.

## Validacao tecnica

Checklist executado nesta etapa:

- `npm run typecheck`

Validacao adicional recomendada apos preencher o backend real:

1. Criar o schema no Supabase.
2. Rodar a seed inicial.
3. Abrir o app.
4. Criar uma reserva.
5. Reiniciar o app.
6. Confirmar a mesma reserva em Minhas Reservas, Agenda, Frota e Detalhe.
7. Fazer check-in.
8. Confirmar status `Em uso` nas mesmas telas.
9. Fazer check-out.
10. Confirmar status `Concluida` e veiculo disponivel.

## Proximos passos

- `B01` autenticacao real e gestao de sessao
- `B02` autorizacao por perfil e ownership
- endurecer politicas RLS por usuario, papel e ownership
- substituir a sessao simulada por identidade real do Supabase/Auth corporativo

