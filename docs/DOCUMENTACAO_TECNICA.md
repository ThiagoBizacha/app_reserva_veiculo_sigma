# Documentacao Tecnica - Sigma Reserva de Veiculos

> Aplicativo corporativo mobile/web para reserva, vistoria e gestao de frota de veiculos.

---

## 1. Visao Geral

O **Sigma Reserva** e um aplicativo corporativo desenvolvido para a **Sigma Lithium** que digitaliza o processo de reserva de veiculos da empresa. Substitui controles manuais por um fluxo completo que inclui: consulta de disponibilidade, criacao de reserva, vistoria de saida (check-in), vistoria de devolucao (check-out), controle de manutencao e auditoria de todas as operacoes.

### Principais funcionalidades

- Autenticacao com email corporativo via Supabase Auth
- Agenda interativa com calendario mensal por veiculo
- Criacao de reservas com validacao de conflitos em tempo real
- Vistoria de saida (check-in) com checklist, fotos obrigatorias e assinatura digital
- Vistoria de devolucao (check-out) com registro de quilometragem e combustivel
- Controle de manutencao com bloqueio automatico no calendario
- Painel administrativo para gestao de frota, usuarios e indicadores
- Sincronizacao em tempo real via Supabase Realtime
- Cache local com AsyncStorage para experiencia offline-first
- Exportacao de relatorio CSV das reservas
- Log de auditoria completo de todas as operacoes

---

## 2. Stack Tecnologica

| Camada         | Tecnologia                                      |
|----------------|--------------------------------------------------|
| Framework      | React Native 0.81 + Expo SDK 54                 |
| Roteamento     | Expo Router v6 (file-based routing)              |
| Linguagem      | TypeScript 5.9 (strict mode)                     |
| Backend / BaaS | Supabase (PostgreSQL + Auth + Realtime)          |
| Estado global  | React Context API (useReservationStore)          |
| Cache local    | AsyncStorage (@react-native-async-storage)       |
| Icones         | @expo/vector-icons (Feather, MaterialCommunity)  |
| Gradientes     | expo-linear-gradient                             |
| Imagens        | expo-image-picker                                |
| Filesystem     | expo-file-system                                 |
| Plataformas    | Android, Web                                     |
| Build / Deploy | EAS Build + EAS Update (expo-updates)            |

### Versoes principais

- `react`: 19.1.0
- `react-native`: 0.81.5
- `expo`: ^54.0.0
- `@supabase/supabase-js`: ^2.103.0
- `expo-router`: ~6.0.23
- `typescript`: ~5.9.2

---

## 3. Arquitetura do Projeto

### 3.1. Estrutura de diretorios

```
app_reserva_veiculo_sigma/
|-- app/                          # Rotas (Expo Router - file-based)
|   |-- _layout.tsx               # Layout raiz (providers + auth gate)
|   |-- index.tsx                 # Rota "/" -> LoginScreen
|   |-- password-setup.tsx        # Rota "/password-setup"
|   |-- (tabs)/                   # Tab navigator
|   |   |-- _layout.tsx           # Configuracao das tabs
|   |   |-- home.tsx              # Tab Home
|   |   |-- agenda.tsx            # Tab Agenda (calendario)
|   |   |-- reservations.tsx      # Tab Minhas Reservas
|   |   |-- resources.tsx         # Tab Frota
|   |   |-- settings.tsx          # Tab Configuracoes
|   |   |-- check-flow.tsx        # Tela de vistoria (sem tab)
|   |   |-- admin.tsx             # Painel administrativo (sem tab)
|   |   |-- reservation/          # Stack aninhada para detalhes
|   |       |-- _layout.tsx
|   |       |-- [id].tsx
|   |-- operation/
|   |   |-- [id].tsx              # Vistoria de saida/devolucao
|   |-- reservation/
|   |   |-- new.tsx               # Nova reserva
|   |-- resource/
|       |-- [id].tsx              # Detalhe do veiculo
|
|-- src/
|   |-- backend/                  # Camada de acesso ao Supabase
|   |   |-- client.ts             # Singleton do Supabase client
|   |   |-- config.ts             # Leitura de variaveis de ambiente
|   |   |-- database.types.ts     # Tipagem do schema PostgreSQL
|   |   |-- mappers.ts            # Conversao Row <-> Domain model
|   |   |-- appState.ts           # Fetch + subscribe do estado remoto
|   |   |-- cache.ts              # Leitura/escrita do cache local
|   |   |-- utils.ts              # Helpers (ID generation, error messages)
|   |   |-- repositories/         # Data access layer
|   |       |-- usersRepository.ts
|   |       |-- resourcesRepository.ts
|   |       |-- reservationsRepository.ts
|   |       |-- maintenanceRepository.ts
|   |       |-- auditRepository.ts
|   |
|   |-- components/               # Componentes reutilizaveis de UI
|   |   |-- index.ts              # Barrel export
|   |   |-- Card.tsx
|   |   |-- CalendarDayCell.tsx
|   |   |-- StatusBadge.tsx
|   |   |-- FormField.tsx
|   |   |-- PrimaryButton.tsx
|   |   |-- SecondaryButton.tsx
|   |   |-- MetricCard.tsx
|   |   |-- PageHeader.tsx
|   |   |-- ScreenContainer.tsx
|   |   |-- EmptyState.tsx
|   |   |-- FilterBar.tsx
|   |   |-- FieldSelect.tsx
|   |   |-- ReservationCard.tsx
|   |   |-- ResourceCard.tsx
|   |   |-- PhotoSlotCard.tsx
|   |   |-- SignatureField.tsx
|   |   |-- OperationStepper.tsx
|   |   |-- DriverLicensePreviewModal.tsx
|   |   |-- VehicleDocumentPreviewModal.tsx
|   |   |-- BackHeaderButton.tsx
|   |   |-- ExitHeaderButton.tsx
|   |   |-- QuickActionCard.tsx
|   |   |-- SectionTitle.tsx
|   |
|   |-- screens/                  # Telas completas do app
|   |   |-- LoginScreen.tsx
|   |   |-- PasswordSetupScreen.tsx
|   |   |-- HomeScreen.tsx
|   |   |-- AgendaScreen.tsx
|   |   |-- MyReservationsScreen.tsx
|   |   |-- NewReservationScreen.tsx
|   |   |-- ReservationDetailScreen.tsx
|   |   |-- ReservationOperationScreen.tsx
|   |   |-- ResourcesScreen.tsx
|   |   |-- ResourceDetailScreen.tsx
|   |   |-- CheckFlowScreen.tsx
|   |   |-- AdminScreen.tsx
|   |   |-- SettingsScreen.tsx
|   |
|   |-- hooks/                    # Hooks de estado e logica
|   |   |-- useAuthSession.tsx    # Gerenciamento de autenticacao
|   |   |-- useReservationStore.tsx # Estado global do app
|   |
|   |-- services/
|   |   |-- reservationService.ts # Use cases (logica de negocio)
|   |
|   |-- types/                    # Tipagens TypeScript
|   |   |-- index.ts
|   |   |-- user.ts
|   |   |-- resource.ts
|   |   |-- reservation.ts
|   |
|   |-- utils/                    # Funcoes utilitarias
|   |   |-- date.ts               # Manipulacao de datas (timezone-aware)
|   |   |-- reservations.ts       # Logica de disponibilidade e conflitos
|   |   |-- reservationCode.ts    # Geracao de codigos de reserva
|   |   |-- users.ts              # Busca de usuarios
|   |   |-- operation.ts          # Helpers de vistoria
|   |   |-- export.ts             # Exportacao CSV
|   |
|   |-- theme/                    # Design tokens
|   |   |-- colors.ts
|   |   |-- spacing.ts
|   |   |-- radius.ts
|   |   |-- typography.ts
|   |   |-- shadows.ts
|   |
|   |-- constants/
|   |   |-- status.ts             # Labels de status
|   |
|   |-- data/                     # Dados mock / seed
|       |-- index.ts
|       |-- users.ts
|       |-- resources.ts
|       |-- reservations.ts
|
|-- scripts/                      # Scripts administrativos
|   |-- seed-supabase-from-mocks.mjs
|   |-- provision-supabase-auth-users.mjs
|
|-- supabase/
|   |-- migrations/               # Migrations SQL do schema
|       |-- 202604130001_b03_backend_persistente.sql
|       |-- 202604130002_b01_auth_real.sql
|
|-- assets/                       # Imagens e fontes
|-- app.json                      # Configuracao Expo
|-- package.json
|-- tsconfig.json
|-- babel.config.js
|-- .env.example
```

### 3.2. Diagrama de arquitetura em camadas

```
+---------------------------------------------------+
|                    CAMADA DE UI                    |
|  app/ (Expo Router) -> src/screens/ -> components |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|              CAMADA DE ESTADO GLOBAL              |
|  useAuthSession (Auth) + useReservationStore      |
|  (Context API com state + mutations + selectors)  |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|             CAMADA DE LOGICA DE NEGOCIO           |
|  src/services/reservationService.ts               |
|  (Use cases: create, cancel, checkin, checkout)   |
|  src/utils/ (validacoes, conflitos, datas)        |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|             CAMADA DE ACESSO A DADOS              |
|  src/backend/repositories/ (CRUD via Supabase)    |
|  src/backend/mappers.ts (Row <-> Domain)          |
|  src/backend/cache.ts (AsyncStorage)              |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                  SUPABASE (BaaS)                  |
|  PostgreSQL | Auth | Realtime | Row Level Security|
+---------------------------------------------------+
```

---

## 4. Banco de Dados (PostgreSQL via Supabase)

### 4.1. Diagrama Entidade-Relacionamento

```
+----------------+       +------------------+       +---------------------+
|     users      |       |    resources     |       | resource_unavail.   |
+----------------+       +------------------+       +---------------------+
| id (PK)        |       | id (PK)          |       | id (PK)             |
| user_id (UQ)   |       | vehicle_id (UQ)  |       | resource_id (FK)    |
| auth_user_id   |<---+  | name             |<------| type                |
| name           |    |  | code (UQ)        |       | status              |
| full_name      |    |  | category         |       | reason              |
| cpf (UQ)       |    |  | status           |       | start_at            |
| matricula (UQ) |    |  | plate (UQ)       |       | expected_end_at     |
| role           |    |  | model, brand     |       | end_at              |
| email (UQ)     |    |  | vehicle_category |       | created_by_user_id  |
| email_corp(UQ) |    |  | current_mileage  |       | ended_by_user_id    |
| gestor_id (FK) |--+ |  | location         |       +---------------------+
| cnh_*          |  | |  | requires_approval|
+----------------+  | |  +------------------+
     ^              | |         ^
     |              | |         |
     +--------------+ |  +------------------+       +---------------------+
     (self-ref)       |  |   reservations   |       | reservation_history |
                      |  +------------------+       +---------------------+
                      |  | id (PK)          |       | id (PK)             |
                      |  | code (UQ)        |       | reservation_id (FK) |
                      +--| user_id (FK)     |<------| label               |
                         | resource_id (FK) |       | timestamp           |
                         | title, purpose   |       | actor               |
                         | start_date       |       | note                |
                         | end_date         |       +---------------------+
                         | status           |
                         | check_in_data    |       +---------------------+
                         | check_out_data   |       |     audit_log       |
                         +------------------+       +---------------------+
                                                    | id (PK)             |
                                                    | entity_type         |
                                                    | entity_id           |
                                                    | action              |
                                                    | actor_user_id (FK)  |
                                                    | details (JSONB)     |
                                                    | occurred_at         |
                                                    +---------------------+
```

### 4.2. Tabelas detalhadas

#### `users` - Cadastro de colaboradores

| Coluna                    | Tipo         | Constraint               | Descricao                              |
|---------------------------|-------------|--------------------------|----------------------------------------|
| id                        | text        | PK                       | ID interno (ex: `usr-17...`)           |
| user_id                   | text        | UNIQUE                   | ID legado                               |
| auth_user_id              | uuid        | FK -> auth.users, UQ     | Vinculo com Supabase Auth              |
| name                      | text        | NOT NULL                 | Nome curto                              |
| full_name                 | text        | NOT NULL                 | Nome completo                           |
| cpf                       | text        | NOT NULL, UNIQUE         | CPF do colaborador                      |
| gestor_veiculo            | boolean     | NOT NULL, default false  | Se e gestor de veiculos                 |
| matricula                 | text        | NOT NULL, UNIQUE         | Matricula corporativa                   |
| matriz                    | text        | NOT NULL                 | Unidade/filial                          |
| role                      | text        | CHECK IN(...)            | Solicitante/Gestor/Operacao/Admin       |
| area                      | text        | NOT NULL                 | Area organizacional                     |
| area_departamento         | text        | NOT NULL                 | Departamento                            |
| centro_custo              | text        | NOT NULL                 | Centro de custo                         |
| email                     | text        | NOT NULL, UNIQUE         | Email pessoal                           |
| email_corporativo         | text        | NOT NULL, UNIQUE         | Email corporativo (login)               |
| telefone                  | text        | NOT NULL                 | Telefone                                |
| gestor_id                 | text        | FK -> users(id)          | Referencia ao gestor hierarquico        |
| cnh_numero                | text        | NOT NULL                 | Numero da CNH                           |
| cnh_categoria             | text        | NOT NULL                 | Categoria (A, B, AB, etc)               |
| cnh_uf_emissao            | text        | NOT NULL                 | UF de emissao da CNH                    |
| cnh_status                | text        | CHECK IN(Valida,Vencida) | Status de validade da CNH               |
| cnh_data_ultima_validacao | timestamptz | NOT NULL                 | Data da ultima validacao                |
| cnh_anexo                 | text        | NOT NULL, default ''     | URI do anexo da CNH                     |
| termos_paytrack           | boolean     | NOT NULL, default true   | Aceitou termos                          |
| observacao                | text        | NULL                     | Observacoes livres                      |
| created_at                | timestamptz | NOT NULL, auto           | Data de criacao                         |
| updated_at                | timestamptz | NOT NULL, trigger        | Atualizado automaticamente via trigger  |

#### `resources` - Cadastro de veiculos/recursos

| Coluna                       | Tipo         | Constraint              | Descricao                           |
|------------------------------|-------------|-------------------------|-------------------------------------|
| id                           | text        | PK                      | ID interno (ex: `res-17...`)        |
| vehicle_id                   | text        | UNIQUE                  | ID do veiculo legado                |
| name                         | text        | NOT NULL                | Nome do veiculo                     |
| code                         | text        | NOT NULL, UNIQUE        | Codigo unico                        |
| category                     | text        | CHECK IN(...)           | Veiculo/Equipamento/Material        |
| status                       | text        | CHECK IN(...)           | Disponivel/Reservado/Em uso/Manut.  |
| plate                        | text        | UNIQUE                  | Placa do veiculo                    |
| model, brand, year           | text        | NULL                    | Modelo, marca, ano                  |
| rental_company               | text        | NULL                    | Locadora responsavel                |
| vehicle_category             | text        | CHECK IN(Sedan,SUV,...) | Tipo do veiculo                     |
| current_mileage              | text        | NULL                    | Quilometragem atual                 |
| vehicle_document_attachment  | text        | NULL                    | URI do documento do veiculo         |
| vehicle_photo_attachments    | jsonb       | NOT NULL, default []    | Array de URIs de fotos              |
| location                     | text        | NOT NULL                | Local fisico do veiculo             |
| requires_approval            | boolean     | NOT NULL, default true  | Exige aprovacao para reservar       |
| tags                         | jsonb       | NOT NULL, default []    | Tags para busca                     |
| created_at / updated_at      | timestamptz | auto/trigger            | Timestamps                          |

#### `reservations` - Reservas de veiculos

| Coluna                  | Tipo           | Constraint                  | Descricao                          |
|-------------------------|---------------|-----------------------------|------------------------------------|
| id                      | text          | PK                          | ID interno (ex: `rsv-17...`)       |
| code                    | text          | NOT NULL, UNIQUE            | Codigo legivel (ex: `RSV-2604-001`)|
| resource_id             | text          | FK -> resources, RESTRICT   | Veiculo reservado                  |
| user_id                 | text          | FK -> users, RESTRICT       | Solicitante da reserva             |
| title                   | text          | NOT NULL                    | Titulo descritivo                  |
| purpose                 | text          | NOT NULL                    | Finalidade da viagem               |
| base                    | text          | NOT NULL                    | Base/local de saida                |
| start_date              | timestamptz   | NOT NULL                    | Inicio da reserva                  |
| end_date                | timestamptz   | NOT NULL, >= start_date     | Fim da reserva                     |
| planned_duration_hours  | numeric(5,2)  | NULL                        | Duracao planejada em horas         |
| status                  | text          | CHECK IN(...)               | Reservado/Em uso/Concluida/etc     |
| check_in_data           | jsonb         | NULL                        | Dados completos da vistoria saida  |
| check_out_data          | jsonb         | NULL                        | Dados completos da vistoria devol. |
| check_in_at/check_out_at| timestamptz  | NULL                        | Timestamps das vistorias           |
| start_mileage/end_mileage| text         | NULL                        | Quilometragem registrada           |
| check_in_checklist      | jsonb         | NULL                        | Checklist de saida                 |
| check_out_checklist     | jsonb         | NULL                        | Checklist de devolucao             |
| check_in_fuel_level     | text          | NULL                        | Nivel combustivel saida            |
| check_out_fuel_level    | text          | NULL                        | Nivel combustivel devolucao        |

**Constraint de exclusao (exclusion constraint)**:
```sql
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_date, end_date, '[]') WITH &&
) WHERE (status IN ('Reservado', 'Em uso', 'Em atraso'))
```
Garante que nao existam sobreposicoes de periodo para o mesmo recurso no nivel do banco de dados.

#### `reservation_history` - Historico de eventos da reserva

| Coluna         | Tipo         | Constraint               | Descricao                     |
|----------------|-------------|--------------------------|-------------------------------|
| id             | text        | PK                       | ID do evento                  |
| reservation_id | text        | FK -> reservations, CASCADE | Reserva relacionada         |
| label          | text        | NOT NULL                 | Descricao do evento           |
| timestamp      | timestamptz | NOT NULL                 | Quando ocorreu                |
| actor          | text        | NOT NULL                 | Quem executou                 |
| note           | text        | NULL                     | Observacao opcional            |

#### `resource_unavailability` - Indisponibilidades (manutencao/bloqueio)

| Coluna              | Tipo         | Constraint            | Descricao                      |
|---------------------|-------------|-----------------------|--------------------------------|
| id                  | text        | PK                    | ID do registro                 |
| resource_id         | text        | FK -> resources, CASCADE | Recurso afetado             |
| type                | text        | CHECK(maintenance/blocked) | Tipo de indisponibilidade |
| status              | text        | CHECK(active/ended)   | Se esta ativa                  |
| reason              | text        | NOT NULL              | Motivo                         |
| start_at            | timestamptz | NOT NULL              | Inicio                         |
| expected_end_at     | timestamptz | NULL                  | Previsao de termino            |
| end_at              | timestamptz | NULL                  | Quando encerrou                |
| created_by_user_id  | text        | FK -> users           | Quem criou                     |
| ended_by_user_id    | text        | FK -> users           | Quem encerrou                  |

#### `audit_log` - Log de auditoria

| Coluna        | Tipo         | Constraint    | Descricao                        |
|---------------|-------------|---------------|----------------------------------|
| id            | text        | PK            | ID do log                        |
| entity_type   | text        | NOT NULL      | Tipo (reservation, resource, user)|
| entity_id     | text        | NOT NULL      | ID da entidade afetada           |
| action        | text        | NOT NULL      | Acao (ex: reservation.created)   |
| actor_user_id | text        | FK -> users   | Quem executou                    |
| actor_name    | text        | NULL          | Nome do ator                     |
| origin        | text        | default 'mobile-app' | Origem da acao            |
| details       | jsonb       | default {}    | Dados extras da operacao         |
| occurred_at   | timestamptz | NOT NULL      | Quando ocorreu                   |

### 4.3. Indices

| Indice                                          | Tabela               | Colunas                         |
|------------------------------------------------|----------------------|---------------------------------|
| idx_users_role                                  | users                | role                            |
| idx_resources_category                          | resources            | category                        |
| idx_resources_status                            | resources            | status                          |
| idx_reservations_resource_start                 | reservations         | resource_id, start_date         |
| idx_reservations_user_start                     | reservations         | user_id, start_date             |
| idx_reservation_history_reservation_timestamp   | reservation_history  | reservation_id, timestamp DESC  |
| idx_resource_unavailability_resource_status      | resource_unavailability | resource_id, status          |
| idx_audit_log_entity                            | audit_log            | entity_type, entity_id, occurred_at DESC |
| idx_users_auth_user_id                          | users                | auth_user_id (UNIQUE WHERE NOT NULL) |

### 4.4. Seguranca (Row Level Security)

Todas as tabelas possuem RLS habilitado. Na versao atual, as policies permitem acesso completo (SELECT, INSERT, UPDATE, DELETE) para usuarios **authenticated**. O acesso **anon** foi revogado na migration de auth.

### 4.5. Realtime

As tabelas `users`, `resources`, `reservations`, `reservation_history` e `resource_unavailability` estao publicadas no Supabase Realtime para sincronizacao em tempo real.

### 4.6. Triggers

Todas as tabelas com `updated_at` possuem trigger `set_updated_at` que atualiza o campo automaticamente em cada UPDATE.

---

## 5. Autenticacao

### 5.1. Fluxo de autenticacao

```
[Login Screen]
     |
     v
signInWithPassword(email, senha)
     |
     v
Supabase Auth retorna Session
     |
     v
AuthSessionProvider armazena session no state
     |
     v
AuthNavigationGate verifica:
  - Se mustChangePassword == true -> /password-setup
  - Se autenticado -> /(tabs)/home
  - Se nao autenticado -> / (login)
     |
     v
ReservationStoreProvider:
  - Busca usuario na tabela users por email
  - Vincula auth_user_id se necessario (linkUserToAuth)
  - Carrega estado remoto (fetchRemoteAppState)
```

### 5.2. Primeiro acesso e troca de senha

1. O script `provision-supabase-auth-users.mjs` cria usuarios no Supabase Auth com senha temporaria
2. Cada usuario recebe `user_metadata.must_change_password = true`
3. No primeiro login, o `AuthNavigationGate` redireciona para `/password-setup`
4. Apos definir nova senha, `updateUser` atualiza metadata com `must_change_password = false`
5. O app libera acesso completo

### 5.3. Persistencia de sessao

- **Mobile (Android)**: sessao persistida via AsyncStorage
- **Web**: sessao persistida no storage padrao do browser
- **Auto-refresh**: token e renovado automaticamente
- **App state**: quando o app volta ao foreground, `startAutoRefresh()` e chamado

---

## 6. Frontend (Telas e Navegacao)

### 6.1. Estrutura de navegacao

```
RootLayout (_layout.tsx)
|-- AuthSessionProvider
|-- ReservationStoreProvider
|
|-- / (index.tsx) -> LoginScreen
|-- /password-setup -> PasswordSetupScreen
|
|-- /(tabs)/ -> Tab Navigator
|   |-- home -> HomeScreen
|   |-- agenda -> AgendaScreen
|   |-- reservations -> MyReservationsScreen
|   |-- resources -> ResourcesScreen
|   |-- settings -> SettingsScreen
|   |-- check-flow -> CheckFlowScreen (sem tab visivel)
|   |-- admin -> AdminScreen (sem tab visivel)
|   |-- reservation/[id] -> ReservationDetailScreen
|
|-- /operation/[id] -> ReservationOperationScreen
|-- /reservation/new -> NewReservationScreen
|-- /resource/[id] -> ResourceDetailScreen
```

### 6.2. Tabs visiveis na barra inferior

| Tab       | Icone    | Tela                  |
|-----------|----------|-----------------------|
| Home      | home     | HomeScreen            |
| Agenda    | calendar | AgendaScreen          |
| Reservas  | bookmark | MyReservationsScreen  |
| Frota     | truck    | ResourcesScreen       |
| Config.   | settings | SettingsScreen        |

### 6.3. Descricao das telas

#### LoginScreen
- Tela de login com gradiente verde escuro e logo Sigma
- Campos de email corporativo e senha
- Validacao de backend configurado
- Feedback de erro de autenticacao
- Responsiva (adapta layout para telas pequenas)

#### PasswordSetupScreen
- Formulario para troca de senha obrigatoria ou voluntaria
- Validacao: senha numerica com minimo de 6 digitos, confirmacao
- Botao "Sair" no primeiro acesso

#### HomeScreen
- Header com gradiente, nome do usuario e botao de logout
- Card do perfil: nome, matricula, departamento, gestor, status CNH
- Card principal: "Reservar veiculo" (link para agenda)
- Atalhos: Minhas Reservas, Frota, Painel da Frota
- Badges com contadores (reservas ativas, veiculos livres)

#### AgendaScreen
- Seletor de veiculo (modal com lista completa)
- Resumo do veiculo selecionado (placa, marca, km, status)
- Calendario mensal interativo com navegacao de mes
- Celulas coloridas por estado: disponivel/reservado/em uso/manutencao
- Card do dia selecionado com descricao e acoes
- Lista de reservas do dia
- Acao "Escolher horario neste dia" -> NewReservationScreen

#### MyReservationsScreen
- Filtros por aba: Ativas, Em uso, Concluidas, Canceladas
- Cards de reserva com codigo, veiculo, periodo, finalidade
- Acoes contextuais: ver detalhes, iniciar vistoria, registrar devolucao
- FAB para acessar agenda rapidamente

#### NewReservationScreen
- Formulario: veiculo, data/hora inicio, data/hora fim, finalidade, base, observacoes
- Validacoes: data futura, mesmo dia, duracao 1-4h, conflitos, manutencao
- Geracao automatica de codigo sequencial

#### ReservationDetailScreen
- Exibicao completa da reserva com todos os dados
- Historico de eventos (timeline)
- Dados de vistoria de saida e devolucao
- Acoes: cancelar, iniciar check-in, registrar check-out

#### ReservationOperationScreen (Vistoria)
- Stepper com etapas: Dados, Checklist, Fotos, Avarias, Confirmacao, Assinatura
- Registro de quilometragem e nivel de combustivel
- Checklist: veiculo limpo, tanque cheio, documentos, estepe, avarias
- 4 fotos obrigatorias (frente, traseira, esquerda, direita)
- Fotos adicionais e fotos de avarias
- Campo de assinatura digital (canvas touch)
- Nome do responsavel pela entrega/recepcao
- Checkbox de confirmacao

#### ResourcesScreen
- Lista de veiculos com busca e filtro por status
- Cards com nome, placa, categoria, km, status em tempo real
- Acoes: ver detalhes, abrir agenda do veiculo

#### ResourceDetailScreen
- Dados completos do veiculo
- Historico de reservas
- Fotos e documentos
- Acao de manutenção (toggle)

#### AdminScreen (Painel da Frota)
- Indicadores: total, disponiveis, reservados, em uso, manutencao
- Alertas operacionais
- Cadastro de veiculos e usuarios
- Exportacao de relatorio CSV

#### SettingsScreen
- Cadastro e edicao de veiculos (formulario completo)
- Cadastro e edicao de usuarios (formulario completo com dados de CNH)
- Vinculacao de gestor por nome/email/matricula
- Toggle de manutencao por veiculo
- Exportacao de reservas para CSV
- Dados de sincronizacao e backend

#### CheckFlowScreen
- Tela dedicada para fluxo de vistoria operacional

---

## 7. Gerenciamento de Estado

### 7.1. AuthSessionProvider (`useAuthSession`)

Gerencia o ciclo de vida da sessao de autenticacao:

| Propriedade         | Tipo                | Descricao                                  |
|---------------------|---------------------|--------------------------------------------|
| session             | Session | null      | Sessao Supabase ativa                      |
| authUser            | SupabaseAuthUser    | Usuario autenticado                        |
| isAuthenticated     | boolean             | Se ha sessao ativa                         |
| mustChangePassword  | boolean             | Se precisa trocar senha (primeiro acesso)  |
| isReady             | boolean             | Se bootstrap da sessao foi concluido       |
| isSubmitting        | boolean             | Se ha operacao de auth em andamento        |
| authError           | string | null       | Mensagem de erro de auth                   |
| signInWithPassword  | function            | Login com email + senha                    |
| updatePassword      | function            | Troca de senha                             |
| signOut             | function            | Encerrar sessao                            |

### 7.2. ReservationStoreProvider (`useReservationStore`)

Estado global do app com dados, mutacoes e selectors:

**Dados:**
- `users: User[]` - Lista de colaboradores
- `resources: Resource[]` - Lista de veiculos
- `reservations: Reservation[]` - Lista de reservas
- `currentUser: User` - Usuario logado (vinculado por email)
- `currentUserId: string` / `currentUserName: string`

**Estado de controle:**
- `isBootstrapping` - Carregamento inicial
- `isRefreshing` - Sincronizacao em andamento
- `isMutating` - Operacao de escrita em andamento
- `isUsingCachedData` - Usando dados do cache local
- `syncError` - Erro de sincronizacao
- `lastSyncedAt` - Timestamp da ultima sincronizacao

**Mutacoes (todas retornam `ActionResult`):**
- `createVehicle(payload)` - Cadastrar veiculo
- `updateVehicle(id, payload)` - Atualizar veiculo
- `createUser(payload)` - Cadastrar usuario
- `updateUser(id, payload)` - Atualizar usuario
- `createReservation(payload)` - Criar reserva
- `cancelReservation(id)` - Cancelar reserva
- `checkInReservation(id, payload)` - Vistoria de saida
- `checkOutReservation(id, payload)` - Vistoria de devolucao
- `toggleResourceMaintenance(id)` - Ativar/desativar manutencao
- `exportReservationsReport()` - Gerar CSV

**Selectors:**
- `getResourceStatus(id, date)` - Status calculado do recurso
- `getReservationsForResource(id)` - Reservas de um recurso
- `getReservationsForDay(id, date)` - Reservas de um dia
- `getAvailabilityForDate(id, date)` - Disponibilidade de um dia
- `getActionableReservations()` - Reservas com acao pendente
- `getSummary(date)` - Indicadores da frota

### 7.3. Fluxo de sincronizacao

```
1. Bootstrap: Le cache local (AsyncStorage) -> Exibe dados imediatamente
2. Fetch remoto: fetchRemoteAppState() -> Atualiza state + cache
3. Realtime: Supabase Realtime postgres_changes -> Debounce 350ms -> Refresh silencioso
4. App resume: AppState "active" -> Refresh silencioso
5. Apos mutacao: Merge otimista no state -> Refresh silencioso
```

---

## 8. Logica de Negocio (Service Layer)

O arquivo `src/services/reservationService.ts` contem os **use cases** com toda a logica de negocio:

### 8.1. Ciclo de vida da reserva

```
                 Reservado
                    |
         +----------+----------+
         |                     |
    [Check-in]            [Cancelar]
         |                     |
       Em uso              Cancelada
         |
    [Check-out]
         |
      Concluida
```

### 8.2. Use cases

| Use case                         | Descricao                                        | Validacoes principais                              |
|----------------------------------|--------------------------------------------------|----------------------------------------------------|
| `createReservationUseCase`       | Cria nova reserva com status "Reservado"         | Campos obrigatorios, data futura, mesmo dia, 1-4h, sem conflito, sem manutencao |
| `cancelReservationUseCase`       | Cancela reserva com status "Reservado"           | Status deve ser "Reservado", janela nao encerrada  |
| `checkInReservationUseCase`      | Registra vistoria de saida, muda para "Em uso"   | Status "Reservado", mileagem, combustivel, assinatura, counterparty |
| `checkOutReservationUseCase`     | Registra vistoria de devolucao, muda para "Concluida" | Status "Em uso", mileagem >= saida, assinatura |
| `createVehicleUseCase`           | Cadastra novo veiculo                            | Campos obrigatorios, codigo/placa unicos           |
| `updateVehicleUseCase`           | Atualiza veiculo existente                       | Veiculo existe, unicidade mantida                  |
| `createUserUseCase`              | Cadastra novo usuario                            | Campos obrigatorios, matricula/email/CPF unicos    |
| `updateUserUseCase`              | Atualiza usuario existente                       | Usuario existe, unicidade mantida                  |
| `toggleResourceMaintenanceUseCase` | Alterna manutencao do veiculo                  | Veiculo existe, cria/encerra registro em resource_unavailability |
| `exportReservationsReportUseCase`  | Gera arquivo CSV para download                 | -                                                  |

### 8.3. Regras de negocio

1. **Conflito de reserva**: Nao permite sobreposicao de periodos para o mesmo recurso (validado no app E no banco via exclusion constraint)
2. **Duracao**: Reserva deve ter entre 1 e 4 horas
3. **Mesmo dia**: Inicio e fim devem ser no mesmo dia calendario
4. **Data futura**: Nao permite reserva no passado
5. **Manutencao**: Recurso em manutencao nao pode ser reservado
6. **Cancelamento**: Apenas reservas com status "Reservado" e janela nao expirada
7. **Check-in**: Exige quilometragem, combustivel, fotos, assinatura e confirmacao
8. **Check-out**: Quilometragem final >= quilometragem de saida
9. **Avarias**: Se identificada, exige descricao e foto obrigatoria
10. **Auditoria**: Toda operacao gera entrada no `audit_log`

---

## 9. Tipagens do Dominio

### 9.1. User

```typescript
interface User {
  id: string;
  userId: string;
  authUserId?: string;        // Vinculo com Supabase Auth
  name: string;
  fullName: string;
  cpf: string;
  gestorVeiculo: boolean;
  matricula: string;
  matriz: string;
  role: "Solicitante" | "Gestor" | "Operacao" | "Administrador";
  area: string;
  areaDepartamento: string;
  centroCusto: string;
  email: string;
  emailCorporativo: string;
  telefone: string;
  gestorId?: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhUfEmissao: string;
  cnhStatus: "Valida" | "Vencida";
  cnhDataUltimaValidacao: string;
  cnhAnexo: string;
  termosPaytrack: boolean;
  observacao?: string;
}
```

### 9.2. Resource (Veiculo)

```typescript
interface Resource {
  id: string;
  vehicleId?: string;
  name: string;
  code: string;
  category: "Veiculo" | "Equipamento" | "Material";
  status: "Disponivel" | "Em uso" | "Reservado" | "Manutencao";
  plate?: string;
  model?: string;
  brand?: string;
  year?: string;
  rentalCompany?: string;
  vehicleCategory?: "Sedan" | "SUV" | "Pickup";
  currentMileage?: string;
  location: string;
  description: string;
  requiresApproval: boolean;
  tags: string[];
  // ... outros campos de manutencao e documentos
}
```

### 9.3. Reservation

```typescript
interface Reservation {
  id: string;
  code: string;                    // Ex: "RSV-2604-001"
  resourceId: string;
  userId: string;
  title: string;
  purpose: string;
  base: string;
  startDate: string;               // ISO 8601
  endDate: string;
  plannedDurationHours?: number;
  status: "Reservado" | "Em uso" | "Concluida" | "Cancelada" | "Em atraso";
  checkInData?: ReservationInspection;   // Dados completos da vistoria de saida
  checkOutData?: ReservationInspection;  // Dados completos da vistoria de devolucao
  history: ReservationHistoryItem[];
  // ... campos de checklist, combustivel, quilometragem
}
```

### 9.4. ReservationInspection (Vistoria)

```typescript
interface ReservationInspection {
  mode: "checkin" | "checkout";
  inspectedAt: string;
  inspectedBy: string;
  counterpartyName: string;         // Quem entregou/recebeu
  mileage: string;
  fuelLevel: "Vazio" | "1/4" | "1/2" | "3/4" | "Cheio";
  checklist: ReservationChecklist;
  notes?: string;
  requiredPhotos: {                 // 4 posicoes obrigatorias
    front?: OperationPhoto;
    rear?: OperationPhoto;
    left?: OperationPhoto;
    right?: OperationPhoto;
  };
  additionalPhotos: OperationPhoto[];
  damagePhotos: OperationPhoto[];
  damageIdentified: boolean;
  damageDescription?: string;
  confirmationChecked: boolean;
  signature: OperationSignature;    // Assinatura digital (strokes)
}
```

---

## 10. Utilitarios

### 10.1. Manipulacao de datas (`src/utils/date.ts`)

Todas as operacoes de data sao **timezone-aware** usando `America/Sao_Paulo`:

| Funcao                          | Descricao                                    |
|---------------------------------|----------------------------------------------|
| `createDateInAppTimeZone()`     | Cria Date no fuso de SP                      |
| `getAppDateParts()`             | Extrai ano/mes/dia no fuso de SP             |
| `formatDate()` / `formatDateTime()` | Formata em pt-BR                        |
| `getMonthMatrix()`              | Gera array de 42 dias para calendario        |
| `startOfDay()` / `startOfMonth()` | Normaliza para inicio do dia/mes          |
| `isSameDay()` / `isWithinRange()` | Comparacoes de data                       |
| `getDurationHours()`            | Calcula duracao entre datas em horas         |
| `addHours()` / `addMonths()`    | Aritmetica de datas                          |

### 10.2. Logica de reservas (`src/utils/reservations.ts`)

| Funcao                               | Descricao                                         |
|--------------------------------------|----------------------------------------------------|
| `getResourceConflicts()`             | Detecta sobreposicao de periodo                    |
| `getCurrentResourceStatus()`         | Status calculado do recurso em tempo real           |
| `getCalendarDayStateForResource()`   | Estado do dia no calendario (prioridade de status)  |
| `getFleetSummary()`                  | Indicadores da frota (total, livres, etc)           |
| `getActionableReservationsForUser()` | Reservas que exigem acao do usuario                 |
| `isScheduledReservationActive()`     | Se reserva "Reservado" ainda esta na janela         |
| `getResourceAvailabilityForDate()`   | Disponibilidade completa de um dia                  |

---

## 11. Design System / Theme

### 11.1. Paleta de cores

| Token         | Hex       | Uso                          |
|---------------|-----------|------------------------------|
| primaryDark   | #1F4D12   | Botoes primarios, headers    |
| primary       | #3F8A24   | Bordas ativas, badges        |
| primarySoft   | #EAF4E5   | Backgrounds suaves           |
| background    | #F5F7F6   | Fundo geral do app           |
| surface       | #FFFFFF   | Cards e containers           |
| text          | #152013   | Texto principal              |
| textSecondary | #5F6B61   | Texto auxiliar               |
| success       | #2F8F3A   | Status disponivel            |
| warning       | #E59A2F   | Status em uso                |
| danger        | #D64545   | Status manutencao, erros     |
| info          | #5E8DEE   | Status reservado             |

### 11.2. Cores do calendario

| Estado      | Cor       | Hex       |
|-------------|-----------|-----------|
| Disponivel  | Verde claro  | #DCEAD7 |
| Reservado   | Verde medio  | #A8D2A4 |
| Em uso      | Amarelo      | #FFD08A |
| Manutencao  | Vermelho claro | #F2BBBB |

---

## 12. Scripts Administrativos

### 12.1. `seed-supabase-from-mocks.mjs`

Popula o banco de dados do Supabase com dados mock:
- Le arrays exportados de `src/data/users.ts`, `resources.ts`, `reservations.ts`
- Converte para formato de banco (snake_case)
- Upsert via Supabase client com service role key

```bash
npm run seed:supabase
```

**Requer**: `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`

### 12.2. `provision-supabase-auth-users.mjs`

Cria contas de autenticacao no Supabase Auth para todos os usuarios:
- Le usuarios da tabela `public.users`
- Cria usuario no Supabase Auth com email_corporativo e senha temporaria
- Define `must_change_password: true` no metadata
- Vincula `auth_user_id` na tabela users

```bash
npm run auth:provision:supabase
```

**Requer**: `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_AUTH_TEMP_PASSWORD` no `.env.local`

---

### 12.3. `reset-supabase-auth-password.mjs`

Reseta a senha de qualquer usuario no `Supabase Auth` sem depender de email:
- lista usuarios disponiveis para reset
- busca por `id` interno ou `matricula`
- redefine a senha diretamente no Auth
- opcionalmente mantem `must_change_password = true` para forcar troca no proximo login

```bash
npm run auth:reset:supabase -- --list
npm run auth:reset:supabase -- --user=usr-01 --password=123456
npm run auth:reset:supabase -- --matricula=SIG-20451 --password=123456
```

**Requer**: `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`

---

## 13. Variaveis de Ambiente

| Variavel                        | Contexto      | Descricao                                     |
|---------------------------------|---------------|-----------------------------------------------|
| `EXPO_PUBLIC_SUPABASE_URL`      | App Expo      | URL do projeto Supabase                       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | App Expo      | Chave anonima do Supabase                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Scripts only  | Chave admin do Supabase (NUNCA no app)        |
| `SUPABASE_AUTH_TEMP_PASSWORD`   | Scripts only  | Senha temporaria numerica (minimo 6 digitos)  |

---

## 14. Build e Deploy

### 14.1. Desenvolvimento local

```bash
npm install              # Instalar dependencias
npm run start            # Iniciar Expo dev server
npm run web              # Abrir no browser
npm run android          # Abrir no emulador Android
```

### 14.2. Configuracao Expo

- **Nome**: Sigma Reserva
- **Package**: `com.sigma.reserva`
- **Plataformas**: Android, Web
- **Orientacao**: Portrait
- **EAS Project ID**: `06d96258-f496-4b9e-a0d8-5f36cb573831`
- **Updates OTA**: Habilitado via `expo-updates`

### 14.3. Provisionamento do backend

```bash
# 1. Executar migrations no Supabase Dashboard (SQL Editor)
#    -> supabase/migrations/202604130001_b03_backend_persistente.sql
#    -> supabase/migrations/202604130002_b01_auth_real.sql

# 2. Popular dados iniciais
npm run seed:supabase

# 3. Criar contas de autenticacao
npm run auth:provision:supabase
```

---

## 15. Fluxos Principais

### 15.1. Criar reserva

1. Usuario acessa Agenda -> seleciona veiculo -> seleciona dia
2. Clica "Escolher horario neste dia"
3. Preenche formulario (hora inicio/fim, finalidade, base)
4. App valida: data futura, mesmo dia, 1-4h, sem conflito
5. Reserva criada com status "Reservado"
6. Historico e audit_log registrados

### 15.2. Vistoria de saida (Check-in)

1. Usuario acessa "Minhas Reservas" -> clica "Iniciar vistoria de saida"
2. Preenche stepper:
   - Quilometragem e combustivel
   - Checklist de condicao
   - 4 fotos obrigatorias + extras
   - Avarias (se houver: descricao + fotos)
   - Checkbox de confirmacao
   - Assinatura digital + nome do responsavel
3. Status muda para "Em uso"

### 15.3. Vistoria de devolucao (Check-out)

1. Usuario acessa reserva "Em uso" -> clica "Registrar devolucao"
2. Preenche stepper similar ao check-in
3. Valida: km final >= km saida
4. Status muda para "Concluida"

### 15.4. Manutencao

1. Administrador acessa painel ou detalhes do veiculo
2. Toggle "Manutenção" cria registro em `resource_unavailability`
3. Calendario exibe dias em vermelho (previsao: 72h)
4. Reservas nao podem ser criadas para periodo de manutencao
5. Encerrar manutencao atualiza status para "ended"

---

## 16. Perfis de Usuario

| Role          | Permissoes                                                    |
|---------------|---------------------------------------------------------------|
| Solicitante   | Consultar disponibilidade, criar reserva, acompanhar status, cancelar, check-in/check-out |
| Gestor        | Tudo do Solicitante + visao de area                           |
| Operacao      | Tudo do Solicitante + registrar vistorias                     |
| Administrador | Tudo + cadastrar veiculos/usuarios, manutencao, painel, exportacao |

---

## 17. Componentes Reutilizaveis

| Componente                     | Descricao                                        |
|--------------------------------|--------------------------------------------------|
| `ScreenContainer`              | Wrapper com ScrollView, padding e background     |
| `PageHeader`                   | Header padrao com titulo, eyebrow e acoes        |
| `Card`                         | Container com borda, sombra e border-radius      |
| `PrimaryButton`                | Botao principal (verde escuro, pill)              |
| `SecondaryButton`              | Botao secundario (outline)                        |
| `FormField`                    | Input com label                                   |
| `FieldSelect`                  | Select/dropdown customizado                       |
| `StatusBadge`                  | Badge colorido por status (recurso ou reserva)    |
| `MetricCard`                   | Card numerico para indicadores                    |
| `CalendarDayCell`              | Celula do calendario com cor por estado           |
| `EmptyState`                   | Placeholder quando lista vazia                    |
| `FilterBar`                    | Barra de filtros horizontais                      |
| `ReservationCard`              | Card completo de reserva                          |
| `ResourceCard`                 | Card completo de recurso                          |
| `PhotoSlotCard`                | Slot para captura de foto (obrigatoria/adicional) |
| `SignatureField`               | Canvas de assinatura digital touch                |
| `OperationStepper`             | Stepper de etapas da vistoria                     |
| `DriverLicensePreviewModal`    | Modal de preview da CNH                           |
| `VehicleDocumentPreviewModal`  | Modal de preview de documento do veiculo          |
| `BackHeaderButton`             | Botao de voltar no header                         |
| `ExitHeaderButton`             | Botao de sair no header                           |

---

## 18. Prioridade de Status no Calendario

Quando ha mais de um status no mesmo dia para um recurso, a prioridade visual e:

1. **Manutencao** (vermelho) - maior prioridade
2. **Em uso** (amarelo)
3. **Reservado** (verde medio)
4. **Disponivel** (verde claro) - menor prioridade

---

## 19. Consideracoes de Performance

1. **Cache-first**: App exibe dados do AsyncStorage imediatamente enquanto busca dados remotos
2. **Debounce no Realtime**: Eventos de Realtime sao debounced em 350ms para evitar refreshes excessivos
3. **Merge otimista**: Apos mutacoes, o state local e atualizado imediatamente sem esperar refresh completo
4. **Promise.all**: Queries paralelas para users, resources e reservations no bootstrap
5. **startTransition**: Updates de estado usam React 19 startTransition para evitar jank
6. **Memoizacao**: useMemo e useCallback em selectors e mutations do store

---

## 20. Extensoes PostgreSQL

| Extensao    | Uso                                              |
|-------------|--------------------------------------------------|
| `pgcrypto`  | Funcoes criptograficas                           |
| `btree_gist`| Necessaria para exclusion constraint com GiST    |

---
