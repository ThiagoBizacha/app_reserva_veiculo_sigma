import { currentUserId, reservations as initialReservations, resources as initialResources, users } from "@/data";
import type { NewReservationPayload, Reservation, Resource } from "@/types";
import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { getResourceConflicts } from "@/utils/reservations";

interface ReservationStoreValue {
  resources: Resource[];
  reservations: Reservation[];
  currentUserId: string;
  currentUserName: string;
  toggleResourceMaintenance: (resourceId: string) => void;
  createReservation: (payload: NewReservationPayload) => {
    success: boolean;
    message: string;
    reservation?: Reservation;
  };
}

const ReservationStoreContext = createContext<ReservationStoreValue | null>(null);

export function ReservationStoreProvider({ children }: PropsWithChildren) {
  const [resources, setResources] = useState(initialResources);
  const [reservations, setReservations] = useState(initialReservations);

  const currentUserName = users.find((user) => user.id === currentUserId)?.name ?? "Usuário";

  const toggleResourceMaintenance = (resourceId: string) => {
    setResources((current) =>
      current.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              status: resource.status === "Manutencao" ? "Disponivel" : "Manutencao",
            }
          : resource
      )
    );
  };

  const createReservation = (payload: NewReservationPayload) => {
    if (!payload.resourceId || !payload.startDate || !payload.endDate || !payload.purpose || !payload.base) {
      return { success: false, message: "Preencha todos os campos obrigatórios." };
    }

    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      return { success: false, message: "A data final não pode ser menor que a data inicial." };
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
        message: "Já existe uma reserva para o recurso no período informado.",
      };
    }

    const resource = resources.find((item) => item.id === payload.resourceId);
    if (!resource) {
      return { success: false, message: "Recurso não encontrado." };
    }

    const id = `rsv-${Date.now()}`;
    const reservation: Reservation = {
      id,
      code: `RSV-${new Date().getFullYear()}-${String(reservations.length + 35).padStart(3, "0")}`,
      resourceId: payload.resourceId,
      userId: currentUserId,
      title: `Reserva ${resource.name}`,
      purpose: payload.purpose,
      base: payload.base,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: resource.requiresApproval ? "Pendente" : "Aprovada",
      notes: payload.notes,
      approver: resource.requiresApproval ? "Marina Souto" : undefined,
      history: [
        {
          id: `hist-${Date.now()}`,
          label: "Solicitação criada",
          timestamp: new Date().toISOString(),
          actor: currentUserName,
          note: payload.notes,
        },
      ],
    };

    setReservations((current) => [reservation, ...current]);

    return {
      success: true,
      message: resource.requiresApproval
        ? "Reserva criada e enviada para aprovação."
        : "Reserva criada com sucesso.",
      reservation,
    };
  };

  const value = useMemo(
    () => ({
      resources,
      reservations,
      currentUserId,
      currentUserName,
      toggleResourceMaintenance,
      createReservation,
    }),
    [currentUserName, reservations, resources]
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
