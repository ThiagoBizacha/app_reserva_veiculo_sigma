import type { User } from "@/types";
import { getSupabaseClient } from "../client";
import { mapUserRow, mapUserToInsert } from "../mappers";
import { getFriendlyRepositoryErrorMessage } from "../utils";

export async function listUsers() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("users").select("*").order("full_name");

  if (error) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel carregar os usuarios do backend.")
    );
  }

  return (data ?? []).map(mapUserRow);
}

export async function upsertUser(user: User) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(mapUserToInsert(user))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(error, "Nao foi possivel persistir o usuario no backend.")
    );
  }

  return mapUserRow(data);
}

export async function resolveAuthLoginIdentifier(identifier: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("resolve_auth_login_identifier", {
    p_identifier: identifier,
  });

  const resolvedRow = Array.isArray(data) ? data[0] : null;

  if (error || !resolvedRow?.auth_login_email) {
    throw new Error("Nao foi possivel localizar um usuario com o identificador informado.");
  }

  return {
    authLoginEmail: resolvedRow.auth_login_email,
    matchedUserId: resolvedRow.matched_user_id,
    username: resolvedRow.username,
  };
}

export async function linkUserToAuth(userId: string, _authUserId?: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("link_current_user_auth", {
    p_user_id: userId,
  });

  const resolvedRow = Array.isArray(data) ? data[0] : data;

  if (error || !resolvedRow) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        error,
        "Nao foi possivel vincular o usuario autenticado ao cadastro interno."
      )
    );
  }

  return mapUserRow(resolvedRow);
}
