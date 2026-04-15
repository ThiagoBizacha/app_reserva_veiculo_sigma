# Guia de Provisionamento de Usuarios - Sigma Reserva

Este guia e para o administrador do sistema responsavel por criar, importar, provisionar e resetar acessos no app.

## Visao geral do fluxo

```text
Admin cadastra ou importa usuario em public.users
        |
        v
Admin roda npm run auth:provision:supabase
        |
        v
Supabase Auth cria ou sincroniza a conta
        |
        v
Admin comunica username e senha temporaria
        |
        v
Usuario entra no app com username ou email
        |
        v
App exige troca de senha no primeiro acesso
```

## Regra de login

- o identificador principal agora e `username`
- `email` e opcional
- se o usuario tiver email, o Auth usa esse email real
- se o usuario nao tiver email, o Auth usa um email tecnico interno:
  - `username@auth.sigmalithium.local`
- para o usuario final, o login aceito no app e:
  - `username`
  - ou `email`, quando existir

Exemplos:

- `TBIZACHA`
- `GBANDEIRA`
- `thiago.bizacha@sigmalithium.com.br`

## Pre-requisitos

1. Ter `Node.js` instalado.
2. Estar na raiz do projeto.
3. Ter `.env.local` preenchido com:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta
SUPABASE_AUTH_TEMP_PASSWORD=123456
```

4. Ter aplicado no Supabase as migrations:

- `202604150007_users_schema_compatibilidade.sql`
- `202604150009_username_login.sql`

## Passo 1 - Cadastrar um usuario manualmente

Voce pode cadastrar pelo app ou direto no Supabase.

Campos principais recomendados:

- `full_name`
- `username`
- `matricula`
- `role`
- `area_departamento`
- `centro_custo`
- `telefone`
- `matriz`
- `cnh_categoria`
- `cnh_status`

Campo opcional:

- `email`

Observacoes:

- `username` deve ser unico
- `email` pode ficar vazio
- `cpf` e `cnh_numero` podem ficar vazios

## Passo 2 - Importar usuarios em massa da planilha

Dry-run:

```bash
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --dry-run
```

Aplicacao real:

```bash
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --apply
```

O importador:

- le `.xlsx` e `.csv`
- gera `username` unico
- atualiza ou insere por `email`, `matricula` ou `username`
- permite usuarios sem email
- nao apaga usuarios fora da planilha
- aceita `cpf` e `cnh_numero` vazios

Depois da carga, rode sempre o provisionamento do Auth.

## Passo 3 - Provisionar o Supabase Auth

Comando:

```bash
npm run auth:provision:supabase
```

Ou com senha explicita:

```bash
npm run auth:provision:supabase -- --password=123456
```

O script:

- le os usuarios de `public.users`
- cria contas no Supabase Auth quando ainda nao existem
- sincroniza contas ja existentes
- grava `auth_user_id` em `public.users`
- marca `must_change_password = true`

Saida esperada:

```text
Provisionamento de usuarios autenticados concluido.
Usuarios vinculados: 58
Senha temporaria aplicada: 123456

usr-01 | TBIZACHA | thiago.bizacha@sigmalithium.com.br | Thiago Nunes Bizacha
usr-import-00392496 | GBANDEIRA | gbandeira@auth.sigmalithium.local | Gabriel Fiussem Bandeira
```

## Passo 4 - Comunicar o acesso ao usuario

Passe ao usuario:

- link do app: `https://sigma-reserva.vercel.app`
- `username`
- `email`, se existir
- senha temporaria

Exemplo:

```text
App: Sigma Reserva
Link: https://sigma-reserva.vercel.app
Usuario: TBIZACHA
Senha temporaria: 123456

No primeiro acesso o sistema vai pedir a definicao da senha definitiva.
```

## Passo 5 - Primeiro acesso

O usuario deve:

1. abrir `https://sigma-reserva.vercel.app`
2. informar `username` ou `email`
3. informar a senha temporaria
4. definir uma nova senha numerica com pelo menos `6` digitos

## Reset de senha

Listar usuarios:

```bash
npm run auth:reset:supabase -- --list
```

Reset por `id`:

```bash
npm run auth:reset:supabase -- --user=usr-01 --password=123456
```

Reset por `username`:

```bash
npm run auth:reset:supabase -- --username=TBIZACHA --password=123456
```

Reset por `matricula`:

```bash
npm run auth:reset:supabase -- --matricula=SIG-20451 --password=123456
```

Sem forcar troca no proximo login:

```bash
npm run auth:reset:supabase -- --username=TBIZACHA --password=123456 --no-force-change
```

## Conferencias no Supabase

Depois do provisionamento, confira:

1. `Table Editor > public.users`
2. coluna `username` preenchida
3. coluna `auth_user_id` preenchida
4. `Authentication > Users`

Resultados esperados:

- todos os usuarios com `auth_user_id`
- usuarios sem email real presentes no Auth com email tecnico
- login funcionando por `username`

## Troubleshooting

| Problema | Causa provavel | Acao |
|---|---|---|
| usuario nao consegue logar por username | `202604150009` nao foi aplicada | aplique a migration e rode `npm run auth:provision:supabase` |
| usuario sem email nao entrou no Auth | provisionamento nao foi rerodado | rode `npm run auth:provision:supabase` |
| linha da planilha foi ignorada | faltou `matricula` | corrija a planilha e importe novamente |
| usuario aparece sem auth | `auth_user_id` vazio | rode `npm run auth:provision:supabase` |

## Referencia rapida

```bash
# importar planilha sem gravar
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --dry-run

# importar planilha de verdade
npm run users:import:supabase -- --file="C:\caminho\usuarios.xlsx" --apply

# provisionar auth
npm run auth:provision:supabase

# listar usuarios para reset
npm run auth:reset:supabase -- --list

# resetar por username
npm run auth:reset:supabase -- --username=TBIZACHA --password=123456
```
