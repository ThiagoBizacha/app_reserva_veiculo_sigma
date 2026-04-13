import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getBackendConfig } from "./config";
import type { Database } from "./database.types";

let supabaseClient: SupabaseClient<Database> | null = null;

export function hasBackendConfig() {
  return getBackendConfig().isConfigured;
}

export function getSupabaseClient() {
  const config = getBackendConfig();

  if (!config.isConfigured || !config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Supabase nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}

