# TODO de Produção - App Reserva de Veículos Sigma

## Status Atual

O aplicativo **não está pronto para produção**.

Este arquivo consolida os principais entregáveis necessários para levar o app de um MVP demonstrativo para um produto corporativo minimamente confiável para operação real.

## Escala de Classificação

### Criticidade

- **Crítica**: impede produção ou cria risco operacional grave.
- **Alta**: não bloqueia sozinha em todos os casos, mas desaconselha fortemente o go-live.
- **Média**: impacta usabilidade, consistência ou manutenção, mas pode entrar após bloqueadores.
- **Baixa**: melhoria incremental ou acabamento.

### Importância

- **Obrigatório para go-live**: precisa estar concluído antes de subir em produção.
- **Muito importante**: deve entrar logo após os bloqueadores, preferencialmente ainda antes do rollout amplo.
- **Recomendado**: melhora robustez, UX e governança, mas pode ser planejado em seguida.
- **Evolutivo**: ganho incremental, sem bloquear operação inicial controlada.

---

## 1. Bloqueadores de Produção

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| P01 | Autenticação real e gestão de sessão | Segurança / Acesso | Crítica | Obrigatório para go-live | Implementar login real, sessão válida, logout consistente e identificação do usuário autenticado. Remover acesso livre e eliminar o usuário fixo do app. |
| P02 | Autorização por perfil e ownership | Regras / Segurança | Crítica | Obrigatório para go-live | Garantir que apenas perfis autorizados possam aprovar, cancelar, registrar check-in/check-out, editar cadastros e acessar áreas administrativas. O usuário só pode agir sobre reservas permitidas para seu papel. |
| P03 | Backend persistente e multiusuário | Arquitetura / Dados | Crítica | Obrigatório para go-live | Substituir mocks e `AsyncStorage` como fonte principal por backend real com persistência centralizada, leitura/escrita confiável e sincronização entre usuários. |
| P04 | Workflow real de aprovação e rejeição | Negócio | Crítica | Obrigatório para go-live | Implementar ciclo real `Pendente -> Aprovada/Rejeitada`, incluindo fila de aprovação, decisão do gestor, motivo de rejeição e histórico persistido. Hoje a reserva nasce aprovada. |
| P05 | State machine oficial da reserva | Negócio / Arquitetura | Crítica | Obrigatório para go-live | Formalizar estados válidos e transições permitidas: criação, aprovação, rejeição, cancelamento, retirada, devolução, atraso e encerramento. Alinhar tipos, store e telas. |
| P06 | Regras operacionais mínimas de elegibilidade | Negócio | Crítica | Obrigatório para go-live | Validar CNH, perfil do usuário, janela de retirada/devolução, datas passadas, veículo inativo/manutenção e consistência temporal da reserva. |
| P07 | Tratamento real de atraso e SLA | Operação | Crítica | Obrigatório para go-live | Criar lógica para reservas vencidas, mudança para `Em atraso`, alertas e tratamento operacional de devolução fora do prazo. |
| P08 | Auditoria e histórico persistido | Governança | Crítica | Obrigatório para go-live | Persistir histórico de eventos relevantes: criação, aprovação, rejeição, cancelamento, check-in, check-out, alterações e ações administrativas, com ator e timestamp reais. |

---

## 2. Ajustes Importantes Antes de Escala Real

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| I01 | Parametrização de regras de reserva | Negócio | Alta | Muito importante | Revisar e parametrizar restrições atuais de mesma data e duração entre 1h e 4h. Validar com operação se reservas multi-dia e janelas maiores devem existir. |
| I02 | Origem, base e contexto operacional dinâmicos | UX / Negócio | Alta | Muito importante | Remover base fixa e demais informações hardcoded do app. Base, centro de custo, área e gestor devem vir do perfil e/ou da reserva. |
| I03 | Tela real de aprovação | Fluxo | Alta | Muito importante | Entregar uma tela funcional para o gestor aprovar/rejeitar solicitações, com observação da decisão e atualização do estado global. |
| I04 | Dashboard administrativo confiável | Operação / UX | Alta | Muito importante | Ajustar o painel para refletir dados reais e permitir ações úteis. Hoje ele mostra pendências e manutenção sem capacidade de gestão correspondente. |
| I05 | Gestão real de manutenção e indisponibilidade | Operação | Alta | Muito importante | Criar fluxo administrativo para bloquear/desbloquear veículo, definir previsão de retorno, motivo e efeito real na agenda. |
| I06 | Proteção de navegação por papel | Segurança / UX | Alta | Muito importante | Esconder e proteger rotas administrativas, operacionais e de aprovação conforme perfil. |
| I07 | Consistência de disponibilidade da agenda | Negócio | Alta | Muito importante | Garantir que agenda, detalhe do veículo, reserva ativa e status do recurso mostrem o mesmo estado, inclusive em atrasos e conflitos. |
| I08 | Tratamento de erro visível ao usuário | Robustez | Alta | Muito importante | Padronizar mensagens de falha, fallback de rede/persistência e feedback de ação. Hoje os `catch` são superficiais e não sustentam produção. |

---

## 3. Refatorações Recomendadas

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| R01 | Quebra do store central em camadas | Arquitetura | Alta | Recomendado | Separar sessão, reservas, recursos, usuários, exportação e persistência. O store atual concentra responsabilidades demais. |
| R02 | Serviços e casos de uso explícitos | Arquitetura | Alta | Recomendado | Criar camada de serviços/use cases para `createReservation`, `approveReservation`, `checkIn`, `checkOut`, `cancelReservation`, etc. |
| R03 | Padronização de modelos e nomenclatura | Arquitetura | Média | Recomendado | Alinhar nomes de status, tipos, labels e campos com o fluxo real do produto e com o documento de contexto. |
| R04 | Remoção de dados mockados do fluxo principal | Dados / Produto | Alta | Recomendado | Eliminar dependência de PDFs mockados, textos de demo e dados demonstrativos como fonte operacional principal. |
| R05 | Revisão de componentes reutilizáveis | Front-end | Média | Recomendado | Consolidar padrões visuais e reduzir duplicação entre cards, headers, feedbacks e formulários. |
| R06 | Estratégia de persistência e sincronização | Arquitetura | Alta | Recomendado | Definir cache local, reidratação, atualização otimista e reconciliação com backend. |

---

## 4. QA, Confiabilidade e Governança

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| Q01 | Testes automatizados de regras de negócio | Qualidade | Crítica | Obrigatório para go-live | Cobrir conflito de agenda, aprovação, cancelamento, check-in, check-out, atraso, manutenção e permissões. |
| Q02 | Testes ponta a ponta dos fluxos principais | Qualidade | Alta | Muito importante | Validar login, agenda, criação de reserva, aprovação, retirada, devolução, cancelamento e histórico. |
| Q03 | Lint, CI e pipeline mínima de release | Governança | Alta | Muito importante | Adicionar lint, typecheck, build automatizado e pipeline de validação antes de release. |
| Q04 | Observabilidade mínima | Governança / Operação | Alta | Muito importante | Incluir logging estruturado, rastreamento de erro e monitoração de falhas em produção. |
| Q05 | Critérios de homologação operacional | Produto / QA | Alta | Muito importante | Definir checklist formal de homologação com operação, gestor e administrador antes do go-live. |
| Q06 | Política de dados e auditoria | Governança | Alta | Muito importante | Definir retenção, rastreabilidade, consistência de histórico e responsabilidades sobre mudanças críticas. |

---

## 5. UX/UI e Fluxos

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| U01 | Revisão do fluxo de nova reserva | UX / Fluxo | Média | Recomendado | Corrigir defaults inseguros, impedir datas passadas e melhorar seleção de veículo/horário. |
| U02 | Melhorias de estados vazios e feedback | UX | Média | Recomendado | Incluir empty states consistentes, retornos visuais após ações e mensagens mais claras em agenda, frota e reservas. |
| U03 | Melhorias de navegação em agenda diária | UX / Fluxo | Média | Recomendado | Quando houver mais de uma reserva no dia, permitir escolher qual abrir, em vez de sempre abrir a primeira. |
| U04 | Ajustes de acessibilidade e clareza | UX | Média | Recomendado | Revisar textos, contraste, nomes de CTA, áreas clicáveis e consistência semântica dos botões. |
| U05 | Revisão do login de apresentação | UX / Produto | Alta | Recomendado | Remover elementos falsos como “Esqueceu a senha?” sem fluxo funcional e o acesso sem login em cenário produtivo. |
| U06 | Revisão do modal de seleção de veículo | UX | Média | Recomendado | Tornar a lista escalável e navegável para frotas maiores, com scroll, busca e filtros quando necessário. |

---

## 6. Backlog de Baixa Prioridade / Evolução

| ID | Entregável | Categoria | Criticidade | Importância | O que precisa ser entregue |
|---|---|---|---|---|---|
| E01 | Exportações mais completas e administráveis | Produto | Média | Evolutivo | Expandir exportações, filtros, formatos e rastreio de geração de relatório. |
| E02 | Melhorias no painel de indicadores | Produto / BI | Baixa | Evolutivo | Evoluir métricas, gráficos e recortes operacionais depois que os dados estiverem confiáveis. |
| E03 | Evolução para anexos e documentos reais | Produto | Média | Evolutivo | Trocar visualizações mockadas por anexos reais integrados ao backend/document management. |
| E04 | Expansão para outros recursos reserváveis | Produto / Arquitetura | Média | Evolutivo | Só evoluir para materiais/equipamentos após estabilizar o domínio de veículos. |

---

## Ordem Ideal de Execução

1. Autenticação, autorização e sessão.
2. Backend persistente e remoção da dependência de mocks locais.
3. Workflow de aprovação/rejeição e state machine oficial.
4. Regras de elegibilidade, atraso, manutenção e auditoria.
5. Testes automatizados, CI e homologação operacional.
6. Correções de UX críticas e refinamento de navegação.
7. Refatorações estruturais para reduzir acoplamento.
8. Evoluções opcionais após estabilização.

---

## Critério Objetivo de Go-Live

O app só deve ser considerado apto para produção quando:

- existir autenticação real;
- houver backend persistente e multiusuário;
- o fluxo de aprovação estiver funcional;
- check-in/check-out estiverem protegidos por permissão e auditados;
- reservas vencidas forem tratadas corretamente;
- testes mínimos cobrirem as regras centrais;
- a homologação operacional tiver sido concluída.
