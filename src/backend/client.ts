import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { getBackendConfig } from "./config";
import type { Database } from "./database.types";

let supabaseClient: SupabaseClient<Database> | null = null;
let hasRegisteredAuthAppStateListener = false;

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
        ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    if (Platform.OS !== "web" && !hasRegisteredAuthAppStateListener) {
      hasRegisteredAuthAppStateListener = true;
      void supabaseClient.auth.startAutoRefresh();

      AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") {
          void supabaseClient?.auth.startAutoRefresh();
          return;
        }

        void supabaseClient?.auth.stopAutoRefresh();
      });
    }
  }

  return supabaseClient;
}
