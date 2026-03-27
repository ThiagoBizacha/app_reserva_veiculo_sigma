# Sigma Reserva

MVP mobile em React Native + Expo para reserva de recursos corporativos, com foco em veículos e materiais compartilhados. O projeto foi estruturado para rodar em Android na orientação vertical, usando apenas mocks locais e arquitetura preparada para futura evolução para backend real.

## Visão geral

O app entrega:

- splash inicial com identidade visual corporativa;
- dashboard executivo com indicadores e atalhos;
- catálogo de recursos com busca e filtros;
- agenda mensal com calendário visual e status por dia;
- criação de reserva com validações locais e conflito visual;
- tela de minhas reservas;
- detalhe completo da reserva com histórico mockado;
- administração simples com alternância local de manutenção/ativo.

## Stack

- React Native
- Expo
- TypeScript
- Expo Router
- StyleSheet nativo
- Estado local com React Context
- Dados mockados locais

## Decisão de navegação

Foi utilizado `Expo Router` em vez de React Navigation puro por três razões:

1. Simplifica a organização do MVP por rotas em arquivo, deixando tabs, stack e detalhes mais previsíveis.
2. Reduz boilerplate para um projeto que ainda não possui backend, autenticação ou módulos nativos customizados.
3. Facilita a evolução futura para novos fluxos como aprovação, retirada e devolução sem reestruturar a base de navegação.

## Estrutura de pastas

```text
app/
  (tabs)/
    _layout.tsx
    admin.tsx
    agenda.tsx
    home.tsx
    reservations.tsx
    resources.tsx
  reservation/
    [id].tsx
    new.tsx
  resource/
    [id].tsx
  +not-found.tsx
  _layout.tsx
  index.tsx
src/
  components/
  constants/
  data/
  hooks/
  screens/
  theme/
  types/
  utils/
app.json
babel.config.js
expo-env.d.ts
package.json
tsconfig.json
README.md
```

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o Expo:

```bash
npm run android
```

Se preferir abrir primeiro o servidor:

```bash
npm run start
```

### Abrir no celular em outra rede

Se o celular nao estiver na mesma rede Wi-Fi do computador, inicie o Expo com tunel:

```bash
npx expo start --tunnel
```

Ou com limpeza de cache:

```bash
npx expo start --tunnel --clear
```

Depois:

- abra o `Expo Go` no celular;
- escaneie o QR code exibido no terminal;
- aguarde o app abrir pelo tunel.

Se o tunel falhar, os pontos mais comuns sao:

- VPN ativa;
- firewall bloqueando `node.exe`;
- instabilidade temporaria do `ngrok`;
- rede corporativa bloqueando tunel.

## Decisões técnicas

- O design system foi centralizado em `src/theme` para cores, tipografia, espaçamentos, raios e sombras.
- Os dados mockados ficam em `src/data`, com tipos dedicados em `src/types`.
- As telas estão em `src/screens` e os componentes reutilizáveis em `src/components`.
- O estado local vive em `src/hooks/useReservationStore.tsx`, encapsulando criação de reserva e alternância de manutenção.
- As regras de negócio locais cobrem:
  - bloqueio de data final menor que inicial;
  - detecção de conflito por período;
  - status visual do recurso;
  - status diário no calendário;
  - navegação entre agenda, recurso, criação e detalhe.

## Próximos passos para backend real

- Substituir mocks por camada de serviços em `src/services`.
- Persistir reservas e recursos em API ou banco corporativo.
- Introduzir autenticação corporativa e perfis reais.
- Adicionar aprovação, retirada, devolução e auditoria persistida.
- Implementar cache/offline e sincronização.
- Cobrir regras de negócio com testes automatizados.

## Observação do workspace

O repositório atual já continha outras pastas não relacionadas ao MVP. O app desta entrega está concentrado nas pastas `app/`, `src/` e nos arquivos de configuração Expo criados na raiz.
