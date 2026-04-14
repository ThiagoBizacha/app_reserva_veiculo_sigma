import { getReservationOverview, isScheduledReservationActive } from "@/utils/reservations";
import type { Reservation, User, UserRole } from "@/types";

export interface UserPermissions {
  role: UserRole;
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canManageFleet: boolean;
  canOperateReservations: boolean;
  canManageMaintenance: boolean;
  canViewAllReservations: boolean;
  canExportReservations: boolean;
}

const DEFAULT_ROLE: UserRole = "Solicitante";

export function getRolePermissions(role: UserRole = DEFAULT_ROLE): UserPermissions {
  const isAdministrator = role === "Administrador";
  const isOperations = role === "Operação";

  return {
    role,
    canAccessAdminPanel: isOperations || isAdministrator,
    canManageUsers: isAdministrator,
    canManageFleet: isAdministrator,
    canOperateReservations: isOperations || isAdministrator,
    canManageMaintenance: isOperations || isAdministrator,
    canViewAllReservations: isOperations || isAdministrator,
    canExportReservations: isAdministrator,
  };
}

export function getUserPermissions(user?: Pick<User, "role"> | null) {
  return getRolePermissions(user?.role ?? DEFAULT_ROLE);
}

export function canViewReservation(user: Pick<User, "id" | "role">, reservation: Pick<Reservation, "userId">) {
  const permissions = getUserPermissions(user);
  return permissions.canViewAllReservations || reservation.userId === user.id;
}

export function canCancelReservation(user: Pick<User, "id" | "role">, reservation: Reservation) {
  if (reservation.status !== "Reservado" || !isScheduledReservationActive(reservation)) {
    return false;
  }

  const permissions = getUserPermissions(user);
  return permissions.canManageFleet || reservation.userId === user.id;
}

export function canExecuteReservationOperation(
  user: Pick<User, "role">,
  reservation: Pick<Reservation, "status">
) {
  const permissions = getUserPermissions(user);

  if (!permissions.canOperateReservations) {
    return false;
  }

  return reservation.status === "Reservado" || reservation.status === "Em uso";
}

export function getVisibleActionableReservations(
  user: Pick<User, "id" | "role">,
  reservations: Reservation[],
  referenceDate = new Date()
) {
  const permissions = getUserPermissions(user);
  const actionable = getReservationOverview(reservations, referenceDate).actionable;

  if (permissions.canViewAllReservations) {
    return actionable;
  }

  return actionable.filter((reservation) => reservation.userId === user.id);
}
