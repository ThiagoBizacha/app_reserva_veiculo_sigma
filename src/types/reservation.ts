export type ReservationStatus =
  | "Pendente"
  | "Aprovada"
  | "Em uso"
  | "Concluida"
  | "Cancelada"
  | "Em atraso";

export interface ReservationHistoryItem {
  id: string;
  label: string;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Reservation {
  id: string;
  code: string;
  resourceId: string;
  userId: string;
  title: string;
  purpose: string;
  base: string;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  notes?: string;
  approver?: string;
  history: ReservationHistoryItem[];
}

export interface NewReservationPayload {
  resourceId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  base: string;
  notes?: string;
}
