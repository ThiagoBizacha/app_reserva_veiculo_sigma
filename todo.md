# TODO de Producao - App Reserva de Veiculos Sigma

## Objetivo deste arquivo

Este arquivo consolida apenas o que ainda precisa ser resolvido para colocar o app em producao com risco controlado.

Fluxo operacional real considerado neste backlog:

`solicitada -> reservado -> em uso -> concluida -> veiculo disponivel apos checkout`

Observacao:
- Nao existe etapa de aprovacao do gestor neste fluxo.
- Itens antigos relacionados a `Pendente -> Aprovada/Rejeitada` foram removidos deste backlog executivo.

---

## Diagnostico executivo

O app ainda nao esta pronto para producao.

Hoje os maiores riscos sao:
- ausencia de regras operacionais completas de elegibilidade;
- ausencia de tratamento real de atraso e SLA;
- ausencia de auditoria operacional;
- baixa garantia de qualidade para release.

## Concluido recentemente

As seguintes frentes ja foram fechadas e validadas:

- `B04` State machine oficial da reserva e do recurso
- `B03` Backend persistente e multiusuario
- `B01` Autenticacao real e gestao de sessao
- `B02` Autorizacao por perfil e ownership com RLS validada para `Solicitante`, `Operacao` e `Administrador`

---

## Proximo desenvolvimento recomendado

A frente recomendada para a proxima etapa e fechar as regras operacionais e os mecanismos de seguranca de release que ainda faltam para go-live.

Sequencia recomendada agora:

1. `B05` Regras operacionais minimas
2. `B06` Tratamento real de atraso e SLA
3. `B07` Auditoria e historico persistido
4. `B08` Testes automatizados das regras centrais
5. `F01` Gestao real de manutencao e indisponibilidade
6. `F04` Testes ponta a ponta dos fluxos principais
7. `F05` Lint, CI e pipeline minima de release

Observacao:
- `B03`, `B01`, `B02` e `B04` ja sairam da lista de bloqueadores abertos.
- Nome sugerido para o commit inicial da proxima frente: `feat: inicia regras operacionais minimas`

Subetapas executaveis do `B05`:

1. Revisar regras de elegibilidade por perfil e CNH.
2. Fechar validacao de janelas de retirada e devolucao.
3. Endurecer bloqueios de datas passadas e inconsistencias temporais.
4. Alinhar manutencao e indisponibilidade com criacao/edicao de reserva.
5. Cobrir regras invalidas com testes automatizados.

---

## Bloco 1 - Status dos bloqueadores imediatos

Estes itens definem o nucleo obrigatorio para go-live.

| Prioridade | ID | Entregavel | Status | Criticidade | Situacao atual |
|---|---|---|---|---|---|
| 1 | B01 | Autenticacao real e gestao de sessao | Concluido | Critica | Login real com Supabase Auth, sessao persistida, logout consistente e troca obrigatoria da senha temporaria no primeiro acesso. |
| 2 | B02 | Autorizacao por perfil e ownership | Concluido | Critica | Perfis `Solicitante`, `Operacao` e `Administrador` validados no app e no banco com RLS e ownership. |
| 3 | B03 | Backend persistente e multiusuario | Concluido | Critica | Supabase ativo como fonte unica de verdade para usuarios, veiculos, reservas e historico. |
| 4 | B04 | State machine oficial da reserva e do recurso | Concluido | Critica | Fluxo real consolidado: `reservado -> em uso -> concluida`, com veiculo disponivel apos checkout. |
| 5 | B05 | Regras operacionais minimas de elegibilidade | Pendente | Critica | Validar CNH, papel do usuario, datas passadas, janela de retirada/devolucao, manutencao, inatividade do veiculo e consistencia temporal da reserva. |
| 6 | B06 | Tratamento real de atraso e SLA | Pendente | Critica | Detectar devolucao fora do prazo, mudar status para `Em atraso`, alertar operacao e refletir isso em todas as telas. |
| 7 | B07 | Auditoria e historico persistido | Pendente | Critica | Persistir criacao, alteracao, cancelamento, check-in, check-out e acoes administrativas com ator, data/hora e origem da acao. |
| 8 | B08 | Testes automatizados das regras centrais | Pendente | Critica | Cobrir conflito de agenda, criacao, cancelamento, check-in, check-out, atraso, manutencao e permissoes. |

---

## Bloco 2 - Fase 1 de deploy

Estes itens devem entrar antes de liberar o app para uso real mais amplo.

| Prioridade | ID | Entregavel | Criticidade | Importancia | O que precisa ser entregue |
|---|---|---|---|---|---|
| 9 | F01 | Gestao real de manutencao e indisponibilidade | Alta | Muito importante | Criar fluxo administrativo para bloquear/desbloquear veiculo, definir motivo, previsao de retorno e reflexo real na agenda e na disponibilidade. |
| 10 | F02 | Consistencia total entre Reserva, Agenda, Frota e Painel | Alta | Muito importante | Garantir que toda mudanca de status apareca da mesma forma em todas as telas, usando a mesma fonte de verdade e os mesmos seletores de negocio. |
| 11 | F03 | Tratamento de erro visivel ao usuario | Alta | Muito importante | Padronizar mensagens de falha, indisponibilidade, erro de persistencia, conflito de reserva e retorno de acoes criticas. |
| 12 | F04 | Testes ponta a ponta dos fluxos principais | Alta | Muito importante | Validar login, criacao de reserva, visualizacao em agenda/frota, check-in, check-out, cancelamento e disponibilidade final do veiculo. |
| 13 | F05 | Lint, CI e pipeline minima de release | Alta | Muito importante | Adicionar lint, typecheck, build automatizado e validacao obrigatoria antes de release. |
| 14 | F06 | Observabilidade minima | Alta | Muito importante | Incluir logging estruturado, captura de erro e monitoracao basica para falhas em producao. |
| 15 | F07 | Homologacao operacional formal | Alta | Muito importante | Definir checklist de validacao com operacao, usuario final e administrador antes do go-live. |
| 16 | F08 | Politica minima de dados e rastreabilidade | Alta | Muito importante | Definir retencao, visibilidade de historico, responsabilidade por alteracoes criticas e criterio de auditoria. |
| 17 | F09 | Protecao de navegacao por papel | Alta | Muito importante | Esconder e proteger rotas administrativas e operacionais conforme perfil do usuario. |
| 18 | F10 | Revisao do login de apresentacao | Alta | Muito importante | Remover elementos falsos ou de demonstracao do fluxo de acesso antes de publicar. |

---

## Bloco 3 - Fase 2 pos-estabilizacao

Estes itens melhoram robustez, manutencao e experiencia, mas nao precisam bloquear um rollout controlado se os blocos anteriores estiverem fechados.

| Prioridade | ID | Entregavel | Criticidade | Importancia | O que precisa ser entregue |
|---|---|---|---|---|---|
| 19 | E01 | Parametrizacao das regras de reserva | Alta | Recomendado | Revisar regras de duracao, reservas no mesmo dia, multi-dia e limites operacionais para nao depender de regras fixas no codigo. |
| 20 | E02 | Origem, base e contexto operacional dinamicos | Alta | Recomendado | Garantir que base, centro de custo, area e gestor venham do perfil e/ou da reserva, sem hardcodes residuais. |
| 21 | E03 | Dashboard administrativo confiavel e acionavel | Alta | Recomendado | Evoluir o painel para refletir dados reais e permitir acoes uteis de operacao. |
| 22 | E04 | Estrategia de persistencia e sincronizacao | Alta | Recomendado | Definir cache local, reidratacao, atualizacao otimista e reconciliacao com backend. |
| 23 | E05 | Quebra do store central em camadas | Alta | Recomendado | Separar sessao, reservas, recursos, usuarios, exportacao e persistencia para reduzir acoplamento. |
| 24 | E06 | Servicos e casos de uso explicitos | Alta | Recomendado | Criar camada de servicos/use cases para criar reserva, cancelar, check-in, check-out e atualizar recurso. |
| 25 | E07 | Remocao completa de dados mockados do fluxo principal | Alta | Recomendado | Eliminar PDFs mockados, textos de demo e dados demonstrativos como base operacional. |
| 26 | E08 | Padronizacao de modelos e nomenclatura | Media | Recomendado | Alinhar status, tipos, labels e nomes de campos ao fluxo real do produto. |
| 27 | E09 | Revisao do fluxo de nova reserva | Media | Recomendado | Refinar defaults, selecao de horario, selecao de veiculo e feedbacks do formulario. |
| 28 | E10 | Melhorias de estados vazios e feedback | Media | Recomendado | Ampliar estados vazios, mensagens de retorno e feedback visual de sucesso/erro nas telas principais. |
| 29 | E11 | Melhorias de navegacao na agenda diaria | Media | Recomendado | Quando houver mais de uma reserva no dia, permitir escolher qual abrir e navegar melhor entre reservas. |
| 30 | E12 | Ajustes de acessibilidade e clareza | Media | Recomendado | Revisar contraste, CTA, textos, areas clicaveis e semantica de componentes. |
| 31 | E13 | Revisao de componentes reutilizaveis | Media | Recomendado | Consolidar cards, headers, feedbacks e formularios para reduzir duplicacao visual e tecnica. |

---

## Backlog evolutivo

Estes itens sao secundarios e devem entrar somente depois da estabilizacao operacional.

| Prioridade | ID | Entregavel | Criticidade | Importancia | O que precisa ser entregue |
|---|---|---|---|---|---|
| 32 | X01 | Exportacoes mais completas e administraveis | Media | Evolutivo | Expandir exportacoes, filtros, formatos e rastreio de geracao de relatorios. |
| 33 | X02 | Melhorias no painel de indicadores | Baixa | Evolutivo | Evoluir metricas, graficos e recortes operacionais depois que os dados estiverem confiaveis. |
| 34 | X03 | Evolucao para anexos e documentos reais | Media | Evolutivo | Trocar visualizacoes mockadas por anexos reais integrados ao backend. |
| 35 | X04 | Expansao para outros recursos reservaveis | Media | Evolutivo | Evoluir para materiais e equipamentos somente depois de estabilizar o dominio de veiculos. |

---

## Ordem executiva recomendada

1. Fechar regras operacionais minimas de elegibilidade.
2. Garantir atraso, SLA, auditoria e historico persistido.
3. Fechar testes automatizados das regras centrais.
4. Fechar manutencao, consistencia entre telas e erros operacionais.
5. Implantar pipeline, observabilidade e homologacao.
6. Refatorar o que ainda estiver gerando acoplamento e risco de regressao.
7. Evoluir UX, dashboard e backlog incremental depois da estabilizacao.

---

## Criterio objetivo de go-live

O app so deve ser considerado apto para producao quando:

- existir autenticacao real;
- houver backend persistente e multiusuario;
- a permissao de acoes criticas estiver protegida por perfil e ownership;
- o fluxo `reservado -> em uso -> concluida` estiver consistente em todas as telas;
- reservas vencidas forem tratadas corretamente;
- historico e auditoria estiverem persistidos;
- testes minimos cobrirem as regras centrais;
- a homologacao operacional tiver sido concluida.
