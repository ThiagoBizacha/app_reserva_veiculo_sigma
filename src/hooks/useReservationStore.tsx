import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  currentUserId,
  reservations as initialReservations,
  resources as initialResources,
  users,
} from "@/data";
import type {
  NewReservationPayload,
  Reservation,
  ReservationInspection,
  ReservationOperationPayload,
  Resource,
  ResourceStatus,
  User,
} from "@/types";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type CalendarDayState,
  getCurrentResourceStatus,
  getFleetSummary,
  getResourceAvailabilityForDate,
  getResourceConflicts,
  getResourceReservations,
  getReservationsForResourceDay,
  isResourceInMaintenanceOnDate,
} from "@/utils/reservations";
import { getDurationHours, isSameCalendarDay } from "@/utils/date";
import {
  hasAllRequiredPhotos,
  hasSignature,
  parseMileageValue,
} from "@/utils/operation";

interface ActionResult {
  success: boolean;
  message: string;
  reservation?: Reservation;
}

interface ReservationStoreValue {
  users: User[];
  resources: Resource[];
  reservations: Reservation[];
  currentUser: User;
  currentUserId: string;
  currentUserName: string;
  toggleResourceMaintenance: (resourceId: string) => void;
  createReservation: (payload: NewReservationPayload) => ActionResult;
  cancelReservation: (reservationId: string) => ActionResult;
  checkInReservation: (reservationId: string, payload: ReservationOperationPayload) => ActionResult;
  checkOutReservation: (reservationId: string, payload: ReservationOperationPayload) => ActionResult;
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

const STORAGE_KEYS = {
  mockVersion: "@sigma-reserva/mock-version",
  reservations: "@sigma-reserva/reservations",
  resources: "@sigma-reserva/resources",
};

const MOCK_DATA_VERSION = "2026-03-27-reservation-policy-v2";

const ReservationStoreContext = createContext<ReservationStoreValue | null>(null);

export function ReservationStoreProvider({ children }: PropsWithChildren) {
  const [resources, setResources] = useState(initialResources);
  const [reservations, setReservations] = useState(initialReservations);
  const [isHydrated, setIsHydrated] = useState(false);

  const currentUser =
    users.find((user) => user.id === currentUserId) ?? users[0];
  const currentUserName = currentUser?.name ?? "Usuario";

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const [storedVersion, storedReservations, storedResources] = await AsyncStorage.multiGet([
          STORAGE_KEYS.mockVersion,
          STORAGE_KEYS.reservations,
          STORAGE_KEYS.resources,
        ]);

        if (!active) {
          return;
        }

        const versionValue = storedVersion[1];
        const reservationsValue = storedReservations[1];
        const resourcesValue = storedResources[1];
        const shouldResetToLatestMocks = versionValue !== MOCK_DATA_VERSION;

        if (shouldResetToLatestMocks) {
          setReservations(initialReservations);
          setResources(initialResources);
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.mockVersion, MOCK_DATA_VERSION],
            [STORAGE_KEYS.reservations, JSON.stringify(initialReservations)],
            [STORAGE_KEYS.resources, JSON.stringify(initialResources)],
          ]);
          return;
        }

        if (reservationsValue) {
          setReservations(JSON.parse(reservationsValue));
        }

        if (resourcesValue) {
          setResources(JSON.parse(resourcesValue));
        }
      } catch {
        // Keep bundled mocks when local storage is unavailable.
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void AsyncStorage.multiSet([
      [STORAGE_KEYS.mockVersion, MOCK_DATA_VERSION],
      [STORAGE_KEYS.reservations, JSON.stringify(reservations)],
      [STORAGE_KEYS.resources, JSON.stringify(resources)],
    ]);
  }, [isHydrated, reservations, resources]);

  const appendHistoryItem = (
    reservation: Reservation,
    label: string,
    note?: string
  ): Reservation["history"] => [
    {
      id: `hist-${Date.now()}`,
      label,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      note,
    },
    ...reservation.history,
  ];

  const getResourceStatus = (resourceId: string, referenceDate = new Date()) => {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource) {
      return "Disponivel" as const;
    }

    return getCurrentResourceStatus(resource, reservations, referenceDate);
  };

  const getReservationsForResource = (resourceId: string) =>
    getResourceReservations(reservations, resourceId);

  const getReservationsForDay = (resourceId: string, date: Date) =>
    getReservationsForResourceDay(reservations, resourceId, date);

  const getAvailabilityForDate = (resourceId: string, date: Date) => {
    const resource = resources.find((item) => item.id === resourceId);

    if (!resource) {
      return { state: "disponivel" as const, reservations: [], isAvailable: false };
    }

    return getResourceAvailabilityForDate(resource, reservations, date);
  };

  const getActionableReservations = () =>
    reservations
      .filter(
        (reservation) =>
          reservation.userId === currentUserId &&
          (reservation.status === "Aprovada" || reservation.status === "Em uso")
      )
      .sort(
        (left, right) =>
          new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
      );

  const getSummary = (referenceDate = new Date()) =>
    getFleetSummary(resources, reservations, referenceDate);

  const toggleResourceMaintenance = (resourceId: string) => {
    setResources((current) =>
      current.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              status: resource.status === "Manutencao" ? "Disponivel" : "Manutencao",
              nextAvailableAt:
                resource.status === "Manutencao"
                  ? undefined
                  : new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      new Date().getDate() + 3,
                      18,
                      0,
                      0
                    ).toISOString(),
            }
          : resource
      )
    );
  };

  const createReservation = (payload: NewReservationPayload): ActionResult => {
    if (
      !payload.resourceId ||
      !payload.startDate ||
      !payload.endDate ||
      !payload.purpose ||
      !payload.base
    ) {
      return { success: false, message: "Preencha todos os campos obrigatórios." };
    }

    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      return { success: false, message: "A data final não pode ser menor que a data inicial." };
    }

    if (!isSameCalendarDay(payload.startDate, payload.endDate)) {
      return {
        success: false,
        message: "A reserva deve começar e terminar no mesmo dia.",
      };
    }

    const durationHours =
      payload.durationHours ?? getDurationHours(payload.startDate, payload.endDate);

    if (durationHours < 1 || durationHours > 4) {
      return {
        success: false,
        message: "A reserva deve ter duração mínima de 1 hora e máxima de 4 horas.",
      };
    }

    const resource = resources.find((item) => item.id === payload.resourceId);
    if (!resource) {
      return { success: false, message: "Recurso não encontrado." };
    }

    if (
      resource.status === "Manutencao" &&
      isResourceInMaintenanceOnDate(resource, new Date(payload.startDate))
    ) {
      return {
        success: false,
        message: "O veículo está em manutenção e não pode ser reservado neste período.",
      };
    }

    const conflicts = getResourceConflicts(
      reservations,
      payload.resourceId,
      payload.startDate,
      payload.endDate
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: "Já existe uma reserva para o recurso no horário informado.",
      };
    }

    const sequence = reservations.length + 35;
    const reservation: Reservation = {
      id: `rsv-${Date.now()}`,
      code: `RSV-${new Date().getFullYear()}-${String(sequence).padStart(3, "0")}`,
      resourceId: payload.resourceId,
      userId: currentUserId,
      title: `Reserva ${resource.name}`,
      purpose: payload.purpose,
      base: payload.base,
      startDate: payload.startDate,
      endDate: payload.endDate,
      plannedDurationHours: durationHours,
      status: "Aprovada",
      notes: payload.notes,
      approver: currentUserName,
      history: [
        {
          id: `hist-${Date.now()}`,
          label: "Reserva criada",
          timestamp: new Date().toISOString(),
          actor: currentUserName,
          note: payload.notes,
        },
      ],
    };

    setReservations((current) => [reservation, ...current]);

    return {
      success: true,
      message: `Reserva criada para ${durationHours}h e liberada para operação.`,
      reservation,
    };
  };

  const cancelReservation = (reservationId: string): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Aprovada" && reservation.status !== "Pendente") {
      return {
        success: false,
        message: "Só é possível cancelar reservas ainda não utilizadas.",
      };
    }

    const updatedReservation: Reservation = {
      ...reservation,
      status: "Cancelada",
      history: appendHistoryItem(reservation, "Reserva cancelada"),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Reserva cancelada com sucesso.",
      reservation: updatedReservation,
    };
  };

  const validateOperationPayload = (
    mode: "checkin" | "checkout",
    reservation: Reservation,
    payload: ReservationOperationPayload
  ) => {
    if (!payload.mileage.trim()) {
      return mode === "checkin"
        ? "Informe a quilometragem de saída."
        : "Informe a quilometragem de retorno.";
    }

    if (!payload.fuelLevel) {
      return "Informe o nível de combustível.";
    }

    if (!payload.counterpartyName.trim()) {
      return mode === "checkin"
        ? "Informe quem entregou o veículo."
        : "Informe quem recebeu o veículo.";
    }

    if (!hasAllRequiredPhotos(payload.requiredPhotos)) {
      return "Complete as 4 fotos obrigatórias da vistoria.";
    }

    if (!payload.confirmationChecked) {
      return "Confirme a vistoria para continuar.";
    }

    if (!hasSignature(payload.signature)) {
      return "A assinatura digital é obrigatória.";
    }

    if (payload.damageIdentified) {
      if (!payload.damageDescription?.trim()) {
        return "Descreva a avaria ou ocorrência identificada.";
      }

      if (payload.damagePhotos.length === 0) {
        return "Adicione ao menos uma foto da avaria.";
      }
    }

    if (mode === "checkout") {
      const startMileage = parseMileageValue(reservation.startMileage);
      const endMileage = parseMileageValue(payload.mileage);

      if (startMileage !== null && endMileage !== null && endMileage < startMileage) {
        return "A quilometragem final não pode ser menor que a quilometragem de saída.";
      }
    }

    return null;
  };

  const buildInspection = (
    mode: "checkin" | "checkout",
    payload: ReservationOperationPayload
  ): ReservationInspection => ({
    mode,
    inspectedAt: new Date().toISOString(),
    inspectedBy: currentUserName,
    counterpartyName: payload.counterpartyName,
    mileage: payload.mileage,
    fuelLevel: payload.fuelLevel,
    checklist: { ...payload.checklist, damageReported: payload.damageIdentified },
    notes: payload.notes,
    requiredPhotos: payload.requiredPhotos,
    additionalPhotos: payload.additionalPhotos,
    damagePhotos: payload.damagePhotos,
    damageIdentified: payload.damageIdentified,
    damageDescription: payload.damageDescription,
    confirmationChecked: payload.confirmationChecked,
    signature: payload.signature,
  });

  const checkInReservation = (
    reservationId: string,
    payload: ReservationOperationPayload
  ): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Aprovada") {
      return {
        success: false,
        message: "Apenas reservas aprovadas podem iniciar check-in.",
      };
    }

    const validationError = validateOperationPayload("checkin", reservation, payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const inspection = buildInspection("checkin", payload);
    const updatedReservation: Reservation = {
      ...reservation,
      status: "Em uso",
      checkInAt: inspection.inspectedAt,
      checkInNotes: payload.notes,
      startMileage: payload.mileage,
      checkInChecklist: inspection.checklist,
      checkInFuelLevel: payload.fuelLevel,
      checkInData: inspection,
      history: appendHistoryItem(
        reservation,
        "Vistoria de saída concluída",
        payload.notes || `Km ${payload.mileage} | Combustível ${payload.fuelLevel}`
      ),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Check-in realizado. O veículo está em uso.",
      reservation: updatedReservation,
    };
  };

  const checkOutReservation = (
    reservationId: string,
    payload: ReservationOperationPayload
  ): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Em uso") {
      return {
        success: false,
        message: "Apenas reservas em uso podem finalizar check-out.",
      };
    }

    const validationError = validateOperationPayload("checkout", reservation, payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const inspection = buildInspection("checkout", payload);
    const updatedReservation: Reservation = {
      ...reservation,
      status: "Concluida",
      checkOutAt: inspection.inspectedAt,
      checkOutNotes: payload.notes,
      endMileage: payload.mileage,
      checkOutChecklist: inspection.checklist,
      checkOutFuelLevel: payload.fuelLevel,
      checkOutData: inspection,
      history: appendHistoryItem(
        reservation,
        "Check-in de devolução concluído",
        payload.notes || `Km ${payload.mileage} | Combustível ${payload.fuelLevel}`
      ),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Check-out realizado. Reserva concluída.",
      reservation: updatedReservation,
    };
  };

  const value = useMemo(
    () => ({
      resources,
      reservations,
      users,
      currentUser,
      currentUserId,
      currentUserName,
      toggleResourceMaintenance,
      createReservation,
      cancelReservation,
      checkInReservation,
      checkOutReservation,
      getResourceStatus,
      getReservationsForResource,
      getReservationsForDay,
      getAvailabilityForDate,
      getActionableReservations,
      getSummary,
    }),
    [currentUser, currentUserName, reservations, resources]
  );

  return (
    <ReservationStoreContext.Provider value={value}>
      {children}
    </ReservationStoreContext.Provider>
  );
}

export function useReservationStore() {
  const context = useContext(ReservationStoreContext);

  if (!context) {
    throw new Error("useReservationStore must be used inside ReservationStoreProvider");
  }

  return context;
}
