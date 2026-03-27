import type { User } from "@/types";

export const currentUserId = "usr-01";

export const users: User[] = [
  {
    id: "usr-01",
    name: "Thiago Bizacha",
    role: "Solicitante",
    area: "Operações",
    email: "thiago.bizacha@sigma.local",
  },
  {
    id: "usr-02",
    name: "Marina Souto",
    role: "Gestor",
    area: "Facilities",
    email: "marina.souto@sigma.local",
  },
  {
    id: "usr-03",
    name: "Caio Mota",
    role: "Operacao",
    area: "Frota",
    email: "caio.mota@sigma.local",
  },
];
