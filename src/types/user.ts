export type CnhStatus = "Valida" | "Vencida";

export interface User {
  id: string;
  userId: string;
  name: string;
  fullName: string;
  cpf: string;
  gestorVeiculo: boolean;
  matricula: string;
  matriz: string;
  role: "Solicitante" | "Gestor" | "Operacao" | "Administrador";
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
