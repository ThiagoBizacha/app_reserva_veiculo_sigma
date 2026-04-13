import type { Resource } from "@/types";
import { getSupabaseClient } from "../client";
import { mapResourceRow, mapResourceToInsert } from "../mappers";
import type { ResourceUnavailabilityRow } from "../database.types";
import { getFriendlyRepositoryErrorMessage } from "../utils";

export async function listResources(activeMaintenance: ResourceUnavailabilityRow[] = []) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("resources").select("*").order("code");

  if (error) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel carregar os veiculos do backend.")
    );
  }

  const maintenanceByResourceId = new Map(activeMaintenance.map((item) => [item.resource_id, item]));

  return (data ?? []).map((row) => mapResourceRow(row, maintenanceByResourceId.get(row.id)));
}

export async function upsertResource(resource: Resource) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .upsert(mapResourceToInsert(resource))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel persistir o veiculo no backend.")
    );
  }

  return mapResourceRow(data);
}

