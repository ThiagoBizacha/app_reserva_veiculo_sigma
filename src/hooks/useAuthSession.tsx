import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getSupabaseClient, hasBackendConfig } from "@/backend/client";

interface AuthCommandResult {
  success: boolean;
  message?: string;
}

interface AuthSessionValue {
  session: Session | null;
  authUser: SupabaseAuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  authError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<AuthCommandResult>;
  signOut: () => Promise<AuthCommandResult>;
  clearAuthError: () => void;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasBackendConfig()) {
      setSession(null);
      setIsReady(true);
      return;
    }

    const supabase = getSupabaseClient();
    let active = true;

    const bootstrap = async () => {
      const {
        data: { session: nextSession },
        error,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      } else {
        setSession(nextSession);
      }

      setIsReady(true);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);
      setIsReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthCommandResult> => {
      if (!hasBackendConfig()) {
        const message =
          "Backend nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY antes de autenticar.";
        setAuthError(message);
        return { success: false, message };
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password.trim()) {
        const message = "Informe email corporativo e senha para entrar.";
        setAuthError(message);
        return { success: false, message };
      }

      setIsSubmitting(true);
      setAuthError(null);

      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setAuthError(error.message);
          return { success: false, message: error.message };
        }

        return { success: true };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthCommandResult> => {
    if (!hasBackendConfig()) {
      setSession(null);
      setAuthError(null);
      return { success: true };
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthError(error.message);
        return { success: false, message: error.message };
      }

      setSession(null);
      setAuthError(null);
      return { success: true };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const value = useMemo<AuthSessionValue>(
    () => ({
      session,
      authUser: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      isReady,
      isSubmitting,
      authError,
      signInWithPassword,
      signOut,
      clearAuthError: () => setAuthError(null),
    }),
    [authError, isReady, isSubmitting, session, signInWithPassword, signOut]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
}
