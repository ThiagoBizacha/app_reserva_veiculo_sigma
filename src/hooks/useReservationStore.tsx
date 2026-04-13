import {
  type PropsWithChildren,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type {
  NewReservationPayload,
  NewUserPayload,
  NewVehiclePayload,
  Reservation,
  ReservationOperationPayload,
  Resource,
  ResourceStatus,
  User,
} from "@/types";
import {
  type CalendarDayState,
  getActionableReservationsForUser,
  getCurrentResourceStatus,
  getFleetSummary,
  getResourceAvailabilityForDate,
  getResourceReservations,
  getReservationsForResourceDay,
} from "@/utils/reservations";
import { colors, radius, spacing, typography } from "@/theme";
import { getBackendConfig } from "@/backend/config";
import { fetchRemoteAppState, subscribeToRemoteAppState } from "@/backend/appState";
import { readCachedAppState, writeCachedAppState } from "@/backend/cache";
import { linkUserToAuth } from "@/backend/repositories/usersRepository";
import {
  type ActionResult,
  cancelReservationUseCase,
  checkInReservationUseCase,
  checkOutReservationUseCase,
  createReservationUseCase,
  createUserUseCase,
  createVehicleUseCase,
  exportReservationsReportUseCase,
  toggleResourceMaintenanceUseCase,
  updateUserUseCase,
  updateVehicleUseCase,
} from "@/services/reservationService";
import { useAuthSession } from "./useAuthSession";

interface ReservationStoreValue {
  users: User[];
  resources: Resource[];
  reservations: Reservation[];
  currentUser: User;
  currentUserId: string;
  currentUserName: string;
  isBootstrapping: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  isBackendConfigured: boolean;
  isUsingCachedData: boolean;
  syncError: string | null;
  lastSyncedAt?: string;
  refreshRemoteState: () => Promise<void>;
  toggleResourceMaintenance: (resourceId: string) => Promise<ActionResult>;
  createVehicle: (payload: NewVehiclePayload) => Promise<ActionResult>;
  createUser: (payload: NewUserPayload) => Promise<ActionResult>;
  updateVehicle: (resourceId: string, payload: NewVehiclePayload) => Promise<ActionResult>;
  updateUser: (userId: string, payload: NewUserPayload) => Promise<ActionResult>;
  createReservation: (payload: NewReservationPayload) => Promise<ActionResult>;
  cancelReservation: (reservationId: string) => Promise<ActionResult>;
  checkInReservation: (
    reservationId: string,
    payload: ReservationOperationPayload
  ) => Promise<ActionResult>;
  checkOutReservation: (
    reservationId: string,
    payload: ReservationOperationPayload
  ) => Promise<ActionResult>;
  exportReservationsReport: () => Promise<ActionResult>;
  getResourceStatus: (resourceId: string, referenceDate?: Date) => ResourceStatus;
  getReservationsForResource: (resourceId: string) => Reservation[];
  getReservationsForDay: (resourceId: string, date: Date) => Reservation[];
  getAvailabilityForDate: (
    resourceId: string,
    date: Date
  ) => { state: CalendarDayState; reservations: Reservation[]; isAvailable: boolean };
  getActionableReservations: () => Reservation[];
  getSummary: (referenceDate?: Date) => {
    total: number;
    available: number;
    reserved: number;
    inUse: number;
    maintenance: number;
  };
}

const EMPTY_USER: User = {
  id: "unconfigured-user",
  userId: "unconfigured-user",
  name: "Usuario",
  fullName: "Usuario nao configurado",
  cpf: "",
  gestorVeiculo: false,
  matricula: "",
  matriz: "",
  role: "Solicitante",
  area: "",
  areaDepartamento: "",
  centroCusto: "",
  email: "",
  emailCorporativo: "",
  telefone: "",
  cnhNumero: "",
  cnhCategoria: "",
  cnhUfEmissao: "",
  cnhStatus: "Válida",
  cnhDataUltimaValidacao: new Date(0).toISOString(),
  cnhAnexo: "",
  termosPaytrack: false,
};

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function userMatchesAuthIdentity(user: User, authUserId?: string, authEmail?: string) {
  if (authUserId) {
    if (user.authUserId) {
      return user.authUserId === authUserId;
    }
  }

  if (!authEmail || user.authUserId) {
    return false;
  }

  return [user.email, user.emailCorporativo].some(
    (candidate) => normalizeEmail(candidate) === authEmail
  );
}

const ReservationStoreContext = createContext<ReservationStoreValue | null>(null);

export function ReservationStoreProvider({ children }: PropsWithChildren) {
  const backendConfig = getBackendConfig();
  const { authUser, isAuthenticated, isReady: isAuthReady, signOut } = useAuthSession();
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(undefined);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authLinkRef = useRef<string | null>(null);
  const authEmail = normalizeEmail(authUser?.email);
  const currentUser =
    users.find((user) => userMatchesAuthIdentity(user, authUser?.id, authEmail)) ?? EMPTY_USER;
  const currentUserId = currentUser.id;
  const currentUserName = currentUser.name || authUser?.email || "Usuario";
  const hasLinkedCurrentUser = currentUser.id !== EMPTY_USER.id;
  const hasMinimumData = users.length > 0;

  const applySnapshot = useCallback(
    async (
      snapshot: {
        users: User[];
        resources: Resource[];
        reservations: Reservation[];
        syncedAt?: string;
      },
      source: "cache" | "remote"
    ) => {
      startTransition(() => {
        setUsers(snapshot.users);
        setResources(snapshot.resources);
        setReservations(snapshot.reservations);
        setIsUsingCachedData(source === "cache");
        setLastSyncedAt(snapshot.syncedAt);
      });

      if (source === "remote") {
        await writeCachedAppState({
          cachedAt: snapshot.syncedAt ?? new Date().toISOString(),
          users: snapshot.users,
          resources: snapshot.resources,
          reservations: snapshot.reservations,
        });
      }
    },
    []
  );

  const mergeActionResultIntoState = useCallback(
    async (result: ActionResult) => {
      if (result.user) {
        const nextUsers = [
          result.user,
          ...users.filter((item) => item.id !== result.user?.id),
        ].sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));
        setUsers(nextUsers);
        await writeCachedAppState({
          cachedAt: new Date().toISOString(),
          users: nextUsers,
          resources,
          reservations,
        });
      }

      if (result.resource) {
        const nextResources = [
          result.resource,
          ...resources.filter((item) => item.id !== result.resource?.id),
        ].sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));
        setResources(nextResources);
        await writeCachedAppState({
          cachedAt: new Date().toISOString(),
          users,
          resources: nextResources,
          reservations,
        });
      }

      if (result.reservation) {
        const nextReservations = [
          result.reservation,
          ...reservations.filter((item) => item.id !== result.reservation?.id),
        ].sort(
          (left, right) =>
            new Date(right.startDate).getTime() - new Date(left.startDate).getTime()
        );
        setReservations(nextReservations);
        await writeCachedAppState({
          cachedAt: new Date().toISOString(),
          users,
          resources,
          reservations: nextReservations,
        });
      }
    },
    [reservations, resources, users]
  );

  const refreshRemoteState = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!backendConfig.isConfigured) {
        setSyncError(
          "Backend nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY."
        );
        setIsBootstrapping(false);
        return;
      }

      if (!authUser) {
        setSyncError(null);
        setIsRefreshing(false);
        setIsBootstrapping(false);
        return;
      }

      if (!options?.silent) {
        setIsRefreshing(true);
      }

      try {
        const snapshot = await fetchRemoteAppState();
        await applySnapshot(snapshot, "remote");
        setSyncError(null);
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : "Nao foi possivel sincronizar os dados com o backend.";
        setSyncError(nextMessage);
      } finally {
        setIsRefreshing(false);
        setIsBootstrapping(false);
      }
    },
    [applySnapshot, authUser, backendConfig.isConfigured]
  );

  useEffect(() => {
    let active = true;

    if (!isAuthReady) {
      return () => {
        active = false;
      };
    }

    if (!backendConfig.isConfigured) {
      setIsBootstrapping(false);
      return () => {
        active = false;
      };
    }

    if (!isAuthenticated || !authUser) {
      startTransition(() => {
        setUsers([]);
        setResources([]);
        setReservations([]);
        setIsUsingCachedData(false);
        setSyncError(null);
        setLastSyncedAt(undefined);
        setIsRefreshing(false);
        setIsMutating(false);
        setIsBootstrapping(false);
      });

      return () => {
        active = false;
      };
    }

    const bootstrap = async () => {
      const cachedState = await readCachedAppState();

      if (!active) {
        return;
      }

      if (cachedState) {
        await applySnapshot(
          {
            users: cachedState.users,
            resources: cachedState.resources,
            reservations: cachedState.reservations,
            syncedAt: cachedState.cachedAt,
          },
          "cache"
        );
      }

      await refreshRemoteState({ silent: !cachedState });

      if (active) {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [applySnapshot, authUser, backendConfig.isConfigured, isAuthReady, isAuthenticated, refreshRemoteState]);

  useEffect(() => {
    if (!backendConfig.isConfigured || !isAuthenticated || !authUser) {
      return;
    }

    const unsubscribe = subscribeToRemoteAppState(() => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = setTimeout(() => {
        void refreshRemoteState({ silent: true });
      }, 350);
    });

    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [authUser, backendConfig.isConfigured, isAuthenticated, refreshRemoteState]);

  useEffect(() => {
    if (!backendConfig.isConfigured || !isAuthenticated || !authUser) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshRemoteState({ silent: true });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authUser, backendConfig.isConfigured, isAuthenticated, refreshRemoteState]);

  useEffect(() => {
    authLinkRef.current = null;
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser || !hasLinkedCurrentUser || currentUser.authUserId === authUser.id) {
      return;
    }

    if (currentUser.authUserId && currentUser.authUserId !== authUser.id) {
      return;
    }

    const linkKey = `${currentUser.id}:${authUser.id}`;

    if (authLinkRef.current === linkKey) {
      return;
    }

    authLinkRef.current = linkKey;

    const syncAuthIdentity = async () => {
      try {
        const linkedUser = await linkUserToAuth(currentUser.id, authUser.id);
        const nextUsers = users
          .map((item) => (item.id === linkedUser.id ? linkedUser : item))
          .sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));

        setUsers(nextUsers);
        await writeCachedAppState({
          cachedAt: new Date().toISOString(),
          users: nextUsers,
          resources,
          reservations,
        });
        void refreshRemoteState({ silent: true });
      } catch (error) {
        authLinkRef.current = null;
        setSyncError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel vincular a sessao autenticada ao cadastro interno."
        );
      }
    };

    void syncAuthIdentity();
  }, [authUser, currentUser, hasLinkedCurrentUser, refreshRemoteState, reservations, resources, users]);

  const buildSnapshot = useCallback(
    () => ({
      users,
      resources,
      reservations,
      currentUser,
      currentUserId,
      currentUserName,
    }),
    [currentUser, currentUserId, currentUserName, reservations, resources, users]
  );

  const runMutation = useCallback(
    async (
      action: (
        snapshot: ReturnType<typeof buildSnapshot>
      ) => Promise<ActionResult>
    ): Promise<ActionResult> => {
      if (!isAuthenticated || !authUser || !hasLinkedCurrentUser) {
        return {
          success: false,
          message:
            "Sessao nao iniciada ou usuario autenticado ainda nao vinculado ao cadastro interno.",
        };
      }

      if (!backendConfig.isConfigured) {
        return {
          success: false,
          message:
            "Backend nao configurado. Preencha as variaveis de ambiente antes de executar operacoes.",
        };
      }

      setIsMutating(true);

      try {
        const result = await action(buildSnapshot());

        if (result.success) {
          await mergeActionResultIntoState(result);
          void refreshRemoteState({ silent: true });
        }

        return result;
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Nao foi possivel concluir a operacao no backend.",
        };
      } finally {
        setIsMutating(false);
      }
    },
    [
      authUser,
      backendConfig.isConfigured,
      buildSnapshot,
      hasLinkedCurrentUser,
      isAuthenticated,
      mergeActionResultIntoState,
      refreshRemoteState,
    ]
  );

  const getResourceStatus = useCallback(
    (resourceId: string, referenceDate = new Date()) => {
      const resource = resources.find((item) => item.id === resourceId);
      if (!resource) {
        return "Disponivel" as const;
      }

      return getCurrentResourceStatus(resource, reservations, referenceDate);
    },
    [reservations, resources]
  );

  const getReservationsForResource = useCallback(
    (resourceId: string) => getResourceReservations(reservations, resourceId),
    [reservations]
  );

  const getReservationsForDay = useCallback(
    (resourceId: string, date: Date) =>
      getReservationsForResourceDay(reservations, resourceId, date),
    [reservations]
  );

  const getAvailabilityForDate = useCallback(
    (resourceId: string, date: Date) => {
      const resource = resources.find((item) => item.id === resourceId);

      if (!resource) {
        return { state: "disponivel" as const, reservations: [], isAvailable: false };
      }

      return getResourceAvailabilityForDate(resource, reservations, date);
    },
    [reservations, resources]
  );

  const getActionableReservations = useCallback(
    () => getActionableReservationsForUser(reservations, currentUserId),
    [currentUserId, reservations]
  );

  const getSummary = useCallback(
    (referenceDate = new Date()) => getFleetSummary(resources, reservations, referenceDate),
    [reservations, resources]
  );

  const createVehicle = useCallback(
    (payload: NewVehiclePayload) => runMutation((snapshot) => createVehicleUseCase(payload, snapshot)),
    [runMutation]
  );

  const updateVehicle = useCallback(
    (resourceId: string, payload: NewVehiclePayload) =>
      runMutation((snapshot) => updateVehicleUseCase(resourceId, payload, snapshot)),
    [runMutation]
  );

  const createUser = useCallback(
    (payload: NewUserPayload) => runMutation((snapshot) => createUserUseCase(payload, snapshot)),
    [runMutation]
  );

  const updateUser = useCallback(
    (userId: string, payload: NewUserPayload) =>
      runMutation((snapshot) => updateUserUseCase(userId, payload, snapshot)),
    [runMutation]
  );

  const createReservation = useCallback(
    (payload: NewReservationPayload) =>
      runMutation((snapshot) => createReservationUseCase(payload, snapshot)),
    [runMutation]
  );

  const cancelReservation = useCallback(
    (reservationId: string) =>
      runMutation((snapshot) => cancelReservationUseCase(reservationId, snapshot)),
    [runMutation]
  );

  const checkInReservation = useCallback(
    (reservationId: string, payload: ReservationOperationPayload) =>
      runMutation((snapshot) => checkInReservationUseCase(reservationId, payload, snapshot)),
    [runMutation]
  );

  const checkOutReservation = useCallback(
    (reservationId: string, payload: ReservationOperationPayload) =>
      runMutation((snapshot) => checkOutReservationUseCase(reservationId, payload, snapshot)),
    [runMutation]
  );

  const toggleResourceMaintenance = useCallback(
    (resourceId: string) =>
      runMutation((snapshot) => toggleResourceMaintenanceUseCase(resourceId, snapshot)),
    [runMutation]
  );

  const exportReservationsReport = useCallback(
    () => exportReservationsReportUseCase(buildSnapshot()),
    [buildSnapshot]
  );

  const value = useMemo(
    () => ({
      users,
      resources,
      reservations,
      currentUser,
      currentUserId,
      currentUserName,
      isBootstrapping,
      isRefreshing,
      isMutating,
      isBackendConfigured: backendConfig.isConfigured,
      isUsingCachedData,
      syncError,
      lastSyncedAt,
      refreshRemoteState: () => refreshRemoteState(),
      toggleResourceMaintenance,
      createVehicle,
      createUser,
      updateVehicle,
      updateUser,
      createReservation,
      cancelReservation,
      checkInReservation,
      checkOutReservation,
      exportReservationsReport,
      getResourceStatus,
      getReservationsForResource,
      getReservationsForDay,
      getAvailabilityForDate,
      getActionableReservations,
      getSummary,
    }),
    [
      backendConfig.isConfigured,
      cancelReservation,
      checkInReservation,
      checkOutReservation,
      createReservation,
      createUser,
      createVehicle,
      currentUser,
      currentUserId,
      currentUserName,
      exportReservationsReport,
      getActionableReservations,
      getAvailabilityForDate,
      getReservationsForDay,
      getReservationsForResource,
      getResourceStatus,
      getSummary,
      isBootstrapping,
      isMutating,
      isRefreshing,
      isUsingCachedData,
      lastSyncedAt,
      refreshRemoteState,
      reservations,
      resources,
      syncError,
      toggleResourceMaintenance,
      updateUser,
      updateVehicle,
      users,
    ]
  );

  if (!isAuthenticated || !authUser) {
    return (
      <ReservationStoreContext.Provider value={value}>
        {children}
      </ReservationStoreContext.Provider>
    );
  }

  if (isBootstrapping && !hasMinimumData) {
    return (
      <BlockingStateScreen
        title="Sincronizando dados"
        description="Carregando usuarios, veiculos e reservas a partir do backend persistente."
      />
    );
  }

  if (!backendConfig.isConfigured && !hasMinimumData) {
    return (
      <BlockingStateScreen
        title="Backend nao configurado"
        description="Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY para usar o app com fonte unica de verdade remota."
      />
    );
  }

  if (syncError && !hasMinimumData) {
    return (
      <BlockingStateScreen
        title="Falha de sincronizacao"
        description={syncError}
        actionLabel="Tentar novamente"
        onPress={() => void refreshRemoteState()}
      />
    );
  }

  if (!isBootstrapping && users.length === 0) {
    return (
      <BlockingStateScreen
        title="Backend sem usuarios"
        description="O backend foi configurado, mas ainda nao existe nenhum usuario persistido. Execute a seed inicial antes de usar o app."
        actionLabel="Atualizar"
        onPress={() => void refreshRemoteState()}
      />
    );
  }

  if (!isBootstrapping && users.length > 0 && !hasLinkedCurrentUser) {
    return (
      <BlockingStateScreen
        title="Usuario autenticado sem vinculo interno"
        description="A sessao do Supabase foi iniciada, mas o email autenticado nao corresponde a nenhum colaborador persistido no cadastro interno."
        actionLabel="Encerrar sessao"
        onPress={() => {
          void signOut();
        }}
      />
    );
  }

  return (
    <ReservationStoreContext.Provider value={value}>
      {children}
    </ReservationStoreContext.Provider>
  );
}

function BlockingStateScreen({
  title,
  description,
  actionLabel,
  onPress,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.stateShell}>
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateDescription}>{description}</Text>

          {actionLabel && onPress ? (
            <Pressable onPress={onPress} style={styles.stateButton}>
              <Text style={styles.stateButtonLabel}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateShell: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  stateCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stateTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  stateDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  stateButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  stateButtonLabel: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
});

export function useReservationStore() {
  const context = useContext(ReservationStoreContext);

  if (!context) {
    throw new Error("useReservationStore must be used inside ReservationStoreProvider");
  }

  return context;
}
