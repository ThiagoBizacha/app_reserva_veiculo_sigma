export type ResourceCategory = "Veiculo" | "Equipamento" | "Material";

export type ResourceStatus = "Disponivel" | "Em uso" | "Reservado" | "Manutencao";

export interface Resource {
  id: string;
  name: string;
  code: string;
  category: ResourceCategory;
  status: ResourceStatus;
  location: string;
  capacity?: string;
  description: string;
  responsible: string;
  requiresApproval: boolean;
  imageHint: string;
  nextAvailableAt?: string;
  tags: string[];
}
