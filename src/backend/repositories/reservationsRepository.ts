import type { Reservation, ReservationHistoryItem } from "@/types";
import { getSupabaseClient } from "../client";
import {
  mapReservationHistoryToInsert,
  mapReservationRow,
  mapReservationToInsert,
} from "../mappers";
import { getFriendlyRepositoryErrorMessage } from "../utils";

export async function listReservations() {
  const supabase = getSupabaseClient();
  const [{ data: reservationRows, error: reservationsError }, { data: historyRows, error: historyError }] =
    await Promise.all([
      supabase.from("reservations").select("*").order("start_date", { ascending: false }),
      supabase.from("reservation_history").select("*").order("timestamp", { ascending: false }),
    ]);

  if (reservationsError) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        reservationsError,
        "Nao foi possivel carregar as reservas do backend."
      )
    );
  }

  if (historyError) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        historyError,
        "Nao foi possivel carregar o historico persistido das reservas."
      )
    );
  }

  const historyByReservationId = new Map<string, typeof historyRows>();
  (historyRows ?? []).forEach((row) => {
    const currentItems = historyByReservationId.get(row.reservation_id) ?? [];
    currentItems.push(row);
    historyByReservationId.set(row.reservation_id, currentItems);
  });

  return (reservationRows ?? []).map((row) =>
    mapReservationRow(row, historyByReservationId.get(row.id) ?? [])
  );
}

export async function upsertReservation(
  reservation: Reservation,
  historyItem?: ReservationHistoryItem
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .upsert(mapReservationToInsert(reservation))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel persistir a reserva no backend.")
    );
  }

  if (historyItem) {
    await appendReservationHistory(reservation.id, historyItem);
  }

  return data;
}

export async function appendReservationHistory(
  reservationId: string,
  historyItem: ReservationHistoryItem
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("reservation_history")
    .insert(mapReservationHistoryToInsert(reservationId, historyItem));

  if (error) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        error,
        "Nao foi possivel persistir o historico da reserva no backend."
      )
    );
  }
}

