import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const temporaryPassword = resolveTemporaryPassword();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Defina SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY para provisionar usuarios autenticados."
  );
  process.exit(1);
}

if (!temporaryPassword) {
  console.error(
    "Defina SUPABASE_AUTH_TEMP_PASSWORD ou passe --password=<senha-temporaria> para provisionar os usuarios no Supabase Auth."
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

function resolveTemporaryPassword() {
  const explicitPasswordArg = process.argv.find((argument) => argument.startsWith("--password="));

  if (explicitPasswordArg) {
    return explicitPasswordArg.slice("--password=".length).trim();
  }

  return process.env.SUPABASE_AUTH_TEMP_PASSWORD?.trim();
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

async function listExistingAuthUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data?.users) ? data.users : [];
}

async function loadPublicUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, email_corporativo, auth_user_id")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function createAuthUser(user, password) {
  const loginEmail = normalizeEmail(user.email_corporativo || user.email);

  if (!loginEmail) {
    throw new Error(`Usuario ${user.id} nao possui email para provisionamento.`);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: {
      app_user_id: user.id,
      full_name: user.full_name,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Falha ao criar usuario auth para ${loginEmail}.`);
  }

  return data.user;
}

async function linkPublicUserToAuth(publicUserId, authUserId) {
  const { error } = await supabase
    .from("users")
    .update({ auth_user_id: authUserId })
    .eq("id", publicUserId);

  if (error) {
    throw error;
  }
}

async function run() {
  const [publicUsers, existingAuthUsers] = await Promise.all([
    loadPublicUsers(),
    listExistingAuthUsers(),
  ]);

  const existingByEmail = new Map(
    existingAuthUsers
      .filter((user) => normalizeEmail(user.email))
      .map((user) => [normalizeEmail(user.email), user])
  );

  const provisionedAccounts = [];

  for (const publicUser of publicUsers) {
    const loginEmail = normalizeEmail(publicUser.email_corporativo || publicUser.email);

    if (!loginEmail) {
      continue;
    }

    const authUser =
      existingByEmail.get(loginEmail) ?? (await createAuthUser(publicUser, temporaryPassword));

    existingByEmail.set(loginEmail, authUser);

    if (publicUser.auth_user_id !== authUser.id) {
      await linkPublicUserToAuth(publicUser.id, authUser.id);
    }

    provisionedAccounts.push({
      userId: publicUser.id,
      fullName: publicUser.full_name,
      loginEmail,
      authUserId: authUser.id,
    });
  }

  console.log("Provisionamento de usuarios autenticados concluido.");
  console.log(`Usuarios vinculados: ${provisionedAccounts.length}`);
  console.log(`Senha temporaria aplicada: ${temporaryPassword}`);
  console.log("");

  provisionedAccounts.forEach((account) => {
    console.log(`${account.userId} | ${account.loginEmail} | ${account.fullName}`);
  });
}

run().catch((error) => {
  console.error("Falha ao provisionar os usuarios no Supabase Auth.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
