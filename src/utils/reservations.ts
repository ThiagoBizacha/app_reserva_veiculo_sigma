import { reservationStatusLabel, resourceStatusLabel } from "@/constants/status";
import type { Reservation, ReservationStatus, Resource, ResourceStatus } from "@/types";
import { isWithinRange, toDate } from "./date";

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

export const getCalendarDayState = (
  day: Date,
  resources: Resource[],
  reservations: Reservation[]
): CalendarDayState => {
  const hasMaintenance = resources.some((resource) => resource.status === "Manutencao");

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

export const getSummaryCounts = (resources: Resource[], reservations: Reservation[]) => ({
  availableResources: resources.filter((item) => item.status === "Disponivel").length,
  activeReservations: reservations.filter((item) =>
    ["Pendente", "Aprovada", "Em uso"].includes(item.status)
  ).length,
  maintenanceResources: resources.filter((item) => item.status === "Manutencao").length,
});
