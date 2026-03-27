# PROJECT_CONTEXT.md

## Contexto Geral do Projeto

Este projeto é um **MVP de um aplicativo corporativo de reserva de materiais/veículos** construído com **Power Apps Canvas App**, usando **SharePoint Lists** como backend e **Power Automate** para automações de aprovação, notificação e SLA.

O objetivo do sistema é substituir controles manuais, planilhas e trocas de e-mail por um fluxo digital padronizado para:

- consultar disponibilidade;
- criar reservas;
- aprovar ou rejeitar solicitações;
- registrar retirada;
- registrar devolução;
- controlar indisponibilidade/manutenção;
- visualizar agenda/calendário de reservas;
- manter rastreabilidade completa do processo.

---

## Objetivo do MVP

O MVP deve ser construído com foco em **entrega rápida, estabilidade e governança mínima viável**.

### O MVP deve incluir:
- cadastro de materiais/veículos;
- consulta de disponibilidade;
- criação de reserva;
- aprovação simples;
- agenda mensal com status por dia;
- retirada;
- devolução;
- histórico básico;
- notificações automáticas;
- painel operacional simples.

### O MVP não deve incluir nesta primeira versão:
- modo offline;
- múltiplos níveis de aprovação;
- integrações com ERP/SAP;
- anexos obrigatórios;
- analytics avançado;
- QR code;
- assinatura digital;
- customizações excessivas de UX que atrasem a entrega.

---

## Stack Tecnológica

### Front-end
- **Power Apps Canvas App**

### Backend
- **SharePoint Lists**

### Automação
- **Power Automate**

### Ambiente esperado
- Desenvolvimento inicialmente em ambiente Microsoft 365 corporativo
- Solução preferencialmente criada dentro de **Solution**
- Estrutura preparada para futura evolução de ALM / DEV / TEST / PROD

---

## Tipos de objetos controlados

O sistema pode operar com:
- veículos corporativos;
- ferramentas;
- notebooks;
- projetores;
- equipamentos compartilhados;
- materiais reutilizáveis controlados.

No código e estrutura, o sistema deve ser desenhado para suportar o conceito genérico de **recurso reservável**, mesmo que a primeira versão foque em veículos ou materiais.

---

## Fluxo de negócio principal

Fluxo padrão:

1. Usuário consulta disponibilidade
2. Usuário cria solicitação de reserva
3. Sistema valida conflito de período
4. Solicitação vai para aprovação
5. Gestor aprova ou rejeita
6. Operação registra retirada
7. Operação registra devolução
8. Sistema encerra a reserva
9. Logs e histórico permanecem disponíveis

---

## Perfis de usuário

### Solicitante
- consulta disponibilidade;
- cria reserva;
- acompanha status;
- cancela reserva;
- solicita extensão.

### Aprovador / Gestor
- aprova ou rejeita solicitações;
- visualiza pendências;
- acompanha reservas da sua área.

### Operação / Responsável pelo ativo
- registra retirada;
- registra devolução;
- bloqueia ativo para manutenção;
- acompanha agenda operacional.

### Administrador
- mantém cadastros;
- parametriza regras;
- ajusta listas de apoio;
- acompanha logs e governança.

---

## Estados da reserva

Estados esperados para o ciclo da reserva:

- `Rascunho`
- `Pendente`
- `Aprovada`
- `Rejeitada`
- `Retirado`
- `Concluída`
- `Cancelada`
- `Em Atraso`
- `Manutenção` (status do recurso, não necessariamente da reserva)

### Prioridade de status no calendário
Quando houver mais de um status no mesmo dia, a prioridade visual deve ser:

1. `Manutenção`
2. `Em Uso`
3. `Reservada`
4. `Aprovada`
5. `Disponível`

---

## Estrutura lógica de dados

## SharePoint List: Materiais
Lista responsável pelo cadastro mestre dos recursos.

### Campos sugeridos
- `Title` → Nome do recurso
- `CodigoMaterial` → identificador único
- `Categoria`
- `Descricao`
- `NumeroPatrimonio`
- `Localizacao`
- `ResponsavelMaterial`
- `StatusMaterial`
- `ExigeAprovacao`
- `Ativo`
- `Observacoes`

---

## SharePoint List: Reservas
Lista transacional principal.

### Campos sugeridos
- `Title` → código da reserva
- `Solicitante`
- `EmailSolicitante`
- `Area`
- `CentroCusto`
- `MaterialLookup`
- `DataHoraInicio`
- `DataHoraFim`
- `Finalidade`
- `StatusReserva`
- `Aprovador`
- `DataHoraAprovacao`
- `MotivoRejeicao`
- `DataHoraRetirada`
- `DataHoraDevolucao`
- `CondicaoDevolucao`
- `TermoAceito`
- `ObservacoesOperacionais`

---

## SharePoint List: MovimentacoesReserva
Histórico de eventos do processo.

### Campos sugeridos
- `Title`
- `ReservaLookup`
- `TipoMovimento`
- `Usuario`
- `DataHoraMovimento`
- `Observacao`

---

## SharePoint List: Aprovadores
Regras de aprovação por área/unidade.

### Campos sugeridos
- `Title`
- `Area`
- `Aprovador`
- `Ativo`
- `Observacoes`

---

## SharePoint List: Configuracoes
Parâmetros gerais do app.

### Campos sugeridos
- `Title`
- `Valor`
- `Descricao`
- `Ativo`

---

## Estrutura de telas do app

### `scrHome`
Tela inicial com atalhos principais:
- Nova Reserva
- Agenda
- Minhas Reservas
- Aprovações
- Operação
- Administração

### `scrAgenda`
Tela de calendário mensal com:
- navegação de mês;
- linha de dias da semana;
- grid de 42 dias;
- status por cor;
- lista das reservas do mês;
- botão de nova reserva.

### `scrNovaReserva`
Tela para criar nova reserva:
- recurso;
- data/hora início;
- data/hora fim;
- finalidade;
- área;
- observações;
- aceite.

### `scrMinhasReservas`
Tela para o solicitante acompanhar:
- pendentes;
- aprovadas;
- canceladas;
- concluídas;
- extensões.

### `scrAprovacoes`
Tela do gestor:
- fila de pendências;
- aprovar/rejeitar;
- observação de decisão.

### `scrOperacao`
Tela para retirada e devolução:
- localizar reserva;
- registrar retirada;
- registrar devolução;
- observar condição do item.

### `scrAdmin`
Tela administrativa:
- cadastro de materiais;
- aprovadores;
- parâmetros;
- bloqueio/desbloqueio;
- visão de histórico.

---

## Lógica do calendário

O calendário deve ser implementado de forma customizada com **Gallery**, não com Date Picker.

### Abordagem esperada
- usar `Sequence(42)` para gerar a grade mensal;
- usar `varMesAtual` como base;
- calcular o primeiro dia visível do grid;
- gerar uma coleção auxiliar diária (`colAgendaDia`);
- aplicar cor/status por dia;
- permitir clicar no dia para abrir detalhe ou iniciar nova reserva.

### Variáveis esperadas
- `varMesAtual`
- `varDataSelecionada`
- `varVeiculoId` ou `varMaterialId`
- `varReservaSelecionada`

### Coleções esperadas
- `colReservasMes`
- `colAgendaDia`
- `colAgendaDiaResumo`

### Estratégia técnica
Evitar consultar a lista SharePoint diretamente em cada célula do calendário.  
O app deve materializar as reservas do período em coleções intermediárias para melhorar performance, legibilidade e manutenção.

---

## Regras de negócio obrigatórias

1. Não permitir reservas sobrepostas para o mesmo recurso no mesmo período.
2. Não permitir reserva para recurso inativo ou em manutenção.
3. Data final deve ser maior que data inicial.
4. Toda reserva deve possuir identificador único.
5. Toda retirada e devolução devem ser registradas.
6. Toda mudança relevante de status deve gerar log.
7. Extensão depende de disponibilidade e, quando aplicável, nova aprovação.
8. Materiais parametrizados como críticos exigem aprovação.
9. O calendário deve sempre refletir a prioridade de status por dia.

---

## Power Automate

Fluxos esperados:

### 1. Aprovação
- disparado após criação da reserva;
- envia solicitação ao aprovador;
- grava decisão;
- atualiza status;
- notifica solicitante.

### 2. Notificação
- criação de reserva;
- aprovação;
- rejeição;
- lembrete de devolução.

### 3. SLA / atraso
- fluxo agendado;
- detecta reservas vencidas;
- altera status para `Em Atraso`;
- notifica responsáveis.

---

## Estratégia de implementação

O projeto deve ser construído nesta ordem:

1. modelar listas SharePoint;
2. criar app em branco;
3. conectar fontes de dados;
4. criar variáveis e coleções base;
5. montar estrutura de navegação;
6. construir telas principais;
7. implementar regras de negócio;
8. integrar Power Automate;
9. testar cenários ponta a ponta;
10. publicar MVP.

---

## Estratégia de performance

- usar `ClearCollect` para cache local;
- evitar `LookUp` direto no SharePoint dentro de loops e células do calendário;
- normalizar datas com `DateValue`;
- reduzir consultas repetidas;
- manter fórmulas legíveis e modulares;
- separar claramente UI, regra e dados.

---

## Convenções de nomenclatura

### Variáveis globais
Prefixo: `var`
Exemplos:
- `varMesAtual`
- `varDataSelecionada`
- `varReservaSelecionada`

### Coleções
Prefixo: `col`
Exemplos:
- `colReservasMes`
- `colAgendaDia`

### Galleries
Prefixo: `gal`
Exemplos:
- `galCalendario`
- `galReservasMes`

### Labels
Prefixo: `lbl`

### Botões
Prefixo: `btn`

### Ícones
Prefixo: `ico`

### Containers
Prefixo: `con`

### Telas
Prefixo: `scr`

---

## Padrões de desenvolvimento

- preferir componentes e estruturas reutilizáveis;
- manter lógica de negócio fora de controles visuais quando possível;
- evitar duplicação de fórmula;
- usar comentários e nomes autoexplicativos;
- organizar por blocos funcionais;
- pensar em futura escalabilidade para Dataverse, se necessário.

---

## Entregáveis esperados do MVP

### Funcionais
- reserva funcional ponta a ponta;
- agenda funcional;
- aprovação funcional;
- retirada/devolução funcional;
- notificações básicas;
- administração básica.

### Técnicos
- código organizado;
- nomes padronizados;
- sem dependência de hacks improvisados;
- preparado para manutenção futura.

---

## O que o Codex deve fazer

Ao atuar nesse projeto, o Codex deve:

1. manter consistência com esse documento;
2. propor implementação simples, robusta e legível;
3. evitar complexidade desnecessária no MVP;
4. priorizar estabilidade operacional;
5. preservar separação entre UI, regras e dados;
6. sugerir melhorias sem quebrar o escopo definido;
7. documentar decisões técnicas relevantes.

---

## Observação final

Este projeto deve ser tratado como um **produto digital corporativo interno**, e não apenas como um formulário simples.

As decisões de modelagem, nomenclatura, regras e estrutura do app devem favorecer:
- governança;
- rastreabilidade;
- escalabilidade;
- manutenção;
- clareza para o time técnico.
