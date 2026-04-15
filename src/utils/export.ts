import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import type {
  OperationRequiredPhotos,
  Reservation,
  ReservationChecklist,
  Resource,
  User,
} from "@/types";
import { formatDate, formatDateTime, toDate } from "./date";

interface CsvDownloadResult {
  fileUri?: string;
  message: string;
}

type SavePickerHandle = {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const formatTime = (value?: string) => (value ? timeFormatter.format(toDate(value)) : "-");

const formatBoolean = (value?: boolean) => (value ? "Sim" : "Não");

const formatChecklist = (checklist?: ReservationChecklist) => {
  if (!checklist) {
    return "-";
  }

  return [
    `Limpeza ${formatBoolean(checklist.vehicleClean)}`,
    `Tanque ${formatBoolean(checklist.tankFull)}`,
    `Docs ${formatBoolean(checklist.documentsPresent)}`,
    `Estepe ${formatBoolean(checklist.spareTireOk)}`,
    `Avaria ${formatBoolean(checklist.damageReported)}`,
  ].join(" | ");
};

const countRequiredPhotos = (photos?: OperationRequiredPhotos) =>
  photos ? Object.values(photos).filter(Boolean).length : 0;

const escapeCsvValue = (value: unknown) => {
  const text = String(value ?? "-").replace(/\r?\n/g, " ");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
};

const summarizeHistory = (history: Reservation["history"]) =>
  history
    .map((item) =>
      [formatDateTime(item.timestamp), item.label, item.actor, item.note].filter(Boolean).join(" - ")
    )
    .join(" | ");

export function buildReservationsCsv(
  reservations: Reservation[],
  resources: Resource[],
  users: User[]
) {
  const headers = [
    "Código reserva",
    "Status",
    "Solicitante",
    "Email solicitante",
    "Veículo",
    "Código veículo",
    "Placa",
    "Marca",
    "Modelo",
    "Base",
    "Finalidade",
    "Data início",
    "Hora início",
    "Data fim",
    "Hora fim",
    "Duração planejada (h)",
    "Registrado por",
    "Observações gerais",
    "Check-in em",
    "Check-out em",
    "Km saída",
    "Km retorno",
    "Combustível saída",
    "Combustível retorno",
    "Entregue por",
    "Recebido por",
    "Avaria na saída",
    "Avaria no retorno",
    "Descrição avaria saída",
    "Descrição avaria retorno",
    "Notas check-in",
    "Notas check-out",
    "Checklist saída",
    "Checklist retorno",
    "Fotos obrigatórias saída",
    "Fotos obrigatórias retorno",
    "Fotos extras saída",
    "Fotos extras retorno",
    "Fotos avaria saída",
    "Fotos avaria retorno",
    "Assinante saída",
    "Assinante retorno",
    "Histórico",
  ];

  const rows = reservations.map((reservation) => {
    const resource = resources.find((item) => item.id === reservation.resourceId);
    const requester = users.find((item) => item.id === reservation.userId);

    return [
      reservation.code,
      reservation.status,
      requester?.fullName ?? "-",
      requester?.email ?? "-",
      resource?.name ?? "-",
      resource?.code ?? "-",
      resource?.plate ?? "-",
      resource?.brand ?? "-",
      resource?.model ?? "-",
      reservation.base,
      reservation.purpose,
      formatDate(reservation.startDate),
      formatTime(reservation.startDate),
      formatDate(reservation.endDate),
      formatTime(reservation.endDate),
      reservation.plannedDurationHours ?? "-",
      reservation.history[reservation.history.length - 1]?.actor ?? "-",
      reservation.notes ?? "-",
      reservation.checkInAt ? formatDateTime(reservation.checkInAt) : "-",
      reservation.checkOutAt ? formatDateTime(reservation.checkOutAt) : "-",
      reservation.startMileage ?? "-",
      reservation.endMileage ?? "-",
      reservation.checkInFuelLevel ?? "-",
      reservation.checkOutFuelLevel ?? "-",
      reservation.checkInData?.counterpartyName ?? "-",
      reservation.checkOutData?.counterpartyName ?? "-",
      formatBoolean(reservation.checkInData?.damageIdentified),
      formatBoolean(reservation.checkOutData?.damageIdentified),
      reservation.checkInData?.damageDescription ?? "-",
      reservation.checkOutData?.damageDescription ?? "-",
      reservation.checkInNotes ?? "-",
      reservation.checkOutNotes ?? "-",
      formatChecklist(reservation.checkInChecklist),
      formatChecklist(reservation.checkOutChecklist),
      countRequiredPhotos(reservation.checkInData?.requiredPhotos),
      countRequiredPhotos(reservation.checkOutData?.requiredPhotos),
      reservation.checkInData?.additionalPhotos.length ?? 0,
      reservation.checkOutData?.additionalPhotos.length ?? 0,
      reservation.checkInData?.damagePhotos.length ?? 0,
      reservation.checkOutData?.damagePhotos.length ?? 0,
      reservation.checkInData?.signature.signerName ?? "-",
      reservation.checkOutData?.signature.signerName ?? "-",
      summarizeHistory(reservation.history),
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(";")).join("\n");
}

export async function downloadCsvForExcel(
  filename: string,
  csvContent: string
): Promise<CsvDownloadResult> {
  const csvWithBom = `\uFEFF${csvContent}`;
  const platform = Platform.OS;

  if (platform === "web" && typeof document !== "undefined") {
    const savePicker = (
      globalThis as typeof globalThis & {
        showSaveFilePicker?: (options?: unknown) => Promise<SavePickerHandle>;
      }
    ).showSaveFilePicker;

    if (savePicker) {
      const handle = await savePicker({
        suggestedName: filename,
        types: [
          {
            description: "Arquivo CSV",
            accept: { "text/csv": [".csv"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(csvWithBom);
      await writable.close();

      return { message: `Arquivo ${filename} salvo no computador.` };
    }

    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);

    return { message: `Download de ${filename} iniciado.` };
  }

  if (platform === "android") {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return { message: "Seleção de pasta cancelada pelo usuário." };
    }

    const fileNameWithoutExtension = filename.replace(/\.csv$/i, "");
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileNameWithoutExtension,
      "text/csv"
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csvWithBom);

    return {
      fileUri,
      message: `Arquivo ${filename} salvo na pasta escolhida.`,
    };
  }

  if (!FileSystem.documentDirectory) {
    return { message: "Não foi possível acessar o armazenamento local do dispositivo." };
  }

  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvWithBom);

  try {
    await Linking.openURL(fileUri);
  } catch {
    return {
      fileUri,
      message: `Arquivo gerado em ${fileUri}. Abra-o manualmente no dispositivo.`,
    };
  }

  return {
    fileUri,
    message: `Arquivo gerado em ${fileUri}.`,
  };
}

