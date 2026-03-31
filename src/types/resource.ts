export type ResourceCategory = "Veiculo" | "Equipamento" | "Material";

export type ResourceStatus = "Disponivel" | "Em uso" | "Reservado" | "Manutencao";

export type VehicleCategory = "Sedan" | "SUV" | "Pickup";

export interface NewVehiclePayload {
  name: string;
  code: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  vehicleCategory: VehicleCategory;
  currentMileage: string;
  location: string;
  responsible: string;
  description: string;
  rentalCompany?: string;
  vehicleDocumentAttachment?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: string;
  observation?: string;
  requiresApproval?: boolean;
}

export interface Resource {
  id: string;
  vehicleId?: string;
  name: string;
  code: string;
  category: ResourceCategory;
  status: ResourceStatus;
  plate?: string;
  model?: string;
  brand?: string;
  year?: string;
  rentalCompany?: string;
  vehicleCategory?: VehicleCategory;
  currentMileage?: string;
  lastInspectionDate?: string;
  vehicleDocumentAttachment?: string;
  vehiclePhotoAttachments?: string[];
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  lastMaintenanceMileage?: string;
  nextMaintenanceMileage?: string;
  observation?: string;
  location: string;
  capacity?: string;
  description: string;
  responsible: string;
  requiresApproval: boolean;
  imageHint: string;
  nextAvailableAt?: string;
  tags: string[];
}
