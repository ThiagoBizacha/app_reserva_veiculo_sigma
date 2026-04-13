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
- ausencia de autenticacao real;
- ausencia de backend persistente e multiusuario;
- permissoes fracas para acoes criticas;
- ausencia de auditoria operacional;
- baixa garantia de qualidade para release.

---

## Proximo desenvolvimento recomendado

A frente recomendada para a proxima etapa e iniciar pela infraestrutura de backend persistente, abrindo caminho para autenticacao, autorizacao e persistencia real do dominio.

Sequencia recomendada agora:

1. `B03` Backend persistente e multiusuario
2. `B01` Autenticacao real e gestao de sessao
3. `B02` Autorizacao por perfil e ownership
4. `B05` Regras operacionais minimas
5. `B06` Tratamento real de atraso e SLA
6. `B07` Auditoria e historico persistido
7. `B08` Testes automatizados das regras centrais

Observacao:
- `B04` continua critico para go-live, mas fica fora da etapa inicial de infraestrutura.
- Nome sugerido para o commit inicial desta frente: `feat: inicia infraestrutura de backend persistente`

Subetapas executaveis do `B03`:

1. Definir modelo de dados.
2. Escolher backend.
3. Criar camada de servicos/repositorios.
4. Trocar leituras da store local por leitura remota.
5. Persistir reservas, veiculos e usuarios.

---

## Bloco 1 - Bloqueadores imediatos

Estes itens impedem go-live.

| Prioridade | ID | Entregavel | Criticidade | Importancia | O que precisa ser entregue |
|---|---|---|---|---|---|
| 1 | B01 | Autenticacao real e gestao de sessao | Critica | Obrigatorio para go-live | Implementar login real, sessao valida, logout consistente e identificacao do usuario autenticado. Remover acesso livre e eliminar usuario fixo no app. |
| 2 | B02 | Autorizacao por perfil e ownership | Critica | Obrigatorio para go-live | Garantir que apenas usuarios autorizados possam cancelar reservas, registrar check-in/check-out, editar cadastros e acessar areas administrativas. O usuario so pode agir sobre reservas permitidas ao seu papel. |
| 3 | B03 | Backend persistente e multiusuario | Critica | Obrigatorio para go-live | Substituir mocks e `AsyncStorage` como fonte principal por backend real com persistencia centralizada, sincronizacao confiavel e dados consistentes entre usuarios e dispositivos. |
| 4 | B04 | State machine oficial da reserva e do recurso | Critica | Obrigatorio para go-live | Formalizar estados validos e transicoes permitidas para reserva e veiculo: solicitada, reservado, em uso, concluida, cancelada, em atraso, manutencao e disponivel. Alinhar tipos, store, agenda, frota, painel e historico. |
| 5 | B05 | Regras operacionais minimas de elegibilidade | Critica | Obrigatorio para go-live | Validar CNH, papel do usuario, datas passadas, janela de retirada/devolucao, manutencao, inatividade do veiculo e consistencia temporal da reserva. |
| 6 | B06 | Tratamento real de atraso e SLA | Critica | Obrigatorio para go-live | Detectar devolucao fora do prazo, mudar status para `Em atraso`, alertar operacao e refletir isso em todas as telas. |
| 7 | B07 | Auditoria e historico persistido | Critica | Obrigatorio para go-live | Persistir criacao, alteracao, cancelamento, check-in, check-out e acoes administrativas com ator, data/hora e origem da acao. |
| 8 | B08 | Testes automatizados das regras centrais | Critica | Obrigatorio para go-live | Cobrir conflito de agenda, criacao, cancelamento, check-in, check-out, atraso, manutencao e permissoes. |

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

1. Fechar autenticacao, autorizacao e backend.
2. Formalizar a state machine oficial e as regras operacionais centrais.
3. Garantir atraso, auditoria e historico persistido.
4. Fechar testes de regras centrais.
5. Fechar manutencao, consistencia entre telas e erros operacionais.
6. Implantar pipeline, observabilidade e homologacao.
7. Refatorar o que ainda estiver gerando acoplamento e risco de regressao.
8. Evoluir UX, dashboard e backlog incremental depois da estabilizacao.

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
