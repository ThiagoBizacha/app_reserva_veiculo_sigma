import { addHours } from "@/utils/date";
import { getSupabaseClient } from "../client";
import type { ResourceUnavailabilityInsert } from "../database.types";
import { generateEntityId, getFriendlyRepositoryErrorMessage } from "../utils";

export async function listActiveMaintenanceRecords() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("resource_unavailability")
    .select("*")
    .eq("status", "active")
    .order("start_at", { ascending: false });

  if (error) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        error,
        "Nao foi possivel carregar indisponibilidades ativas do backend."
      )
    );
  }

  return data ?? [];
}

export async function activateMaintenance(
  resourceId: string,
  actorUserId: string,
  note?: string
) {
  const supabase = getSupabaseClient();
  const payload: ResourceUnavailabilityInsert = {
    id: generateEntityId("mnt"),
    resource_id: resourceId,
    type: "maintenance",
    status: "active",
    reason: "Manutencao operacional",
    note: note ?? null,
    created_by_user_id: actorUserId,
    start_at: new Date().toISOString(),
    expected_end_at: addHours(new Date(), 72).toISOString(),
  };

  const { data, error } = await supabase
    .from("resource_unavailability")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        error,
        "Nao foi possivel registrar a manutencao no backend."
      )
    );
  }

  return data;
}

export async function clearMaintenance(resourceId: string, actorUserId: string) {
  const supabase = getSupabaseClient();
  const { data: activeRecord, error: readError } = await supabase
    .from("resource_unavailability")
    .select("*")
    .eq("resource_id", resourceId)
    .eq("status", "active")
    .maybeSingle();

  if (readError) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        readError,
        "Nao foi possivel localizar a manutencao ativa do veiculo."
      )
    );
  }

  if (!activeRecord) {
    return null;
  }

  const { data, error } = await supabase
    .from("resource_unavailability")
    .update({
      status: "ended",
      end_at: new Date().toISOString(),
      ended_by_user_id: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activeRecord.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel encerrar a manutencao do veiculo.")
    );
  }

  return data;
}

