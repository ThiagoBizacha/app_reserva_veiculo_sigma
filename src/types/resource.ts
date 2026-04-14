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
  description: string;
  rentalCompany?: string;
  vehicleDocumentAttachment?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: string;
  observation?: string;
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
  capacity?: string;
  description: string;
  imageHint: string;
  nextAvailableAt?: string;
  tags: string[];
}
