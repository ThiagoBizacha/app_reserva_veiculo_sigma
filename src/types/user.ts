export type CnhStatus = "Válida" | "Vencida";

export type UserRole = "Solicitante" | "Operação" | "Administrador";

export interface NewUserPayload {
  fullName: string;
  username: string;
  cpf: string;
  matricula: string;
  role: UserRole;
  areaDepartamento: string;
  centroCusto: string;
  email: string;
  telefone: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhStatus: CnhStatus;
  matriz?: string;
  gestorNome?: string;
  cnhAnexo?: string;
  observacao?: string;
}

export interface User {
  id: string;
  userId: string;
  authUserId?: string;
  fullName: string;
  username: string;
  cpf: string;
  gestorVeiculo: boolean;
  matricula: string;
  matriz: string;
  role: UserRole;
  areaDepartamento: string;
  centroCusto: string;
  email: string;
  telefone: string;
  gestorNome?: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhStatus: CnhStatus;
  cnhDataUltimaValidacao: string;
  cnhAnexo: string;
  termosPaytrack: boolean;
  observacao?: string;
}

