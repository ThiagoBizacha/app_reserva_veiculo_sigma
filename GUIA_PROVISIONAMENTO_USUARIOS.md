# Guia de Provisionamento de Usuários — Sigma Reserva

Este guia é para o **administrador do sistema** responsável por criar e gerenciar contas de acesso ao app.

---

## Visão geral do fluxo

```
Admin cadastra usuário no app (Settings)
        ↓
Admin roda o script de provisionamento
        ↓
Script cria conta no Supabase Auth com senha temporária
        ↓
Admin comunica email + senha temporária ao usuário
        ↓
Usuário abre o app e faz login
        ↓
App exige troca de senha antes de liberar acesso
        ↓
Usuário define senha definitiva e começa a usar
```

---

## Pré-requisitos do admin

Antes de provisionar qualquer usuário, o admin precisa ter:

1. **Node.js** instalado na máquina (v18+)
2. O arquivo `.env.local` no projeto com as variáveis:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ptjzkrhprxuvshkxhqfh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<chave secreta do projeto Supabase>
   ```
3. Dependências do projeto instaladas:
   ```bash
   npm install
   ```

> A `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o app. Ela é usada apenas neste script local.

---

## Passo 1 — Cadastrar o usuário no sistema

O usuário precisa existir na tabela `public.users` antes de ter uma conta de autenticação.

**Via app (tela de Configurações):**

1. Abra o app como administrador
2. Acesse a aba **Config**
3. Na seção **Usuários**, toque em **Novo usuário**
4. Preencha os dados: nome, matrícula, email corporativo, departamento, cargo, CNH (se aplicável)
5. Salve

**Via Supabase Dashboard (alternativa):**

1. Acesse [supabase.com](https://supabase.com) → seu projeto → Table Editor → tabela `users`
2. Insira uma linha com os campos obrigatórios: `id` (formato `usr-XXXXX`), `full_name`, `email_corporativo`

---

## Passo 2 — Criar a conta de autenticação

Com o usuário na tabela `users`, rode o script de provisionamento:

```bash
# Usando a senha temporária definida no .env.local (SUPABASE_AUTH_TEMP_PASSWORD)
npm run auth:provision:supabase

# Ou passando a senha diretamente:
npm run auth:provision:supabase -- --password=SigmaTemp2024
```

**O que o script faz:**

- Lê todos os usuários de `public.users`
- Para cada usuário com `email_corporativo`:
  - Se **não tem conta** no Supabase Auth → cria com a senha temporária e define `must_change_password: true`
  - Se **já tem conta** → sincroniza os metadados (nome, vínculo) sem alterar senha
- Grava o `auth_user_id` de volta em `public.users` para vincular as contas

**Saída esperada:**

```
Provisionamento de usuarios autenticados concluido.
Usuarios vinculados: 5
Senha temporaria aplicada: SigmaTemp2024

usr-01 | joao.silva@sigma.com.br | João Silva
usr-02 | maria.souza@sigma.com.br | Maria Souza
...
```

> O script é **idempotente**: pode ser rodado várias vezes sem duplicar contas.

---

## Passo 3 — Comunicar as credenciais ao usuário

Envie para o usuário (por Teams, email ou mensagem):

```
App: Sigma Reserva
Link/QR: <link do APK ou QR gerado pelo EAS>

Email de acesso: joao.silva@sigma.com.br
Senha temporária: SigmaTemp2024

No primeiro acesso o app vai pedir para você definir uma senha pessoal.
```

---

## Passo 4 — Primeiro acesso do usuário

O usuário não precisa configurar nada. Basta:

1. Instalar o APK (uma vez)
2. Abrir o app → ver a tela de login com o logo Sigma
3. Digitar o email corporativo e a senha temporária
4. O app redireciona automaticamente para a tela **"Definir nova senha"**
5. Digitar a nova senha (mínimo 8 caracteres) e confirmar
6. Toque em **Salvar nova senha**
7. O app libera acesso completo imediatamente

A partir do segundo acesso, o usuário entra diretamente com a senha que definiu.

---

## Gerenciar usuários existentes

### Redefinir senha de um usuário

Se um usuário esquecer a senha, o admin pode resetar diretamente no Supabase Auth:

1. Acesse o Supabase Dashboard → Authentication → Users
2. Localize o usuário pelo email
3. Clique em **Reset password** e envie a nova senha temporária
4. Comunique ao usuário — no próximo login, o app não força nova troca automaticamente nesse caso

> Alternativa: atualizar `must_change_password: true` nos metadados do usuário no Supabase Auth para forçar a troca na próxima entrada.

### Adicionar usuários em lote

Se precisar cadastrar vários usuários de uma vez:

1. Insira todos na tabela `public.users` (via Supabase Dashboard ou script SQL)
2. Rode o script de provisionamento uma única vez — ele processa todos:
   ```bash
   npm run auth:provision:supabase -- --password=SigmaTemp2024
   ```

### Revogar acesso de um usuário

1. No Supabase Dashboard → Authentication → Users
2. Localize o usuário e clique em **Delete user**
3. Opcionalmente, desative ou remova da tabela `public.users` para que não apareça na listagem do app

---

## Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| Script termina com erro de credenciais | `SUPABASE_SERVICE_ROLE_KEY` não definida ou incorreta no `.env.local` | Verifique o arquivo `.env.local` |
| Usuário não aparece na saída do script | `email_corporativo` está vazio na tabela `users` | Preencha o campo no app (Settings) ou direto no Supabase |
| Usuário consegue logar mas app trava na tela de loading | `auth_user_id` não foi gravado em `public.users` | Rode o script novamente — ele faz o vínculo automático |
| Usuário vê "Backend não configurado" | APK foi gerado sem as variáveis de ambiente embarcadas | Rebuild com o perfil `production` do EAS |
| App não exige troca de senha no primeiro acesso | `must_change_password` não está `true` nos metadados | Verifique no Supabase Auth → User → Metadata |

---

## Referência rápida de comandos

```bash
# Provisionar todos os usuários com senha do .env.local
npm run auth:provision:supabase

# Provisionar com senha específica
npm run auth:provision:supabase -- --password=MinhaSenh@2024

# Buildar o APK para distribuição
eas build --profile production --platform android

# Publicar atualização OTA (sem rebuild)
eas update --branch production --message "descrição da atualização"
```
