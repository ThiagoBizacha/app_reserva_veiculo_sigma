import { buildReservationsCsv, downloadCsvForExcel } from "@/utils/export";
import {
  hasSignature,
  parseMileageValue,
} from "@/utils/operation";
import {
  getNextReservationCode,
} from "@/utils/reservationCode";
import {
  isScheduledReservationActive,
} from "@/utils/reservations";
import {
  getDurationHours,
} from "@/utils/date";
import {
  getCheckInRuleViolation,
  getCheckOutRuleViolation,
  getReservationCreationRuleViolation,
} from "@/utils/operationalRules";
import {
  canCancelReservation,
  canExecuteReservationOperation,
  getUserPermissions,
} from "@/utils/authorization";
import {
  buildUniqueUsername,
  normalizeUsernameInput,
} from "@/utils/authIdentity";
import type {
  NewReservationPayload,
  NewUserPayload,
  NewVehiclePayload,
  Reservation,
  ReservationInspection,
  ReservationOperationPayload,
  Resource,
  User,
} from "@/types";
import { appendAuditLog } from "@/backend/repositories/auditRepository";
import type { Json } from "@/backend/database.types";
import { clearMaintenance, activateMaintenance } from "@/backend/repositories/maintenanceRepository";
import {
  appendReservationHistory,
  cancelOwnReservation,
  upsertReservation,
} from "@/backend/repositories/reservationsRepository";
import { upsertResource } from "@/backend/repositories/resourcesRepository";
import { upsertUser } from "@/backend/repositories/usersRepository";
import { generateEntityId } from "@/backend/utils";

export interface ActionResult {
  success: boolean;
  message: string;
  reservation?: Reservation;
  resource?: Resource;
  user?: User;
  fileUri?: string;
}

interface ActorContext {
  currentUser: User;
  currentUserId: string;
  currentUserName: string;
}

interface ServiceSnapshot extends ActorContext {
  reservations: Reservation[];
  resources: Resource[];
  users: User[];
}

function buildAuditEntry(
  entityType: string,
  entityId: string,
  action: string,
  actor: ActorContext,
  details: Record<string, unknown>
) {
  return {
    id: generateEntityId("aud"),
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_user_id: actor.currentUserId,
    actor_name: actor.currentUserName,
    origin: "mobile-app",
    occurred_at: new Date().toISOString(),
    details: details as Json,
  };
}

function buildHistoryItem(label: string, actorName: string, note?: string) {
  return {
    id: generateEntityId("hist"),
    label,
    timestamp: new Date().toISOString(),
    actor: actorName,
    note,
  };
}

function validateVehiclePayload(
  payload: NewVehiclePayload,
  resources: Resource[],
  resourceId?: string
) {
  const requiredFields = [
    payload.name,
    payload.code,
    payload.plate,
    payload.brand,
    payload.model,
    payload.year,
    payload.currentMileage,
    payload.description,
  ];

  if (requiredFields.some((field) => !field.trim())) {
    return "Preencha todos os campos obrigatorios do veiculo.";
  }

  if (
    resources.some(
      (item) =>
        item.id !== resourceId && item.code.toLowerCase() === payload.code.trim().toLowerCase()
    )
  ) {
    return "Ja existe um veiculo com esse codigo.";
  }

  if (
    resources.some(
      (item) =>
        item.id !== resourceId &&
        item.plate?.toLowerCase() === payload.plate.trim().toLowerCase()
    )
  ) {
    return "Ja existe um veiculo com essa placa.";
  }

  return null;
}

function buildVehicleRecord(
  payload: NewVehiclePayload,
  resources: Resource[],
  existingResource?: Resource
): Resource {
  const vehicleCount = resources.filter((item) => item.category === "Veiculo").length + 1;
  const normalizedName = payload.name.trim();
  const normalizedCode = payload.code.trim().toUpperCase();
  const normalizedPlate = payload.plate.trim().toUpperCase();
  const normalizedBrand = payload.brand.trim();
  const normalizedModel = payload.model.trim();
  const normalizedMileage = payload.currentMileage.trim();

  return {
    id: existingResource?.id ?? generateEntityId("res"),
    vehicleId: existingResource?.vehicleId ?? `VEH-${String(vehicleCount).padStart(3, "0")}`,
    name: normalizedName,
    code: normalizedCode,
    category: existingResource?.category ?? "Veiculo",
    status: existingResource?.status ?? "Disponivel",
    plate: normalizedPlate,
    model: normalizedModel,
    brand: normalizedBrand,
    year: payload.year.trim(),
    rentalCompany: payload.rentalCompany?.trim() || "Cadastro interno",
    vehicleCategory: payload.vehicleCategory,
    currentMileage: normalizedMileage,
    lastInspectionDate: existingResource?.lastInspectionDate ?? new Date().toISOString(),
    vehicleDocumentAttachment: payload.vehicleDocumentAttachment?.trim() || "",
    vehiclePhotoAttachments: existingResource?.vehiclePhotoAttachments ?? [],
    lastMaintenanceDate: existingResource?.lastMaintenanceDate ?? new Date().toISOString(),
    nextMaintenanceDate: payload.nextMaintenanceDate?.trim() || undefined,
    lastMaintenanceMileage: existingResource?.lastMaintenanceMileage ?? normalizedMileage,
    nextMaintenanceMileage: payload.nextMaintenanceMileage?.trim() || undefined,
    observation: payload.observation?.trim() || undefined,
    capacity: existingResource?.capacity ?? "5 lugares",
    description: payload.description.trim(),
    imageHint: payload.vehicleCategory.toLowerCase(),
    nextAvailableAt: existingResource?.nextAvailableAt,
    tags: [payload.vehicleCategory, normalizedBrand, normalizedModel].filter(Boolean),
  };
}

function validateUserPayload(payload: NewUserPayload, users: User[], userId?: string) {
  const requiredFields = [
    payload.fullName,
    payload.matricula,
    payload.areaDepartamento,
    payload.centroCusto,
    payload.telefone,
    payload.cnhCategoria,
  ];

  if (requiredFields.some((field) => !field.trim())) {
    return "Preencha todos os campos obrigatorios do usuario.";
  }

  if (
    users.some(
      (item) =>
        item.id !== userId &&
        item.matricula.toLowerCase() === payload.matricula.trim().toLowerCase()
    )
  ) {
    return "Ja existe um usuario com essa matricula.";
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedUsername = normalizeUsernameInput(payload.username);

  if (
    normalizedEmail &&
    users.some(
      (item) =>
        item.id !== userId && item.email.toLowerCase() === normalizedEmail
    )
  ) {
    return "Ja existe um usuario com esse e-mail.";
  }

  if (
    normalizedUsername &&
    users.some(
      (item) =>
        item.id !== userId && normalizeUsernameInput(item.username) === normalizedUsername
    )
  ) {
    return "Ja existe um usuario com esse nome de usuario.";
  }

  if (
    payload.cpf.trim() &&
    users.some((item) => item.id !== userId && item.cpf === payload.cpf.trim())
  ) {
    return "Ja existe um usuario com esse CPF.";
  }

  return null;
}

function buildUserRecord(
  payload: NewUserPayload,
  snapshot: ServiceSnapshot,
  existingUser?: User
): User {
  const resolvedId = existingUser?.id ?? generateEntityId("usr");
  const normalizedEmail = payload.email.trim().toLowerCase();
  const takenUsernames = snapshot.users
    .filter((item) => item.id !== existingUser?.id)
    .map((item) => item.username);
  const resolvedUsername = buildUniqueUsername(
    payload.fullName.trim(),
    takenUsernames,
    payload.username || existingUser?.username
  );
  const trimmedManagerName = payload.gestorNome?.trim();

  return {
    id: resolvedId,
    userId: existingUser?.userId ?? resolvedId,
    fullName: payload.fullName.trim(),
    username: resolvedUsername,
    cpf: payload.cpf.trim(),
    gestorVeiculo: payload.role !== "Solicitante",
    matricula: payload.matricula.trim().toUpperCase(),
    matriz:
      payload.matriz?.trim() || existingUser?.matriz || snapshot.currentUser.matriz || "Belo Horizonte",
    role: payload.role,
    areaDepartamento: payload.areaDepartamento.trim(),
    centroCusto: payload.centroCusto.trim().toUpperCase(),
    email: normalizedEmail,
    telefone: payload.telefone.trim(),
    gestorNome: trimmedManagerName || existingUser?.gestorNome || snapshot.currentUser.fullName,
    cnhNumero: payload.cnhNumero.trim().toUpperCase(),
    cnhCategoria: payload.cnhCategoria.trim().toUpperCase(),
    cnhStatus: payload.cnhStatus,
    cnhDataUltimaValidacao: existingUser?.cnhDataUltimaValidacao ?? new Date().toISOString(),
    cnhAnexo: payload.cnhAnexo?.trim() || "",
    termosPaytrack: existingUser?.termosPaytrack ?? true,
    observacao: payload.observacao?.trim() || undefined,
  };
}

function validateReservationPayload(
  payload: NewReservationPayload,
  requester: User,
  resources: Resource[],
  reservations: Reservation[]
) {
  if (
    !payload.resourceId ||
    !payload.startDate ||
    !payload.endDate ||
    !payload.purpose ||
    !payload.base
  ) {
    return "Preencha todos os campos obrigatorios.";
  }

  const resource = resources.find((item) => item.id === payload.resourceId);
  if (!resource) {
    return "Recurso nao encontrado.";
  }

  return getReservationCreationRuleViolation({
    requester,
    resource,
    reservations,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
}

function validateOperationPayload(
  mode: "checkin" | "checkout",
  reservation: Reservation,
  payload: ReservationOperationPayload
) {
  if (!payload.mileage.trim()) {
    return mode === "checkin"
      ? "Informe a quilometragem de saida."
      : "Informe a quilometragem de retorno.";
  }

  if (!payload.fuelLevel) {
    return "Informe o nivel de combustivel.";
  }

  if (!payload.counterpartyName.trim()) {
    return mode === "checkin"
      ? "Informe quem entregou o veiculo."
      : "Informe quem recebeu o veiculo.";
  }

  if (!payload.confirmationChecked) {
    return "Confirme a vistoria para continuar.";
  }

  if (!hasSignature(payload.signature)) {
    return "A assinatura digital e obrigatoria.";
  }

  if (payload.damageIdentified) {
    if (!payload.damageDescription?.trim()) {
      return "Descreva a avaria ou ocorrencia identificada.";
    }

    if (payload.damagePhotos.length === 0) {
      return "Adicione ao menos uma foto da avaria.";
    }
  }

  if (mode === "checkout") {
    const startMileage = parseMileageValue(reservation.startMileage);
    const endMileage = parseMileageValue(payload.mileage);

    if (startMileage !== null && endMileage !== null && endMileage < startMileage) {
      return "A quilometragem final nao pode ser menor que a quilometragem de saida.";
    }
  }

  return null;
}

function buildInspection(
  mode: "checkin" | "checkout",
  payload: ReservationOperationPayload,
  actorName: string
): ReservationInspection {
  return {
    mode,
    inspectedAt: new Date().toISOString(),
    inspectedBy: actorName,
    counterpartyName: payload.counterpartyName,
    mileage: payload.mileage,
    fuelLevel: payload.fuelLevel,
    checklist: { ...payload.checklist, damageReported: payload.damageIdentified },
    notes: payload.notes,
    requiredPhotos: payload.requiredPhotos,
    additionalPhotos: payload.additionalPhotos,
    damagePhotos: payload.damagePhotos,
    damageIdentified: payload.damageIdentified,
    damageDescription: payload.damageDescription,
    confirmationChecked: payload.confirmationChecked,
    signature: payload.signature,
  };
}

export async function createVehicleUseCase(
  payload: NewVehiclePayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canManageFleet) {
    return {
      success: false,
      message: "Apenas Administrador pode cadastrar veiculos.",
    };
  }

  const validationError = validateVehiclePayload(payload, snapshot.resources);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const resource = buildVehicleRecord(payload, snapshot.resources);
  await upsertResource(resource);
  await appendAuditLog(
    buildAuditEntry("resource", resource.id, "resource.created", snapshot, {
      code: resource.code,
      plate: resource.plate,
    })
  );

  return {
    success: true,
    message: `Veiculo ${resource.code} cadastrado com sucesso.`,
    resource,
  };
}

export async function updateVehicleUseCase(
  resourceId: string,
  payload: NewVehiclePayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canManageFleet) {
    return {
      success: false,
      message: "Apenas Administrador pode atualizar veiculos.",
    };
  }

  const existingResource = snapshot.resources.find((item) => item.id === resourceId);

  if (!existingResource) {
    return { success: false, message: "Veiculo nao encontrado." };
  }

  const validationError = validateVehiclePayload(payload, snapshot.resources, resourceId);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const resource = buildVehicleRecord(payload, snapshot.resources, existingResource);
  await upsertResource(resource);
  await appendAuditLog(
    buildAuditEntry("resource", resource.id, "resource.updated", snapshot, {
      code: resource.code,
      plate: resource.plate,
    })
  );

  return {
    success: true,
    message: `Veiculo ${resource.code} atualizado com sucesso.`,
    resource,
  };
}

export async function createUserUseCase(
  payload: NewUserPayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canManageUsers) {
    return {
      success: false,
      message: "Apenas Administrador pode cadastrar usuarios.",
    };
  }

  const validationError = validateUserPayload(payload, snapshot.users);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const user = buildUserRecord(payload, snapshot);
  await upsertUser(user);
  await appendAuditLog(
    buildAuditEntry("user", user.id, "user.created", snapshot, {
      role: user.role,
      matricula: user.matricula,
    })
  );

  return {
    success: true,
    message: `Usuario ${user.fullName} cadastrado com sucesso. Login: ${user.username}.`,
    user,
  };
}

export async function updateUserUseCase(
  userId: string,
  payload: NewUserPayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canManageUsers) {
    return {
      success: false,
      message: "Apenas Administrador pode atualizar usuarios.",
    };
  }

  const existingUser = snapshot.users.find((item) => item.id === userId);

  if (!existingUser) {
    return { success: false, message: "Usuario nao encontrado." };
  }

  const validationError = validateUserPayload(payload, snapshot.users, userId);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const user = buildUserRecord(payload, snapshot, existingUser);
  await upsertUser(user);
  await appendAuditLog(
    buildAuditEntry("user", user.id, "user.updated", snapshot, {
      role: user.role,
      matricula: user.matricula,
    })
  );

  return {
    success: true,
    message: `Usuario ${user.fullName} atualizado com sucesso. Login: ${user.username}.`,
    user,
  };
}

export async function createReservationUseCase(
  payload: NewReservationPayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  const validationError = validateReservationPayload(
    payload,
    snapshot.currentUser,
    snapshot.resources,
    snapshot.reservations
  );
  if (validationError) {
    return { success: false, message: validationError };
  }

  const resource = snapshot.resources.find((item) => item.id === payload.resourceId);
  if (!resource) {
    return { success: false, message: "Recurso nao encontrado." };
  }

  const durationHours = getDurationHours(payload.startDate, payload.endDate);

  const historyItem = buildHistoryItem(
    "Reserva reservada",
    snapshot.currentUserName,
    payload.notes
  );

  const reservation: Reservation = {
    id: generateEntityId("rsv"),
    code: getNextReservationCode(snapshot.reservations, payload.startDate),
    resourceId: payload.resourceId,
    userId: snapshot.currentUserId,
    title: `Reserva ${resource.name}`,
    purpose: payload.purpose,
    base: payload.base,
    startDate: payload.startDate,
    endDate: payload.endDate,
    plannedDurationHours: durationHours,
    status: "Reservado",
    notes: payload.notes,
    history: [historyItem],
  };

  await upsertReservation(reservation, historyItem);
  await appendAuditLog(
    buildAuditEntry("reservation", reservation.id, "reservation.created", snapshot, {
      code: reservation.code,
      resourceId: reservation.resourceId,
      userId: reservation.userId,
      status: reservation.status,
    })
  );

  return {
    success: true,
    message: `Reserva criada para ${durationHours}h com status Reservado.`,
    reservation,
  };
}

export async function cancelReservationUseCase(
  reservationId: string,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  const reservation = snapshot.reservations.find((item) => item.id === reservationId);
  const requester = reservation
    ? snapshot.users.find((item) => item.id === reservation.userId)
    : undefined;
  const resource = reservation
    ? snapshot.resources.find((item) => item.id === reservation.resourceId)
    : undefined;

  if (!reservation) {
    return { success: false, message: "Reserva nao encontrada." };
  }

  if (!canCancelReservation(snapshot.currentUser, reservation)) {
    return {
      success: false,
      message: "Seu perfil nao pode cancelar esta reserva.",
    };
  }

  if (reservation.status !== "Reservado") {
    return {
      success: false,
      message: "So e possivel cancelar reservas ainda nao utilizadas.",
    };
  }

  if (!isScheduledReservationActive(reservation)) {
    return {
      success: false,
      message: "A janela da reserva ja foi encerrada e nao permite cancelamento.",
    };
  }

  const historyItem = buildHistoryItem("Reserva cancelada", snapshot.currentUserName);
  const updatedReservation: Reservation = {
    ...reservation,
    status: "Cancelada",
    history: [historyItem, ...reservation.history],
  };

  if (getUserPermissions(snapshot.currentUser).canManageFleet) {
    await upsertReservation(updatedReservation, historyItem);
  } else {
    await cancelOwnReservation(updatedReservation.id);
    await appendReservationHistory(updatedReservation.id, historyItem);
  }

  await appendAuditLog(
    buildAuditEntry("reservation", updatedReservation.id, "reservation.cancelled", snapshot, {
      code: updatedReservation.code,
      status: updatedReservation.status,
    })
  );

  return {
    success: true,
    message: "Reserva cancelada com sucesso.",
    reservation: updatedReservation,
  };
}

export async function checkInReservationUseCase(
  reservationId: string,
  payload: ReservationOperationPayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  const reservation = snapshot.reservations.find((item) => item.id === reservationId);
  const requester = reservation
    ? snapshot.users.find((item) => item.id === reservation.userId)
    : undefined;
  const resource = reservation
    ? snapshot.resources.find((item) => item.id === reservation.resourceId)
    : undefined;

  if (!reservation) {
    return { success: false, message: "Reserva nao encontrada." };
  }

  if (!canExecuteReservationOperation(snapshot.currentUser, reservation)) {
    return {
      success: false,
      message: "Check-in disponivel apenas para Operacao e Administrador.",
    };
  }

  const operationalViolation = getCheckInRuleViolation({
    reservation,
    resource,
    requester,
  });
  if (operationalViolation) {
    return {
      success: false,
      message: operationalViolation,
    };
  }

  const validationError = validateOperationPayload("checkin", reservation, payload);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const inspection = buildInspection("checkin", payload, snapshot.currentUserName);
  const historyItem = buildHistoryItem(
    "Vistoria de saida concluida",
    snapshot.currentUserName,
    payload.notes || `Km ${payload.mileage} | Combustivel ${payload.fuelLevel}`
  );

  const updatedReservation: Reservation = {
    ...reservation,
    status: "Em uso",
    checkInAt: inspection.inspectedAt,
    checkInNotes: payload.notes,
    startMileage: payload.mileage,
    checkInChecklist: inspection.checklist,
    checkInFuelLevel: payload.fuelLevel,
    checkInData: inspection,
    history: [historyItem, ...reservation.history],
  };

  await upsertReservation(updatedReservation, historyItem);
  await appendAuditLog(
    buildAuditEntry("reservation", updatedReservation.id, "reservation.checkin", snapshot, {
      code: updatedReservation.code,
      status: updatedReservation.status,
      mileage: payload.mileage,
    })
  );

  return {
    success: true,
    message: "Check-in realizado. A reserva agora esta em uso.",
    reservation: updatedReservation,
  };
}

export async function checkOutReservationUseCase(
  reservationId: string,
  payload: ReservationOperationPayload,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  const reservation = snapshot.reservations.find((item) => item.id === reservationId);

  if (!reservation) {
    return { success: false, message: "Reserva nao encontrada." };
  }

  if (!canExecuteReservationOperation(snapshot.currentUser, reservation)) {
    return {
      success: false,
      message: "Check-out disponivel apenas para Operacao e Administrador.",
    };
  }

  const operationalViolation = getCheckOutRuleViolation({ reservation });
  if (operationalViolation) {
    return {
      success: false,
      message: operationalViolation,
    };
  }

  const validationError = validateOperationPayload("checkout", reservation, payload);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const inspection = buildInspection("checkout", payload, snapshot.currentUserName);
  const historyItem = buildHistoryItem(
    "Check-in de devolucao concluido",
    snapshot.currentUserName,
    payload.notes || `Km ${payload.mileage} | Combustivel ${payload.fuelLevel}`
  );

  const updatedReservation: Reservation = {
    ...reservation,
    status: "Concluida",
    checkOutAt: inspection.inspectedAt,
    checkOutNotes: payload.notes,
    endMileage: payload.mileage,
    checkOutChecklist: inspection.checklist,
    checkOutFuelLevel: payload.fuelLevel,
    checkOutData: inspection,
    history: [historyItem, ...reservation.history],
  };

  await upsertReservation(updatedReservation, historyItem);
  await appendAuditLog(
    buildAuditEntry("reservation", updatedReservation.id, "reservation.checkout", snapshot, {
      code: updatedReservation.code,
      status: updatedReservation.status,
      mileage: payload.mileage,
    })
  );

  return {
    success: true,
    message: "Check-out realizado. Reserva concluida e veiculo disponivel.",
    reservation: updatedReservation,
  };
}

export async function toggleResourceMaintenanceUseCase(
  resourceId: string,
  snapshot: ServiceSnapshot
): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canManageMaintenance) {
    return {
      success: false,
      message: "Apenas Operacao e Administrador podem alterar manutencao da frota.",
    };
  }

  const existingResource = snapshot.resources.find((item) => item.id === resourceId);

  if (!existingResource) {
    return { success: false, message: "Veiculo nao encontrado." };
  }

  const nextStatus = existingResource.status === "Manutencao" ? "Disponivel" : "Manutencao";
  const updatedResource: Resource = {
    ...existingResource,
    status: nextStatus,
    nextAvailableAt:
      nextStatus === "Manutencao" ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() : undefined,
  };

  if (nextStatus === "Manutencao") {
    await activateMaintenance(resourceId, snapshot.currentUserId, "Bloqueio operacional manual");
  } else {
    await clearMaintenance(resourceId, snapshot.currentUserId);
  }

  await appendAuditLog(
    buildAuditEntry(
      "resource",
      updatedResource.id,
      nextStatus === "Manutencao" ? "resource.maintenance.started" : "resource.maintenance.cleared",
      snapshot,
      {
        code: updatedResource.code,
        status: updatedResource.status,
      }
    )
  );

  return {
    success: true,
    message:
      nextStatus === "Manutencao"
        ? "Veiculo marcado em manutencao."
        : "Veiculo liberado da manutencao.",
    resource: updatedResource,
  };
}

export async function exportReservationsReportUseCase(snapshot: ServiceSnapshot): Promise<ActionResult> {
  if (!getUserPermissions(snapshot.currentUser).canExportReservations) {
    return {
      success: false,
      message: "A exportacao da base CSV fica disponivel apenas para Administrador.",
    };
  }

  try {
    const filename = `reservas-sigma-${new Date().toISOString().slice(0, 10)}.csv`;
    const csv = buildReservationsCsv(snapshot.reservations, snapshot.resources, snapshot.users);
    const result = await downloadCsvForExcel(filename, csv);

    return {
      success: true,
      message: result.message,
      fileUri: result.fileUri,
    };
  } catch {
    return {
      success: false,
      message: "Nao foi possivel gerar o arquivo de reservas.",
    };
  }
}
