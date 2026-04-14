import type {
  Reservation,
  ReservationChecklist,
  ReservationHistoryItem,
  ReservationInspection,
  Resource,
  User,
} from "@/types";
import type {
  ReservationHistoryInsert,
  ReservationHistoryRow,
  ReservationInsert,
  ReservationRow,
  ResourceInsert,
  ResourceRow,
  ResourceUnavailabilityRow,
  UserInsert,
  UserRow,
  Json,
} from "./database.types";
import { asStringArray } from "./utils";

const defaultChecklist: ReservationChecklist = {
  vehicleClean: false,
  tankFull: false,
  documentsPresent: false,
  spareTireOk: false,
  damageReported: false,
};

function parseChecklist(value: unknown): ReservationChecklist | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return {
    vehicleClean: Boolean((value as ReservationChecklist).vehicleClean),
    tankFull: Boolean((value as ReservationChecklist).tankFull),
    documentsPresent: Boolean((value as ReservationChecklist).documentsPresent),
    spareTireOk: Boolean((value as ReservationChecklist).spareTireOk),
    damageReported: Boolean((value as ReservationChecklist).damageReported),
  };
}

function parseInspection(value: unknown): ReservationInspection | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const inspection = value as ReservationInspection;

  return {
    ...inspection,
    checklist: parseChecklist(inspection.checklist) ?? defaultChecklist,
    requiredPhotos:
      inspection.requiredPhotos && typeof inspection.requiredPhotos === "object"
        ? inspection.requiredPhotos
        : {},
    additionalPhotos: Array.isArray(inspection.additionalPhotos) ? inspection.additionalPhotos : [],
    damagePhotos: Array.isArray(inspection.damagePhotos) ? inspection.damagePhotos : [],
  };
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    userId: row.user_id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.name,
    fullName: row.full_name,
    cpf: row.cpf,
    gestorVeiculo: row.gestor_veiculo,
    matricula: row.matricula,
    matriz: row.matriz,
    role: row.role as User["role"],
    area: row.area,
    areaDepartamento: row.area_departamento,
    centroCusto: row.centro_custo,
    email: row.email,
    emailCorporativo: row.email_corporativo,
    telefone: row.telefone,
    gestorId: row.gestor_id ?? undefined,
    cnhNumero: row.cnh_numero,
    cnhCategoria: row.cnh_categoria,
    cnhUfEmissao: row.cnh_uf_emissao,
    cnhStatus: row.cnh_status as User["cnhStatus"],
    cnhDataUltimaValidacao: row.cnh_data_ultima_validacao,
    cnhAnexo: row.cnh_anexo,
    termosPaytrack: row.termos_paytrack,
    observacao: row.observacao ?? undefined,
  };
}

export function mapResourceRow(
  row: ResourceRow,
  activeMaintenance?: ResourceUnavailabilityRow
): Resource {
  const baseStatus =
    activeMaintenance?.status === "active" ? "Manutencao" : (row.status as Resource["status"]);

  return {
    id: row.id,
    vehicleId: row.vehicle_id ?? undefined,
    name: row.name,
    code: row.code,
    category: row.category as Resource["category"],
    status: baseStatus,
    plate: row.plate ?? undefined,
    model: row.model ?? undefined,
    brand: row.brand ?? undefined,
    year: row.year ?? undefined,
    rentalCompany: row.rental_company ?? undefined,
    vehicleCategory: (row.vehicle_category ?? undefined) as Resource["vehicleCategory"] | undefined,
    currentMileage: row.current_mileage ?? undefined,
    lastInspectionDate: row.last_inspection_date ?? undefined,
    vehicleDocumentAttachment: row.vehicle_document_attachment ?? undefined,
    vehiclePhotoAttachments: asStringArray(row.vehicle_photo_attachments),
    lastMaintenanceDate: row.last_maintenance_date ?? undefined,
    nextMaintenanceDate: row.next_maintenance_date ?? undefined,
    lastMaintenanceMileage: row.last_maintenance_mileage ?? undefined,
    nextMaintenanceMileage: row.next_maintenance_mileage ?? undefined,
    observation: row.observation ?? undefined,
    capacity: row.capacity ?? undefined,
    description: row.description,
    imageHint: row.image_hint,
    nextAvailableAt:
      activeMaintenance?.expected_end_at ??
      activeMaintenance?.end_at ??
      row.next_available_at ??
      undefined,
    tags: asStringArray(row.tags),
  };
}

export function mapReservationRow(
  row: ReservationRow,
  historyRows: ReservationHistoryRow[]
): Reservation {
  return {
    id: row.id,
    code: row.code,
    resourceId: row.resource_id,
    userId: row.user_id,
    title: row.title,
    purpose: row.purpose,
    base: row.base,
    startDate: row.start_date,
    endDate: row.end_date,
    plannedDurationHours: row.planned_duration_hours ?? undefined,
    status: row.status as Reservation["status"],
    notes: row.notes ?? undefined,
    approver: row.approver ?? undefined,
    checkInAt: row.check_in_at ?? undefined,
    checkOutAt: row.check_out_at ?? undefined,
    checkInNotes: row.check_in_notes ?? undefined,
    checkOutNotes: row.check_out_notes ?? undefined,
    startMileage: row.start_mileage ?? undefined,
    endMileage: row.end_mileage ?? undefined,
    checkInChecklist: parseChecklist(row.check_in_checklist) ?? undefined,
    checkOutChecklist: parseChecklist(row.check_out_checklist) ?? undefined,
    checkInFuelLevel: (row.check_in_fuel_level ?? undefined) as Reservation["checkInFuelLevel"],
    checkOutFuelLevel: (row.check_out_fuel_level ?? undefined) as Reservation["checkOutFuelLevel"],
    checkInData: parseInspection(row.check_in_data),
    checkOutData: parseInspection(row.check_out_data),
    history: historyRows
      .map(mapReservationHistoryRow)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
  };
}

export function mapReservationHistoryRow(row: ReservationHistoryRow): ReservationHistoryItem {
  return {
    id: row.id,
    label: row.label,
    timestamp: row.timestamp,
    actor: row.actor,
    note: row.note ?? undefined,
  };
}

export function mapUserToInsert(user: User): UserInsert {
  return {
    id: user.id,
    user_id: user.userId,
    auth_user_id: user.authUserId ?? null,
    name: user.name,
    full_name: user.fullName,
    cpf: user.cpf,
    gestor_veiculo: user.gestorVeiculo,
    matricula: user.matricula,
    matriz: user.matriz,
    role: user.role,
    area: user.area,
    area_departamento: user.areaDepartamento,
    centro_custo: user.centroCusto,
    email: user.email,
    email_corporativo: user.emailCorporativo,
    telefone: user.telefone,
    gestor_id: user.gestorId ?? null,
    cnh_numero: user.cnhNumero,
    cnh_categoria: user.cnhCategoria,
    cnh_uf_emissao: user.cnhUfEmissao,
    cnh_status: user.cnhStatus,
    cnh_data_ultima_validacao: user.cnhDataUltimaValidacao,
    cnh_anexo: user.cnhAnexo,
    termos_paytrack: user.termosPaytrack,
    observacao: user.observacao ?? null,
  };
}

export function mapResourceToInsert(resource: Resource): ResourceInsert {
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

export function mapReservationToInsert(reservation: Reservation): ReservationInsert {
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
    check_in_checklist: (reservation.checkInChecklist ?? null) as Json,
    check_out_checklist: (reservation.checkOutChecklist ?? null) as Json,
    check_in_fuel_level: reservation.checkInFuelLevel ?? null,
    check_out_fuel_level: reservation.checkOutFuelLevel ?? null,
    check_in_data: (reservation.checkInData ?? null) as Json,
    check_out_data: (reservation.checkOutData ?? null) as Json,
  };
}

export function mapReservationHistoryToInsert(
  reservationId: string,
  historyItem: ReservationHistoryItem
): ReservationHistoryInsert {
  return {
    id: historyItem.id,
    reservation_id: reservationId,
    label: historyItem.label,
    timestamp: historyItem.timestamp,
    actor: historyItem.actor,
    note: historyItem.note ?? null,
  };
}
