import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const args = parseArgs(process.argv.slice(2));

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Defina SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY para resetar senhas no Supabase Auth."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function loadLocalEnv() {
  const candidateFiles = [".env.local", ".env"];

  candidateFiles.forEach((filename) => {
    const absolutePath = path.join(rootDir, filename);

    if (!existsSync(absolutePath)) {
      return;
    }

    const content = readFileSync(absolutePath, "utf8");

    content.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const name = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (!process.env[name]) {
        process.env[name] = value;
      }
    });
  });
}

function parseArgs(argv) {
  return argv.reduce(
    (result, argument) => {
      if (argument === "--list") {
        result.list = true;
        return result;
      }

      if (argument === "--no-force-change") {
        result.forceChange = false;
        return result;
      }

      if (argument === "--force-change") {
        result.forceChange = true;
        return result;
      }

      if (!argument.startsWith("--")) {
        return result;
      }

      const separatorIndex = argument.indexOf("=");

      if (separatorIndex === -1) {
        return result;
      }

      const key = argument.slice(2, separatorIndex);
      const value = argument.slice(separatorIndex + 1).trim();

      if (key === "user") {
        result.userId = value;
      }

      if (key === "matricula") {
        result.matricula = value;
      }

      if (key === "password") {
        result.password = value;
      }

      return result;
    },
    {
      list: false,
      forceChange: true,
      userId: "",
      matricula: "",
      password: "",
    }
  );
}

function printUsage() {
  console.log("Uso:");
  console.log("  npm run auth:reset:supabase -- --list");
  console.log("  npm run auth:reset:supabase -- --user=usr-01 --password=123456");
  console.log("  npm run auth:reset:supabase -- --matricula=SIG-20451 --password=123456");
  console.log(
    "  npm run auth:reset:supabase -- --user=usr-01 --password=123456 --no-force-change"
  );
}

async function loadPublicUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, matricula, auth_user_id, email")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

function normalize(value) {
  return value?.trim().toLowerCase() ?? "";
}

function findTargetUser(users) {
  if (args.userId) {
    return (
      users.find((user) => normalize(user.id) === normalize(args.userId)) ?? null
    );
  }

  if (args.matricula) {
    return (
      users.find((user) => normalize(user.matricula) === normalize(args.matricula)) ?? null
    );
  }

  return null;
}

async function resetPassword(targetUser) {
  if (!targetUser.auth_user_id) {
    throw new Error(
      `O usuario ${targetUser.id} ainda nao possui auth_user_id. Rode primeiro npm run auth:provision:supabase.`
    );
  }

  const password = args.password.trim();

  if (!password) {
    throw new Error("Informe a nova senha com --password=<nova-senha>.");
  }

  if (password.length < 6) {
    throw new Error("A nova senha precisa ter pelo menos 6 caracteres para o Supabase Auth.");
  }

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
    targetUser.auth_user_id
  );

  if (authError || !authData.user) {
    throw authError ?? new Error(`Nao foi possivel localizar o usuario auth ${targetUser.auth_user_id}.`);
  }

  const currentMetadata =
    authData.user.user_metadata && typeof authData.user.user_metadata === "object"
      ? authData.user.user_metadata
      : {};

  const nextMetadata = {
    ...currentMetadata,
    app_user_id: targetUser.id,
    full_name: targetUser.full_name,
    must_change_password: args.forceChange,
    temporary_password_assigned_at: args.forceChange ? new Date().toISOString() : null,
  };

  const { error } = await supabase.auth.admin.updateUserById(targetUser.auth_user_id, {
    password,
    user_metadata: nextMetadata,
  });

  if (error) {
    throw error;
  }

  console.log("Senha resetada com sucesso.");
  console.log(`Usuario: ${targetUser.id} | ${targetUser.full_name}`);
  console.log(`Matricula: ${targetUser.matricula}`);
  console.log(`Troca obrigatoria no proximo login: ${args.forceChange ? "sim" : "nao"}`);
}

async function run() {
  const users = await loadPublicUsers();

  if (args.list) {
    console.log("Usuarios disponiveis para reset:");
    users.forEach((user) => {
      console.log(
        `${user.id} | ${user.matricula} | ${user.full_name} | ${user.auth_user_id ? "auth-ok" : "sem-auth"}`
      );
    });
    return;
  }

  const targetUser = findTargetUser(users);

  if (!targetUser) {
    printUsage();
    throw new Error(
      "Informe um usuario valido com --user=<id> ou --matricula=<matricula>."
    );
  }

  await resetPassword(targetUser);
}

run().catch((error) => {
  console.error("Falha ao resetar a senha no Supabase Auth.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
