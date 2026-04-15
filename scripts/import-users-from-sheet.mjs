import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const args = parseArgs(process.argv.slice(2));

if (!args.filePath) {
  printUsage();
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Defina SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY para importar usuarios."
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
      if (argument === "--apply") {
        result.apply = true;
        return result;
      }

      if (argument === "--dry-run") {
        result.apply = false;
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

      if (key === "file") {
        result.filePath = value;
      }

      if (key === "sheet") {
        result.sheetName = value;
      }

      return result;
    },
    {
      apply: false,
      filePath: "",
      sheetName: "",
    }
  );
}

function printUsage() {
  console.log("Uso:");
  console.log('  npm run users:import:supabase -- --file="C:\\\\caminho\\\\usuarios.xlsx" --dry-run');
  console.log('  npm run users:import:supabase -- --file="C:\\\\caminho\\\\usuarios.xlsx" --apply');
  console.log(
    '  npm run users:import:supabase -- --file="C:\\\\caminho\\\\usuarios.xlsx" --sheet=Planilha1 --dry-run'
  );
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparable(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isBlankLike(value) {
  const normalized = normalizeComparable(value);
  return !normalized || ["n/a", "na", "null", "-", "--"].includes(normalized);
}

function normalizeEmail(value) {
  const email = normalizeText(value).toLowerCase();
  if (!email || isBlankLike(email)) {
    return "";
  }
  return email;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRole(value) {
  const normalized = normalizeComparable(value);

  if (!normalized || normalized === "solicitante") {
    return "Solicitante";
  }

  if (normalized === "operacao") {
    return "Operação";
  }

  if (normalized === "administrador" || normalized === "admin") {
    return "Administrador";
  }

  return "Solicitante";
}

function normalizeCnhStatus(value) {
  const normalized = normalizeComparable(value);

  if (normalized === "valida") {
    return { value: "Válida", warning: null };
  }

  if (normalized === "vencida") {
    return { value: "Vencida", warning: null };
  }

  return {
    value: "Vencida",
    warning: "status_cnh_ausente_ou_invalido_assumido_como_vencida",
  };
}

function normalizeBoolean(value) {
  const normalized = normalizeComparable(value);

  if (["1", "true", "sim", "yes", "y", "x"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "nao", "não", "no", "n"].includes(normalized)) {
    return false;
  }

  return false;
}

function excelSerialToIso(serialValue) {
  const baseDate = new Date(Date.UTC(1899, 11, 30));
  const numericValue = Number(serialValue);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  const wholeDays = Math.floor(numericValue);
  const milliseconds = wholeDays * 24 * 60 * 60 * 1000;
  const nextDate = new Date(baseDate.getTime() + milliseconds);
  return nextDate.toISOString();
}

function parseDateToIso(value) {
  if (isBlankLike(value)) {
    return {
      value: new Date().toISOString(),
      warning: "data_validacao_cnh_ausente_assumida_como_agora",
    };
  }

  const rawValue = normalizeText(value);

  if (/^\d+(\.\d+)?$/.test(rawValue)) {
    const excelDate = excelSerialToIso(rawValue);
    if (excelDate) {
      return { value: excelDate, warning: null };
    }
  }

  const brazilianFormat = rawValue.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (brazilianFormat) {
    const [, day, month, year] = brazilianFormat;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) {
      return { value: date.toISOString(), warning: null };
    }
  }

  const directDate = new Date(rawValue);
  if (!Number.isNaN(directDate.getTime())) {
    return { value: directDate.toISOString(), warning: null };
  }

  return {
    value: new Date().toISOString(),
    warning: "data_validacao_cnh_invalida_assumida_como_agora",
  };
}

function buildStableImportId(email, matricula) {
  const seed = normalizeComparable(`${email}|${matricula}`);
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `usr-import-${hash.toString(16).padStart(8, "0")}`;
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function runSpreadsheetReader(filePath, sheetName) {
  const readerScript = path.join(rootDir, "scripts", "read-users-spreadsheet.py");
  const commandArgs = [readerScript, `--file=${filePath}`];

  if (sheetName) {
    commandArgs.push(`--sheet=${sheetName}`);
  }

  const result = spawnSync("python", commandArgs, {
    cwd: rootDir,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout?.trim();
  const stderr = result.stderr?.trim();

  if (result.status !== 0) {
    throw new Error(stderr || stdout || "Falha ao ler a planilha informada.");
  }

  if (!stdout) {
    throw new Error("O leitor da planilha nao retornou dados.");
  }

  const payload = JSON.parse(stdout);
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function loadExistingUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, user_id, full_name, email, matricula, role, auth_user_id")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildExistingIndexes(existingUsers) {
  const usersByEmail = new Map();
  const usersByMatricula = new Map();

  existingUsers.forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email);
    const normalizedMatricula = normalizeComparable(user.matricula);

    if (normalizedEmail) {
      usersByEmail.set(normalizedEmail, user);
    }

    if (normalizedMatricula) {
      usersByMatricula.set(normalizedMatricula, user);
    }
  });

  return { usersByEmail, usersByMatricula };
}

function prepareImportRows(parsedRows, existingUsers) {
  const { usersByEmail, usersByMatricula } = buildExistingIndexes(existingUsers);
  const seenEmails = new Set();
  const seenMatriculas = new Set();
  const readyRecords = [];
  const skippedRows = [];
  const warnings = [];
  let insertedCount = 0;
  let updatedCount = 0;

  parsedRows.forEach((row) => {
    const rowNumber = Number(row.__row_number__ || 0);
    const fullName = normalizeText(row.NomeCompleto);
    const email = normalizeEmail(row.EmailCorporativo);
    const matricula = normalizeText(row.Matricula).toUpperCase();
    const rowWarnings = [];
    const rowErrors = [];

    if (!fullName || isBlankLike(fullName)) {
      rowErrors.push("nome_completo_ausente");
    }

    if (!email || !isValidEmail(email)) {
      rowErrors.push("email_invalido_ou_ausente");
    }

    if (!matricula || isBlankLike(matricula)) {
      rowErrors.push("matricula_ausente");
    }

    if (email && seenEmails.has(email)) {
      rowErrors.push("email_duplicado_na_planilha");
    }

    if (matricula && seenMatriculas.has(matricula)) {
      rowErrors.push("matricula_duplicada_na_planilha");
    }

    if (rowErrors.length > 0) {
      skippedRows.push({
        rowNumber,
        fullName,
        email,
        matricula,
        reasons: rowErrors,
      });
      return;
    }

    seenEmails.add(email);
    seenMatriculas.add(matricula);

    const matchedByEmail = usersByEmail.get(email);
    const matchedByMatricula = usersByMatricula.get(normalizeComparable(matricula));

    if (
      matchedByEmail &&
      matchedByMatricula &&
      matchedByEmail.id !== matchedByMatricula.id
    ) {
      skippedRows.push({
        rowNumber,
        fullName,
        email,
        matricula,
        reasons: ["conflito_email_e_matricula_apontam_para_usuarios_diferentes"],
      });
      return;
    }

    const existingUser = matchedByEmail ?? matchedByMatricula ?? null;
    const importedRole = normalizeRole(row.Perfil);
    const finalRole =
      existingUser?.role &&
      ["Operação", "Administrador"].includes(existingUser.role) &&
      importedRole === "Solicitante"
        ? existingUser.role
        : importedRole;

    if (existingUser?.role && existingUser.role !== finalRole) {
      rowWarnings.push(`papel_preservado_como_${existingUser.role}`);
    }

    const normalizedCnhStatus = normalizeCnhStatus(row["CNH_Status(Valida/vencida)"]);
    if (normalizedCnhStatus.warning) {
      rowWarnings.push(normalizedCnhStatus.warning);
    }

    const normalizedValidationDate = parseDateToIso(row.CNH_DataUltimaValidacao);
    if (normalizedValidationDate.warning) {
      rowWarnings.push(normalizedValidationDate.warning);
    }

    const record = {
      id: existingUser?.id ?? buildStableImportId(email, matricula),
      user_id: existingUser?.user_id ?? existingUser?.id ?? buildStableImportId(email, matricula),
      auth_user_id: existingUser?.auth_user_id ?? null,
      full_name: fullName,
      cpf: isBlankLike(row.CPF) ? null : normalizeText(row.CPF),
      gestor_veiculo:
        normalizeBoolean(row.Gestor_Veiculo) || finalRole === "Operação" || finalRole === "Administrador",
      matricula,
      matriz: normalizeText(row.Matriz),
      role: finalRole,
      area_departamento: normalizeText(row.AreaDepartamento),
      centro_custo: normalizeText(row.CentroCusto),
      email,
      telefone: normalizeText(row.Telefone),
      gestor_nome: isBlankLike(row.GestorNome) ? null : normalizeText(row.GestorNome),
      cnh_numero: isBlankLike(row.CNH_Numero) ? null : normalizeText(row.CNH_Numero).toUpperCase(),
      cnh_categoria: normalizeText(row.CNH_Categoria).toUpperCase(),
      cnh_status: normalizedCnhStatus.value,
      cnh_data_ultima_validacao: normalizedValidationDate.value,
      cnh_anexo: isBlankLike(row.CNH_Anexo) ? "" : normalizeText(row.CNH_Anexo),
      termos_paytrack: !isBlankLike(row.Termos_Paytrack)
        ? normalizeBoolean(row.Termos_Paytrack)
        : true,
      observacao: isBlankLike(row["Observação"]) ? null : normalizeText(row["Observação"]),
    };

    if (!record.area_departamento) {
      rowWarnings.push("area_departamento_em_branco");
    }

    if (!record.centro_custo) {
      rowWarnings.push("centro_custo_em_branco");
    }

    if (!record.telefone) {
      rowWarnings.push("telefone_em_branco");
    }

    if (!record.cnh_categoria) {
      rowWarnings.push("categoria_cnh_em_branco");
    }

    if (!record.matriz) {
      rowWarnings.push("matriz_em_branco");
    }

    if (!record.cpf) {
      rowWarnings.push("cpf_em_branco");
    }

    if (!record.cnh_numero) {
      rowWarnings.push("cnh_numero_em_branco");
    }

    readyRecords.push({
      rowNumber,
      record,
      action: existingUser ? "update" : "insert",
      warnings: rowWarnings,
    });

    if (existingUser) {
      updatedCount += 1;
    } else {
      insertedCount += 1;
    }

    if (rowWarnings.length > 0) {
      warnings.push({
        rowNumber,
        fullName,
        email,
        warnings: rowWarnings,
      });
    }
  });

  return {
    readyRecords,
    skippedRows,
    warnings,
    insertedCount,
    updatedCount,
  };
}

async function applyImport(records) {
  for (const chunk of chunkArray(records, 100)) {
    const payload = chunk.map((item) => item.record);
    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

    if (error) {
      throw error;
    }
  }
}

function printReport({ apply, filePath, sheetName, totalRows, prepared, skippedRows, warnings, insertedCount, updatedCount }) {
  console.log(apply ? "Importacao oficial aplicada." : "Analise de importacao concluida (dry-run).");
  console.log(`Arquivo: ${filePath}`);
  console.log(`Aba: ${sheetName}`);
  console.log(`Linhas lidas: ${totalRows}`);
  console.log(`Linhas prontas: ${prepared.length}`);
  console.log(`Insercoes previstas: ${insertedCount}`);
  console.log(`Atualizacoes previstas: ${updatedCount}`);
  console.log(`Linhas ignoradas: ${skippedRows.length}`);
  console.log(`Linhas com alerta: ${warnings.length}`);

  if (skippedRows.length > 0) {
    console.log("");
    console.log("Linhas ignoradas:");
    skippedRows.slice(0, 20).forEach((row) => {
      console.log(
        `- linha ${row.rowNumber}: ${row.fullName || "(sem nome)"} | ${row.email || "(sem email)"} | ${row.reasons.join(", ")}`
      );
    });
  }

  if (warnings.length > 0) {
    console.log("");
    console.log("Alertas:");
    warnings.slice(0, 20).forEach((row) => {
      console.log(`- linha ${row.rowNumber}: ${row.fullName} | ${row.warnings.join(", ")}`);
    });
  }

  console.log("");
  console.log("Usuarios preservados fora da planilha nao sao removidos por este comando.");
}

async function run() {
  const absoluteFilePath = path.resolve(args.filePath);
  const sheetPayload = runSpreadsheetReader(absoluteFilePath, args.sheetName);
  const parsedRows = Array.isArray(sheetPayload.rows) ? sheetPayload.rows : [];
  const existingUsers = await loadExistingUsers();
  const preparedImport = prepareImportRows(parsedRows, existingUsers);

  if (args.apply && preparedImport.readyRecords.length > 0) {
    await applyImport(preparedImport.readyRecords);
  }

  printReport({
    apply: args.apply,
    filePath: absoluteFilePath,
    sheetName: sheetPayload.sheetName,
    totalRows: parsedRows.length,
    prepared: preparedImport.readyRecords,
    skippedRows: preparedImport.skippedRows,
    warnings: preparedImport.warnings,
    insertedCount: preparedImport.insertedCount,
    updatedCount: preparedImport.updatedCount,
  });
}

run().catch((error) => {
  console.error("Falha ao importar usuarios da planilha.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
