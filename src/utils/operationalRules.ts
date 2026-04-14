import type { Reservation, Resource, User } from "@/types";
import {
  createDateInAppTimeZone,
  getAppDateParts,
  getAppDateTimeParts,
  getDurationHours,
  getNextWholeHour,
  isPastDateTime,
  isSameCalendarDay,
  startOfDay,
  toDate,
} from "@/utils/date";
import {
  getResourceConflicts,
  isReservationInCurrentWindow,
  isResourceInMaintenanceOnDate,
} from "@/utils/reservations";

export const RESERVATION_MIN_DURATION_HOURS = 1;
export const RESERVATION_MAX_DURATION_HOURS = 4;
export const RESERVATION_PICKUP_START_HOUR = 8;
export const RESERVATION_PICKUP_END_HOUR = 18;
export const RESERVATION_RETURN_END_HOUR = 19;

function normalizeCnhStatus(status?: string | null) {
  return status
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildDateAtHour(day: string | Date, hour: number) {
  const parts = getAppDateParts(day);

  return createDateInAppTimeZone({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
  });
}

function isWithinPickupWindow(startDate: string | Date) {
  const { hour } = getAppDateTimeParts(startDate);
  return hour >= RESERVATION_PICKUP_START_HOUR && hour <= RESERVATION_PICKUP_END_HOUR;
}

function isWithinReturnWindow(endDate: string | Date) {
  const { hour, minute, second } = getAppDateTimeParts(endDate);

  if (hour > RESERVATION_RETURN_END_HOUR) {
    return false;
  }

  if (hour === RESERVATION_RETURN_END_HOUR && (minute > 0 || second > 0)) {
    return false;
  }

  return true;
}

export function hasValidDriverLicense(user?: Pick<User, "cnhStatus"> | null) {
  return normalizeCnhStatus(user?.cnhStatus) === "valida";
}

export function getRequesterReservationEligibilityViolation(
  requester?: Pick<User, "cnhStatus"> | null
) {
  if (!requester) {
    return "Solicitante nao encontrado para criar a reserva.";
  }

  if (!hasValidDriverLicense(requester)) {
    return "Sua CNH esta vencida. Regularize o cadastro antes de reservar um veiculo.";
  }

  return null;
}

export function getAvailablePickupHours(day: string | Date, referenceDate = new Date()) {
  const operationalHours = Array.from(
    { length: RESERVATION_PICKUP_END_HOUR - RESERVATION_PICKUP_START_HOUR + 1 },
    (_, index) => RESERVATION_PICKUP_START_HOUR + index
  );

  if (!isSameCalendarDay(day, referenceDate)) {
    return operationalHours;
  }

  const nextWholeHour = getNextWholeHour(referenceDate);
  const { hour } = getAppDateTimeParts(nextWholeHour);

  return operationalHours.filter((candidateHour) => candidateHour >= hour);
}

export function getNextOperationalReservationStart(
  requestedDate?: string | Date,
  referenceDate = new Date()
) {
  const requested = requestedDate ? toDate(requestedDate) : referenceDate;
  const resolvedRequestedDate = isPastDateTime(requested, referenceDate) ? referenceDate : requested;
  const resolvedDay = startOfDay(resolvedRequestedDate);
  const availableHours = getAvailablePickupHours(resolvedDay, referenceDate);

  if (availableHours.length > 0) {
    return buildDateAtHour(resolvedDay, availableHours[0]);
  }

  const dayParts = getAppDateParts(resolvedDay);

  return createDateInAppTimeZone({
    year: dayParts.year,
    month: dayParts.month,
    day: dayParts.day + 1,
    hour: RESERVATION_PICKUP_START_HOUR,
  });
}

export function getReservationScheduleRuleViolation(
  startDate: string,
  endDate: string,
  referenceDate = new Date()
) {
  if (toDate(endDate) < toDate(startDate)) {
    return "A data final nao pode ser menor que a data inicial.";
  }

  if (isPastDateTime(startDate, referenceDate)) {
    return "Nao e possivel criar reservas com data ou horario no passado.";
  }

  if (!isSameCalendarDay(startDate, endDate)) {
    return "A reserva deve comecar e terminar no mesmo dia.";
  }

  const durationHours = getDurationHours(startDate, endDate);
  if (
    durationHours < RESERVATION_MIN_DURATION_HOURS ||
    durationHours > RESERVATION_MAX_DURATION_HOURS
  ) {
    return "A reserva deve ter duracao minima de 1 hora e maxima de 4 horas.";
  }

  if (!isWithinPickupWindow(startDate)) {
    return "A retirada deve iniciar entre 08h e 18h.";
  }

  if (!isWithinReturnWindow(endDate)) {
    return "A devolucao precisa acontecer ate 19h no mesmo dia.";
  }

  return null;
}

export function getReservationCreationRuleViolation({
  requester,
  resource,
  reservations,
  startDate,
  endDate,
  referenceDate = new Date(),
}: {
  requester?: Pick<User, "cnhStatus"> | null;
  resource?: Resource;
  reservations: Reservation[];
  startDate: string;
  endDate: string;
  referenceDate?: Date;
}) {
  const requesterViolation = getRequesterReservationEligibilityViolation(requester);
  if (requesterViolation) {
    return requesterViolation;
  }

  if (!resource) {
    return "Selecione um veiculo para continuar.";
  }

  if (resource.category !== "Veiculo") {
    return "Apenas veiculos podem ser reservados neste fluxo.";
  }

  const scheduleViolation = getReservationScheduleRuleViolation(startDate, endDate, referenceDate);
  if (scheduleViolation) {
    return scheduleViolation;
  }

  if (isResourceInMaintenanceOnDate(resource, new Date(startDate), referenceDate)) {
    return "O veiculo esta indisponivel por manutencao ou bloqueio operacional neste periodo.";
  }

  const conflicts = getResourceConflicts(
    reservations,
    resource.id,
    startDate,
    endDate
  );

  if (conflicts.length > 0) {
    return "Ja existe uma reserva para o veiculo no horario informado.";
  }

  return null;
}

export function getCheckInRuleViolation({
  reservation,
  resource,
  requester,
  referenceDate = new Date(),
}: {
  reservation: Pick<Reservation, "status" | "startDate" | "endDate">;
  resource?: Resource;
  requester?: Pick<User, "cnhStatus"> | null;
  referenceDate?: Date;
}) {
  if (reservation.status !== "Reservado") {
    return "Apenas reservas reservadas podem iniciar check-in.";
  }

  if (toDate(referenceDate).getTime() < toDate(reservation.startDate).getTime()) {
    return "O check-in so pode iniciar a partir do horario de retirada da reserva.";
  }

  if (!isReservationInCurrentWindow(reservation, referenceDate)) {
    return "A janela da reserva ja foi encerrada e nao permite check-in.";
  }

  if (!requester) {
    return "Solicitante da reserva nao encontrado.";
  }

  if (!hasValidDriverLicense(requester)) {
    return "O solicitante desta reserva esta com a CNH vencida e nao pode retirar o veiculo.";
  }

  if (!resource) {
    return "Veiculo da reserva nao encontrado.";
  }

  if (isResourceInMaintenanceOnDate(resource, toDate(referenceDate), referenceDate)) {
    return "O veiculo esta indisponivel por manutencao ou bloqueio operacional.";
  }

  return null;
}

export function getCheckOutRuleViolation({
  reservation,
}: {
  reservation: Pick<Reservation, "status" | "checkInAt">;
}) {
  if (reservation.status !== "Em uso" && reservation.status !== "Em atraso") {
    return "Apenas reservas em uso podem finalizar check-out.";
  }

  if (!reservation.checkInAt) {
    return "Nao e possivel registrar devolucao sem um check-in valido.";
  }

  return null;
}
