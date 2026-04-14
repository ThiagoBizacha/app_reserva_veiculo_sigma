export type CnhStatus = "Válida" | "Vencida";

export type UserRole = "Solicitante" | "Operação" | "Administrador";

export interface NewUserPayload {
  name: string;
  fullName: string;
  cpf: string;
  matricula: string;
  role: UserRole;
  areaDepartamento: string;
  centroCusto: string;
  emailCorporativo: string;
  telefone: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhUfEmissao: string;
  cnhStatus: CnhStatus;
  matriz?: string;
  gestorId?: string;
  cnhAnexo?: string;
  observacao?: string;
}

export interface User {
  id: string;
  userId: string;
  authUserId?: string;
  name: string;
  fullName: string;
  cpf: string;
  gestorVeiculo: boolean;
  matricula: string;
  matriz: string;
  role: UserRole;
  area: string;
  areaDepartamento: string;
  centroCusto: string;
  email: string;
  emailCorporativo: string;
  telefone: string;
  gestorId?: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhUfEmissao: string;
  cnhStatus: CnhStatus;
  cnhDataUltimaValidacao: string;
  cnhAnexo: string;
  termosPaytrack: boolean;
  observacao?: string;
}

