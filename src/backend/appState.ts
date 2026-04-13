import type { Reservation, Resource, User } from "@/types";
import { getSupabaseClient } from "./client";
import { listActiveMaintenanceRecords } from "./repositories/maintenanceRepository";
import { listReservations } from "./repositories/reservationsRepository";
import { listResources } from "./repositories/resourcesRepository";
import { listUsers } from "./repositories/usersRepository";

export interface RemoteAppState {
  reservations: Reservation[];
  resources: Resource[];
  syncedAt: string;
  users: User[];
}

export async function fetchRemoteAppState(): Promise<RemoteAppState> {
  const activeMaintenance = await listActiveMaintenanceRecords();
  const [users, resources, reservations] = await Promise.all([
    listUsers(),
    listResources(activeMaintenance),
    listReservations(),
  ]);

  return {
    users,
    resources,
    reservations,
    syncedAt: new Date().toISOString(),
  };
}

export function subscribeToRemoteAppState(onChange: () => void) {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel("reservation-app-state")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resources" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservation_history" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resource_unavailability" },
      onChange
    )
    .subscribe();

  return () => {
    void channel.unsubscribe();
  };
}

