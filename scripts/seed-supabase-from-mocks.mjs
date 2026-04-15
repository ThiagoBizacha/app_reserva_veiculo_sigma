import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();
const usersFile = path.join(rootDir, "src", "data", "users.ts");
const resourcesFile = path.join(rootDir, "src", "data", "resources.ts");
const reservationsFile = path.join(rootDir, "src", "data", "reservations.ts");

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Defina SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY para executar a seed."
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

function extractExportedArray(filePath, exportName) {
  const fileContent = readFileSync(filePath, "utf8");
  const match = fileContent.match(
    new RegExp(`export const ${exportName}[^=]*=\\s*([\\s\\S]*?);\\s*(?:export const|$)`)
  );

  if (!match?.[1]) {
    throw new Error(`Nao foi possivel localizar a exportacao ${exportName} em ${filePath}.`);
  }

  return vm.runInNewContext(`(${match[1]})`);
}

function mapUser(user) {
  return {
    id: user.id,
    user_id: user.userId,
    full_name: user.fullName,
    cpf: user.cpf || null,
    gestor_veiculo: user.gestorVeiculo,
    matricula: user.matricula,
    matriz: user.matriz,
    role: user.role,
    area_departamento: user.areaDepartamento,
    centro_custo: user.centroCusto,
    email: user.email,
    telefone: user.telefone,
    gestor_nome: user.gestorNome ?? null,
    cnh_numero: user.cnhNumero || null,
    cnh_categoria: user.cnhCategoria,
    cnh_status: user.cnhStatus,
    cnh_data_ultima_validacao: user.cnhDataUltimaValidacao,
    cnh_anexo: user.cnhAnexo,
    termos_paytrack: user.termosPaytrack,
    observacao: user.observacao ?? null,
  };
}

function mapResource(resource) {
  return {
    id: resource.id,
    vehicle_id: resource.vehicleId ?? null,
    name: resource.name,
    code: resource.code,
    category: resource.category,
    status: resource.status,
    plate: resource.plate ?? null,
    model: resource.model ?? null,
    brand: resource.brand ?? null,
    year: resource.year ?? null,
    rental_company: resource.rentalCompany ?? null,
    vehicle_category: resource.vehicleCategory ?? null,
    current_mileage: resource.currentMileage ?? null,
    last_inspection_date: resource.lastInspectionDate ?? null,
    vehicle_document_attachment: resource.vehicleDocumentAttachment ?? null,
    vehicle_photo_attachments: resource.vehiclePhotoAttachments ?? [],
    last_maintenance_date: resource.lastMaintenanceDate ?? null,
    next_maintenance_date: resource.nextMaintenanceDate ?? null,
    last_maintenance_mileage: resource.lastMaintenanceMileage ?? null,
    next_maintenance_mileage: resource.nextMaintenanceMileage ?? null,
    observation: resource.observation ?? null,
    capacity: resource.capacity ?? null,
    description: resource.description,
    image_hint: resource.imageHint,
    next_available_at: resource.nextAvailableAt ?? null,
    tags: resource.tags ?? [],
  };
}

function mapReservation(reservation) {
  return {
    id: reservation.id,
    code: reservation.code,
    resource_id: reservation.resourceId,
    user_id: reservation.userId,
    title: reservation.title,
    purpose: reservation.purpose,
    base: reservation.base,
    start_date: reservation.startDate,
    end_date: reservation.endDate,
    planned_duration_hours: reservation.plannedDurationHours ?? null,
    status: reservation.status,
    notes: reservation.notes ?? null,
    approver: reservation.approver ?? null,
    check_in_at: reservation.checkInAt ?? null,
    check_out_at: reservation.checkOutAt ?? null,
    check_in_notes: reservation.checkInNotes ?? null,
    check_out_notes: reservation.checkOutNotes ?? null,
    start_mileage: reservation.startMileage ?? null,
    end_mileage: reservation.endMileage ?? null,
    check_in_checklist: reservation.checkInChecklist ?? null,
    check_out_checklist: reservation.checkOutChecklist ?? null,
    check_in_fuel_level: reservation.checkInFuelLevel ?? null,
    check_out_fuel_level: reservation.checkOutFuelLevel ?? null,
    check_in_data: reservation.checkInData ?? null,
    check_out_data: reservation.checkOutData ?? null,
  };
}

function mapReservationHistory(reservation) {
  return (reservation.history ?? []).map((item) => ({
    id: item.id,
    reservation_id: reservation.id,
    label: item.label,
    timestamp: item.timestamp,
    actor: item.actor,
    note: item.note ?? null,
  }));
}

async function upsertTable(tableName, records, onConflict = "id") {
  if (!records.length) {
    return;
  }

  const { error } = await supabase.from(tableName).upsert(records, { onConflict });

  if (error) {
    throw error;
  }
}

async function run() {
  const users = extractExportedArray(usersFile, "users");
  const resources = extractExportedArray(resourcesFile, "resources");
  const reservations = extractExportedArray(reservationsFile, "reservations");

  const userRows = users.map(mapUser);
  const resourceRows = resources.map(mapResource);
  const reservationRows = reservations.map(mapReservation);
  const reservationHistoryRows = reservations.flatMap(mapReservationHistory);

  await upsertTable("users", userRows);
  await upsertTable("resources", resourceRows);
  await upsertTable("reservations", reservationRows);
  await upsertTable("reservation_history", reservationHistoryRows);

  console.log(
    [
      "Seed concluida com sucesso.",
      `Usuarios: ${userRows.length}`,
      `Veiculos: ${resourceRows.length}`,
      `Reservas: ${reservationRows.length}`,
      `Historico: ${reservationHistoryRows.length}`,
    ].join("\n")
  );
}

run().catch((error) => {
  console.error("Falha ao executar a seed do Supabase.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
