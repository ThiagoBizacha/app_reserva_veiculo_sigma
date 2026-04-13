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

export async function linkUserToAuth(userId: string, authUserId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update({ auth_user_id: authUserId })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      getFriendlyRepositoryErrorMessage(
        error,
        "Nao foi possivel vincular o usuario autenticado ao cadastro interno."
      )
    );
  }

  return mapUserRow(data);
}
