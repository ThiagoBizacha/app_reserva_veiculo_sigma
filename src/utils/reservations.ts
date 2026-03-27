import { reservationStatusLabel, resourceStatusLabel } from "@/constants/status";
import type { Reservation, ReservationStatus, Resource, ResourceStatus } from "@/types";
import { isWithinRange, toDate } from "./date";

export const RESERVATION_BLOCKING_STATUSES: ReservationStatus[] = ["Pendente", "Aprovada", "Em uso"];
export const RESERVATION_ACTIVE_STATUSES: ReservationStatus[] = ["Aprovada", "Em uso"];

export const reservationChecklistLabels = {
  vehicleClean: "Veículo limpo",
  tankFull: "Tanque cheio",
  documentsPresent: "Documentos presentes",
  spareTireOk: "Estepe em boas condições",
  damageReported: "Avarias registradas",
};

export const getResourceById = (resources: Resource[], resourceId?: string) =>
  resources.find((resource) => resource.id === resourceId);

export const getReservationStatusLabel = (status: ReservationStatus) => reservationStatusLabel[status];

export const getResourceStatusLabel = (status: ResourceStatus) => resourceStatusLabel[status];

export const overlapsReservation = (
  candidateStart: string,
  candidateEnd: string,
  reservation: Reservation,
  ignoreReservationId?: string
) => {
  if (ignoreReservationId && reservation.id === ignoreReservationId) {
    return false;
  }

  if (reservation.status === "Cancelada" || reservation.status === "Concluida") {
    return false;
  }

  const start = toDate(candidateStart).getTime();
  const end = toDate(candidateEnd).getTime();
  const existingStart = toDate(reservation.startDate).getTime();
  const existingEnd = toDate(reservation.endDate).getTime();

  return start <= existingEnd && end >= existingStart;
};

export const getResourceConflicts = (
  reservations: Reservation[],
  resourceId: string,
  startDate: string,
  endDate: string
) =>
  reservations.filter(
    (reservation) =>
      reservation.resourceId === resourceId &&
      overlapsReservation(startDate, endDate, reservation)
  );

export type CalendarDayState = "manutencao" | "emUso" | "reservado" | "disponivel";

export const getResourceReservations = (reservations: Reservation[], resourceId: string) =>
  reservations
    .filter((reservation) => reservation.resourceId === resourceId)
    .sort((left, right) => toDate(left.startDate).getTime() - toDate(right.startDate).getTime());

export const getReservationsForResourceDay = (
  reservations: Reservation[],
  resourceId: string,
  day: Date
) =>
  getResourceReservations(reservations, resourceId).filter((reservation) =>
    isWithinRange(day, reservation.startDate, reservation.endDate)
  );

export const isResourceInMaintenanceOnDate = (
  resource: Resource,
  day: Date,
  referenceDate = new Date()
) => {
  if (resource.status !== "Manutencao") {
    return false;
  }

  if (!resource.nextAvailableAt) {
    return true;
  }

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);
  const nextAvailable = toDate(resource.nextAvailableAt);
  nextAvailable.setHours(0, 0, 0, 0);

  return dayStart >= todayStart && dayStart <= nextAvailable;
};

export const getCalendarDayStateForResource = (
  day: Date,
  resource: Resource,
  reservations: Reservation[]
): CalendarDayState => {
  if (isResourceInMaintenanceOnDate(resource, day)) {
    return "manutencao";
  }

  const dayReservations = getReservationsForResourceDay(reservations, resource.id, day).filter(
    (reservation) => reservation.status !== "Cancelada"
  );

  if (dayReservations.some((reservation) => reservation.status === "Em uso")) {
    return "emUso";
  }

  if (
    dayReservations.some((reservation) =>
      ["Pendente", "Aprovada", "Concluida"].includes(reservation.status)
    )
  ) {
    return "reservado";
  }

  return "disponivel";
};

export const getCalendarDayState = (
  day: Date,
  resources: Resource[],
  reservations: Reservation[]
): CalendarDayState => {
  const hasMaintenance = resources.some((resource) => isResourceInMaintenanceOnDate(resource, day));

  if (hasMaintenance) {
    return "manutencao";
  }

  const dayReservations = reservations.filter((reservation) =>
    isWithinRange(day, reservation.startDate, reservation.endDate)
  );

  if (dayReservations.some((reservation) => reservation.status === "Em uso")) {
    return "emUso";
  }

  if (dayReservations.length > 0) {
    return "reservado";
  }

  return "disponivel";
};

export const getMonthlyReservations = (reservations: Reservation[], month: Date) =>
  reservations.filter((reservation) => {
    const start = toDate(reservation.startDate);
    const end = toDate(reservation.endDate);
    return (
      start.getFullYear() === month.getFullYear() ||
      end.getFullYear() === month.getFullYear()
    ) && (start.getMonth() === month.getMonth() || end.getMonth() === month.getMonth());
  });

export const getCurrentResourceStatus = (
  resource: Resource,
  reservations: Reservation[],
  referenceDate = new Date()
): ResourceStatus => {
  if (isResourceInMaintenanceOnDate(resource, referenceDate, referenceDate)) {
    return "Manutencao";
  }

  const currentReservations = getResourceReservations(reservations, resource.id).filter(
    (reservation) => reservation.status !== "Cancelada"
  );

  if (
    currentReservations.some(
      (reservation) =>
        (reservation.status === "Em uso" || reservation.status === "Em atraso") &&
        isWithinRange(referenceDate, reservation.startDate, reservation.endDate)
    )
  ) {
    return "Em uso";
  }

   if (
    currentReservations.some(
      (reservation) =>
        (reservation.status === "Pendente" || reservation.status === "Aprovada") &&
        isWithinRange(referenceDate, reservation.startDate, reservation.endDate)
    )
  ) {
    return "Reservado";
  }

  return "Disponivel";
};

export const getNextReservation = (
  resource: Resource,
  reservations: Reservation[],
  referenceDate = new Date()
) =>
  getResourceReservations(reservations, resource.id).find(
    (reservation) =>
      reservation.status !== "Cancelada" &&
      reservation.status !== "Concluida" &&
      toDate(reservation.startDate).getTime() >= referenceDate.getTime()
  );

export const getResourceAvailabilityForDate = (
  resource: Resource,
  reservations: Reservation[],
  day: Date
) => {
  const state = getCalendarDayStateForResource(day, resource, reservations);
  const dayReservations = getReservationsForResourceDay(reservations, resource.id, day).filter(
    (reservation) => reservation.status !== "Cancelada"
  );

  return {
    state,
    reservations: dayReservations,
    isAvailable: state === "disponivel",
  };
};

export const getFleetSummary = (
  resources: Resource[],
  reservations: Reservation[],
  referenceDate = new Date()
) => {
  const vehicles = resources.filter((resource) => resource.category === "Veiculo");
  const statuses = vehicles.map((resource) => getCurrentResourceStatus(resource, reservations, referenceDate));

  return {
    total: vehicles.length,
    available: statuses.filter((status) => status === "Disponivel").length,
    reserved: statuses.filter((status) => status === "Reservado").length,
    inUse: statuses.filter((status) => status === "Em uso").length,
    maintenance: statuses.filter((status) => status === "Manutencao").length,
  };
};

export const getSummaryCounts = (resources: Resource[], reservations: Reservation[]) => ({
  availableResources: getFleetSummary(resources, reservations).available,
  activeReservations: reservations.filter((item) =>
    ["Pendente", "Aprovada", "Em uso"].includes(item.status)
  ).length,
  maintenanceResources: getFleetSummary(resources, reservations).maintenance,
});
