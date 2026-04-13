const DEFAULT_USER_ID = "usr-01";

export interface BackendConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  defaultUserId: string;
  isConfigured: boolean;
}

export function getBackendConfig(): BackendConfig {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const defaultUserId = process.env.EXPO_PUBLIC_DEFAULT_USER_ID?.trim() || DEFAULT_USER_ID;

  return {
    supabaseUrl,
    supabaseAnonKey,
    defaultUserId,
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}

