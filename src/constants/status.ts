import type { ReservationStatus, ResourceStatus } from "@/types";

export const resourceStatusLabel: Record<ResourceStatus, string> = {
  Disponivel: "Disponível",
  "Em uso": "Em uso",
  Reservado: "Reservado",
  Manutencao: "Manutenção",
};

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  Pendente: "Pendente",
  Aprovada: "Aprovada",
  "Em uso": "Em uso",
  Concluida: "Concluída",
  Cancelada: "Cancelada",
  "Em atraso": "Em atraso",
};

