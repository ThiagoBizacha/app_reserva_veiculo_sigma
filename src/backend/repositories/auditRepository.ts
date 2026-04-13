import { getSupabaseClient } from "../client";
import type { AuditLogInsert } from "../database.types";
import { getFriendlyRepositoryErrorMessage } from "../utils";

export async function appendAuditLog(entry: AuditLogInsert) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("audit_log").insert(entry);

  if (error) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel registrar a auditoria da operacao.")
    );
  }
}

