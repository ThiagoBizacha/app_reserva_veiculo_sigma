export interface BackendConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isConfigured: boolean;
}

export function getBackendConfig(): BackendConfig {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
