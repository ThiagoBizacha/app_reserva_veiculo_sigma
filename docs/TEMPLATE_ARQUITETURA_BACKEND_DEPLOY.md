# Template de Arquitetura de Backend, Auth, Segurança e Deploy

## 1. Resumo Executivo

O app de referência implementa um template claro de arquitetura `client-centric + Supabase BaaS`: frontend Expo/React para mobile e web, acesso direto ao Supabase via `supabase-js`, regras críticas protegidas por RLS/constraints/triggers no banco, sincronização multi-device por `Realtime`, deploy web estático na Vercel e scripts administrativos separados do runtime para seed, provisionamento de usuários e reset de senha.

As decisões arquiteturais mais relevantes são: ausência de backend custom tradicional, centralização da lógica em `services` + `repositories` no cliente, Supabase como fonte única de verdade, autorização híbrida por `role + ownership`, histórico funcional separado de trilha de auditoria, e segregação entre credenciais públicas do app e `service_role` usada apenas em automações administrativas.

Os principais riscos/limitações do app de referência são: não existe camada de storage compartilhado madura para anexos; o deploy é manual e sem CI/CD; o flag de primeiro acesso usa `user_metadata`; existe RPC pré-auth para resolver login por `username`; não há staging real evidenciado; não há observabilidade operacional além de `audit_log` e logs de CLI.

## 2. Documento de Arquitetura Base

Arquitetura alvo genérica:

```text
Web/Mobile Client
  -> Auth/session provider
  -> Global store / sync orchestrator
  -> Service layer (use cases)
  -> Repository layer + mappers
  -> Supabase JS SDK

Supabase
  -> Auth
  -> Postgres (Data API + RPC)
  -> Realtime
  -> Storage (recomendado no template alvo; insuficiente no app de referência)

Admin/Ops scripts
  -> seed
  -> importação de cadastros
  -> provisionamento Auth
  -> reset de senha

Hosting/Delivery
  -> Vercel para web estático
  -> EAS para build/update mobile
```

Componentes e responsabilidades:

- `Frontend`: renderiza UI, mantém sessão local, chama use cases e consome estado sincronizado.
- `Auth layer`: restaura sessão, observa mudanças de auth, faz login/logout e obriga setup de senha no primeiro acesso.
- `Global store`: carrega cache local, faz fetch remoto, faz merge otimista após mutações e coordena subscriptions.
- `Service layer`: concentra regras de aplicação, autorização em nível de tela/ação e composição de histórico/auditoria.
- `Repository layer`: encapsula acesso a tabelas, RPCs e mapeamento `camelCase <-> snake_case`.
- `Database`: impõe constraints, triggers, RLS e RPCs seguras.
- `Scripts administrativos`: executam operações privilegiadas fora do runtime do app.
- `Vercel`: hospeda somente o bundle web; não hospeda a lógica de backend deste template.
- `Supabase`: é o backend operacional real.

Fluxos principais:

- `Login`: usuário informa `username` ou `email`; o app resolve o identificador aceito pelo Auth e então chama `signInWithPassword`.
- `Bootstrap`: app restaura sessão, lê cache local, busca snapshot remoto e passa a assinar mudanças via `Realtime`.
- `Mutação`: tela chama `service`, `service` valida e persiste via `repository`, atualiza estado local e dispara refresh silencioso.
- `Provisionamento`: administrador cadastra usuário no banco e roda script com `service_role` para criar/sincronizar conta no Supabase Auth.
- `Deploy web`: app gera export estático e publica a pasta `dist` na Vercel com rewrite para SPA.

Padrão de API e comunicação:

- Não existe REST API própria nem BFF no app de referência.
- O “backend contract” é o conjunto de tabelas, políticas, triggers e RPCs do Supabase.
- CRUD simples vai direto para tabelas via SDK.
- Operações sensíveis ou que exigem privilégio controlado usam RPCs dedicadas.
- A validação é em duas camadas: `service layer` no cliente e regras/constraints/triggers no banco.

Sincronização multi-device:

- O padrão é `cache-first read`, não `offline-first` completo.
- A consistência entre dispositivos vem da combinação `fonte única remota + Realtime + refresh em foreground`.
- Conflitos críticos de agenda são barrados no banco por `exclusion constraint` e trigger de regras operacionais.
- Não existe fila offline de escrita nem resolução explícita de conflito além do que o banco rejeita.
- Assinaturas vetoriais em JSON sincronizam bem; anexos binários não.

O que é estrutural e deve ser replicado:

- `service/repository/mappers/hooks` como fronteira interna do frontend.
- Supabase como backend direto para CRUD e leitura sincronizada.
- RLS em todas as tabelas expostas.
- RPCs mínimas para ações privilegiadas.
- Auditoria e histórico separados.
- Scripts administrativos fora do runtime do app.

O que não deve ser replicado como padrão:

- Persistência de anexos como `uri` local dentro de JSON.
- Pipeline manual de deploy sem validações automáticas.
- Dependência de `user_metadata` para uma trava de segurança.
- Acoplamento de preview e produção ao mesmo projeto Supabase.

## 3. Documento de Banco de Dados

Entidades genéricas do template:

- `users`: identidade interna da aplicação, vinculada a `auth.users` por `auth_user_id`.
- `resources`: catálogo de objetos controlados pelo domínio.
- `transactions`: tabela transacional principal do domínio.
- `transaction_history`: histórico funcional cronológico por transação.
- `resource_unavailability`: bloqueios, manutenção, janelas operacionais ou indisponibilidade.
- `audit_log`: trilha administrativa/técnica de ações relevantes.

Padrões de modelagem observados:

- Tabelas no schema `public` com `snake_case`.
- `created_at` e `updated_at` em quase todas as tabelas, com trigger para `updated_at`.
- `FKs` explícitas entre transações, recursos e usuários.
- `unique constraints` para identificadores naturais relevantes.
- Índices operacionais em combinações de filtro recorrente.
- Uso de `jsonb` para payloads complexos e operacionais.
- Constraint de não sobreposição de janelas usando `exclude using gist` em períodos ativos.

Convenções recomendadas para replicação:

- Preservar o padrão `auth_user_id -> auth.users(id)` como vínculo entre Auth e perfil interno.
- Preservar `history` e `audit_log` como conceitos distintos.
- Preservar tabela de indisponibilidade separada em vez de inferir tudo pelo status do recurso.
- Preservar constraints temporais no banco, não apenas no frontend.
- Preservar versionamento de schema via migrations SQL sequenciais.

Ajustes que eu faria no template alvo:

- Trocar IDs textuais gerados no cliente por `uuid`/`ulid` gerado no banco, salvo se houver requisito forte de criação offline.
- Evitar `jsonb` para dados que precisem consulta analítica frequente; manter JSON apenas para payloads realmente flexíveis.
- Introduzir `tenant_id` em todas as tabelas se o projeto alvo for multi-tenant.
- Introduzir `storage_objects` ou buckets no Supabase Storage para anexos compartilhados.

Estratégia de migrations:

- O repositório usa migrations SQL versionadas em `supabase/migrations`.
- Mudanças estruturais, RLS, triggers e RPCs entram como migrations novas; não como edição manual em produção.
- O padrão a replicar é “schema como código”.
- O fluxo observado ainda é manual; no template alvo eu automatizaria promoção de migrations por ambiente.

Multi-tenant:

- `Observado`: não há multi-tenant.
- `Dependente do projeto alvo`: se houver múltiplas empresas, unidades isoladas ou clientes externos, adicione `tenant_id`, índices compostos e RLS por tenant desde o início.

Itens específicos do domínio que não devem ser copiados:

- Campos de CNH, placa, combustível, vistoria, quilometragem, termos específicos do negócio.
- Nomes de status ligados a veículo.
- Identificadores técnicos e semântica operacional do app de referência.

## 4. Documento de Autenticação e Segurança

Fluxo de auth com Supabase:

- Login por senha usando `Supabase Auth`.
- O app aceita `username` ou `email`; antes do login ele resolve o identificador para o email técnico/real usado no Auth.
- A sessão é restaurada com `getSession()` e mantida com `onAuthStateChange`.
- Em mobile, a sessão fica em `AsyncStorage`; na web, no storage do navegador.
- Rotas são protegidas no layout raiz; sem sessão o app volta ao login.
- No primeiro acesso o usuário é desviado para definição de senha.

Modelo de autorização:

- O modelo é `RBAC + ownership`.
- `RBAC`: papéis como `Solicitante`, `Operação`, `Administrador`.
- `Ownership`: usuário comum só lê/escreve o que lhe pertence onde aplicável.
- Helpers SQL resolvem `current_app_user_id()` e `current_app_user_role()`.
- Policies de tabela aplicam visão por papel e por dono.
- Ações sensíveis usam RPC dedicada, como cancelamento do próprio registro.

RLS e policies:

- Todas as tabelas operacionais em `public` têm RLS habilitada.
- `users`: leitura do próprio cadastro; leitura ampliada para papéis privilegiados; escrita restrita a admin.
- `resources`: leitura para autenticados; escrita restrita.
- `transactions/reservations`: leitura por dono ou papel privilegiado; insert apenas do próprio usuário; update privilegiado.
- `history`: visível apenas quando a transação-mãe é visível.
- `audit_log`: insert do próprio ator; leitura apenas administrativa.

Gestão de sessão:

- Sessão persistente por dispositivo.
- Refresh automático do token em mobile com integração ao ciclo de vida do app.
- Múltiplos dispositivos são suportados por padrão do Supabase; não há lógica custom observada de revogação global.
- `Observado`: não há fluxo de password recovery, MFA, email verification self-service ou gestão ativa de sessões.

Checklist de segurança para replicação:

- Usar somente `publishable/anon key` no cliente.
- Manter `service_role` exclusivamente em scripts/servidores confiáveis.
- Habilitar RLS em toda tabela exposta.
- Colocar regras críticas também em constraints/triggers.
- Limitar RPCs expostas ao mínimo necessário.
- Preferir schema privado para helpers internos `security definer`.
- Usar `app_metadata` ou tabela interna para flags de segurança; não `user_metadata`.
- Implementar storage compartilhado e assinado para anexos.
- Adicionar password recovery, revogação de sessão e monitoramento para produção real.
- Se existir login pré-auth por identificador alternativo, proteger contra enumeração e abuso.

Lacunas/riscos visíveis:

- `Observado`: `must_change_password` está em `user_metadata`; isso serve para UX, mas é fraco como controle de segurança.
- `Observado`: `resolve_auth_login_identifier` é executável por `anon`, o que facilita enumeração de identificadores.
- `Observado`: funções `security definer` estão no schema `public`; funciona, mas eu reduziria exposição e moveria helpers para schema privado.
- `Observado`: não há rate limiting de aplicação visível para fluxos sensíveis.
- `Observado`: não há CORS custom, porque não há API própria; CORS fica delegado à Vercel/Supabase.
- `Observado`: `audit_log` é gravado, mas não há consumo operacional/monitoramento visível no app.

## 5. Documento de Deploy e Operação

Padrão de deploy observado:

- Web: `expo export --platform web` gera bundle estático.
- Vercel publica a pasta `dist` e faz rewrite de rotas para `index.html`.
- Mobile Android: `EAS Build` gera APK; `EAS Update` distribui update OTA.
- O backend não é implantado na Vercel; ele já existe como Supabase hospedado.
- Scripts administrativos locais fazem seed, importação, provisionamento e reset de senha.

Estrategia de build para Android e iOS:

- Android:
- usar perfis separados de build como `development`, `preview` e `production`;
- gerar `APK` para testes internos rapidos e `AAB` para publicacao em loja, quando aplicavel;
- incrementar `versionCode` a cada release nativa;
- manter variaveis de ambiente por perfil de build;
- exigir rebuild completo quando houver mudanca nativa, permissao, plugin Expo ou configuracao de manifesto;
- permitir update OTA apenas para alteracoes compativeis com o runtime ja publicado.

- iOS:
- usar perfis separados de build como `development`, `preview` e `production`;
- gerar build de desenvolvimento para testes tecnicos e `IPA`/archive de producao para distribuicao oficial;
- incrementar `buildNumber` a cada release nativa;
- manter `bundle identifier`, capacidades e assinaturas separados por ambiente quando necessario;
- exigir rebuild completo quando houver mudanca nativa, plugin Expo, permissao, capability ou configuracao de assinatura;
- permitir update OTA apenas para alteracoes compativeis com o runtime ja publicado e aderentes as regras da Apple.

Variáveis e secrets:

- `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`: públicas, para o runtime do app.
- `SUPABASE_SERVICE_ROLE_KEY`: secreta, apenas para scripts privilegiados.
- `SUPABASE_AUTH_TEMP_PASSWORD`: segredo operacional temporário para provisionamento.
- `Observado`: não há uso de `service_role` dentro de `src/` ou `app/`.
- `Observado`: `eas.json` contém URL e chave pública hardcoded; isso não expõe segredo, mas reduz abstração por ambiente.

Ambientes:

- `Observado`: existem perfis `development`, `preview` e `production` no EAS.
- `Observado`: `preview` e `production` usam o mesmo projeto Supabase no arquivo versionado.
- `Suposição`: a Vercel usa o mesmo projeto Supabase do build atual; não há separação de staging evidenciada no repositório.
- `Template recomendado`: um projeto Supabase por ambiente crítico e variáveis geridas no Vercel/EAS, não hardcoded no repositório.

Observabilidade:

- `Observado`: há `audit_log` no banco.
- `Observado`: não há Sentry, APM, centralização de logs, métricas, tracing ou alertas.
- `Template recomendado`: monitoramento de erros client, monitoramento de banco/auth e alertas de falha de deploy/migration.

CI/CD:

- `Observado`: não há `.github/workflows` nem pipeline automatizado.
- `Observado`: o único gate explícito é `npm run typecheck`.
- `Template recomendado`: pipeline mínima com `typecheck`, lint, testes, build web/mobile, validação de migrations e deploy por ambiente.

O que preservar do padrão de operação:

- Separação rígida entre runtime público e scripts administrativos privilegiados.
- Deploy web estático simples.
- Mobile e web compartilhando a mesma fonte de verdade.
- Provisionamento operacional documentado e reproduzível.

O que eu não replicaria sem ajuste:

- Deploy manual via CLI como única estratégia.
- Mesmo backend para preview e production.
- Falta de observabilidade e rollback automatizado.

## 6. Documento de Guia de Adaptação

O que deve ser preservado:

- Supabase como backend operacional direto, se o projeto alvo for interno ou de média complexidade.
- Estrutura em camadas `client -> services -> repositories -> Supabase`.
- `RLS + ownership + roles` como base de autorização.
- Cache local apenas como aceleração de leitura, não como fonte primária.
- Realtime para consistência multi-device.
- Scripts administrativos fora do app.
- Schema e políticas versionados por migrations.

O que deve ser adaptado:

- Entidades, nomes de tabelas, enums e regras de negócio.
- Papéis e matriz de permissão.
- Regras operacionais em triggers.
- Estratégia de onboarding de usuários.
- Necessidade de `username` sem email.
- Necessidade de multi-tenant.
- Estratégia de anexos e documentos.
- Necessidade de backend intermediário para integrações externas.

Dependências técnicas e pré-requisitos:

- Projeto Supabase com Auth, Postgres, Realtime e Storage se houver anexos.
- Projeto Vercel para frontend web.
- EAS se houver app nativo.
- Gestão segura de variáveis por ambiente.
- Disciplina de migrations.
- Definição clara de papéis, ownership e fluxos críticos antes de codar.

Quando manter o padrão sem backend custom:

- CRUD principal simples.
- Regras fortes podem viver no banco.
- Integrações externas são poucas ou administrativas.
- Time aceita trabalhar com RLS como mecanismo central de segurança.

Quando quebrar o padrão e adicionar Edge Functions/BFF:

- Fluxos públicos sujeitos a abuso.
- Integrações com ERP, pagamentos, webhooks ou segredos de terceiros.
- Necessidade de rate limiting, antifraude ou orquestração complexa.
- Requisitos de observabilidade e compliance mais fortes.

## 7. Checklist de Migração

1. Defina o modelo de acesso do projeto alvo (`roles`, ownership, se existe tenant). Risco principal: modelar permissão depois do schema e reescrever RLS.
2. Desenhe as tabelas estruturais equivalentes a `users`, `resources`, `transactions`, `history`, `unavailability`, `audit_log`. Risco principal: misturar histórico funcional com auditoria técnica.
3. Crie migrations SQL para schema, índices, constraints e triggers antes da camada de UI. Risco principal: depender só de validação client-side.
4. Implemente o vínculo `auth.users -> tabela interna` com `auth_user_id` e resolva o fluxo de onboarding. Risco principal: autenticação existir sem identidade interna consistente.
5. Refatore o projeto alvo para `repositories + services + mappers`, sem queries do Supabase espalhadas em telas/componentes. Risco principal: acoplamento e dificuldade de trocar políticas.
6. Ative RLS em todas as tabelas expostas e escreva policies por papel e ownership. Risco principal: abrir dados demais ao usar a chave pública.
7. Implemente sincronização por snapshot inicial, cache local, Realtime e refresh em foreground. Risco principal: inconsistência entre dispositivos.
8. Mova anexos para storage compartilhado com URLs assinadas e metadados relacionais. Risco principal: salvar caminhos locais e quebrar multi-device.
9. Padronize variáveis por ambiente em Vercel/EAS/Supabase e elimine segredos do repositório. Risco principal: acoplamento entre preview e produção.
10. Adicione CI/CD, recuperação de senha, observabilidade e testes mínimos antes de considerar o template pronto para produção. Risco principal: operação frágil e diagnóstico lento.

## 8. Lacunas e Suposições

`Observado`:

- Não há multi-tenant.
- Não há backend HTTP próprio nem Edge Functions no fluxo principal.
- O sync é `cache-first` para leitura; não existe offline write queue.
- Fotos de vistoria usam `asset.uri` local e não storage compartilhado.
- `audit_log` é gravado, mas não há leitura operacional visível.
- Não há recuperação de senha, MFA, email verification self-service ou gestão avançada de sessões.
- Não há CI/CD automatizado nem observabilidade madura.
- `preview` e `production` no EAS apontam para o mesmo backend público no arquivo versionado.

`Suposição`:

- A Vercel usa o mesmo conjunto de envs públicas do build atual.
- O schema exposto da Data API permanece `public`, padrão do Supabase.
- O projeto opera com múltiplas sessões por usuário segundo comportamento padrão do Supabase, sem customização adicional.

`Dependente do projeto alvo`:

- Se continuará sem backend intermediário.
- Se precisa de `username` sem email.
- Se precisa de multi-tenant.
- Se precisa de anexos duráveis, compliance documental ou integrações corporativas.
- Se o nível de risco exige Edge Functions/BFF para fluxos públicos.

Evidências principais no código:

- Auth/session: [useAuthSession.tsx](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/src/hooks/useAuthSession.tsx:55>)
- Proteção de rotas: [app/_layout.tsx](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/app/_layout.tsx:25>)
- Sync/cache/realtime: [useReservationStore.tsx](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/src/hooks/useReservationStore.tsx:325>)
- Cliente Supabase: [client.ts](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/src/backend/client.ts:25>)
- Schema base: [202604130001_b03_backend_persistente.sql](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604130001_b03_backend_persistente.sql:14>)
- RLS/RPC por papel e ownership: [202604140005_b02_rls_por_papel_e_ownership.sql](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604140005_b02_rls_por_papel_e_ownership.sql:170>)
- Regras operacionais no banco: [202604140006_b05_regras_operacionais_minimas.sql](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604140006_b05_regras_operacionais_minimas.sql:1>)
- Login por `username`: [202604150009_username_login.sql](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/supabase/migrations/202604150009_username_login.sql:203>)
- Deploy web/Vercel: [deploy-web.mjs](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/scripts/deploy-web.mjs:31>) e [public/vercel.json](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/public/vercel.json:2>)
- Ambientes EAS: [eas.json](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/eas.json:19>)
- Lacuna de anexos multi-device: [ReservationOperationScreen.tsx](<C:/Users/ThiagoBizacha/projects/app_reserva_veiculo_sigma/src/screens/ReservationOperationScreen.tsx:367>)

Referências externas usadas para validar riscos:

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Users (`user_metadata` não é adequado para lógica sensível): https://supabase.com/docs/guides/auth/users
- Supabase Database Functions (`security definer` e privilégios): https://supabase.com/docs/guides/database/functions
- Supabase Hardening Data API: https://supabase.com/docs/guides/database/hardening-data-api

## Prompt de Próxima Etapa

```text
Atue como Staff Software Engineer / Solutions Architect.

Vou te fornecer:
1. a documentação do projeto alvo;
2. este documento de template arquitetural extraído do app de referência.

Sua tarefa é adaptar o projeto alvo para seguir este template nos aspectos:
- arquitetura backend com Supabase como fonte única de verdade;
- autenticação e sessão;
- autorização com RLS por papel e ownership;
- modelagem de banco e migrations;
- sincronização multi-device;
- organização de repositories/services/mappers;
- deploy web com Vercel;
- gestão de variáveis, secrets e ambientes;
- segurança operacional e da API.

Instruções:
- preserve a regra de negócio e a interface do projeto alvo;
- não copie o domínio do app de referência;
- use o template apenas como padrão estrutural;
- identifique gaps entre o projeto alvo e o template;
- proponha um plano de migração em ordem de execução;
- detalhe quais arquivos, módulos e camadas precisam ser criados, movidos ou refatorados;
- quando houver ambiguidade, marque como “Suposição”;
- quando depender de decisão do projeto alvo, marque como “Dependente do projeto alvo”;
- priorize segurança, clareza arquitetural e baixo acoplamento;
- antes de implementar, entregue primeiro um diff arquitetural entre “estado atual” e “estado alvo”.
```
