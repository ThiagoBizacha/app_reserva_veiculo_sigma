export type ReservationStatus =
  | "Reservado"
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

export interface ReservationChecklist {
  vehicleClean: boolean;
  tankFull: boolean;
  documentsPresent: boolean;
  spareTireOk: boolean;
  damageReported: boolean;
}

export type FuelLevel = "Vazio" | "1/4" | "1/2" | "3/4" | "Cheio";

export type OperationMode = "checkin" | "checkout";

export type RequiredPhotoSlot = "front" | "rear" | "left" | "right";

export interface OperationPhoto {
  id: string;
  uri: string;
  capturedAt: string;
  label?: string;
}

export interface OperationRequiredPhotos {
  front?: OperationPhoto;
  rear?: OperationPhoto;
  left?: OperationPhoto;
  right?: OperationPhoto;
}

export interface SignaturePoint {
  x: number;
  y: number;
}

export interface SignatureStroke {
  id: string;
  points: SignaturePoint[];
}

export interface OperationSignature {
  signerName: string;
  signedAt: string;
  strokes: SignatureStroke[];
}

export interface ReservationInspection {
  mode: OperationMode;
  inspectedAt: string;
  inspectedBy: string;
  counterpartyName: string;
  mileage: string;
  fuelLevel: FuelLevel;
  checklist: ReservationChecklist;
  notes?: string;
  requiredPhotos: OperationRequiredPhotos;
  additionalPhotos: OperationPhoto[];
  damagePhotos: OperationPhoto[];
  damageIdentified: boolean;
  damageDescription?: string;
  confirmationChecked: boolean;
  signature: OperationSignature;
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
  plannedDurationHours?: number;
  status: ReservationStatus;
  notes?: string;
  approver?: string;
  checkInAt?: string;
  checkOutAt?: string;
  checkInNotes?: string;
  checkOutNotes?: string;
  startMileage?: string;
  endMileage?: string;
  checkInChecklist?: ReservationChecklist;
  checkOutChecklist?: ReservationChecklist;
  checkInFuelLevel?: FuelLevel;
  checkOutFuelLevel?: FuelLevel;
  checkInData?: ReservationInspection;
  checkOutData?: ReservationInspection;
  history: ReservationHistoryItem[];
}

export interface NewReservationPayload {
  resourceId: string;
  startDate: string;
  endDate: string;
  durationHours?: number;
  purpose: string;
  base: string;
  notes?: string;
}

export interface ReservationOperationPayload {
  notes?: string;
  mileage: string;
  fuelLevel: FuelLevel;
  checklist: ReservationChecklist;
  requiredPhotos: OperationRequiredPhotos;
  additionalPhotos: OperationPhoto[];
  damagePhotos: OperationPhoto[];
  damageIdentified: boolean;
  damageDescription?: string;
  confirmationChecked: boolean;
  signature: OperationSignature;
  counterpartyName: string;
}
