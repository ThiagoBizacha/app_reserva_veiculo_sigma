export interface User {
  id: string;
  name: string;
  role: "Solicitante" | "Gestor" | "Operacao" | "Administrador";
  area: string;
  email: string;
}
