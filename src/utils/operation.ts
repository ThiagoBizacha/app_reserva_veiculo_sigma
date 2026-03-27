import type {
  OperationPhoto,
  OperationRequiredPhotos,
  OperationSignature,
  RequiredPhotoSlot,
  SignaturePoint,
} from "@/types";

export const fuelLevelOptions = ["Vazio", "1/4", "1/2", "3/4", "Cheio"] as const;

export const requiredPhotoSlots: Array<{ key: RequiredPhotoSlot; label: string }> = [
  { key: "front", label: "Frente" },
  { key: "rear", label: "Traseira" },
  { key: "left", label: "Lateral Esquerda" },
  { key: "right", label: "Lateral Direita" },
];

export const parseMileageValue = (value?: string) => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) {
    return null;
  }

  return Number(normalized);
};

export const formatMileageValue = (value?: string) => {
  const parsed = parseMileageValue(value);
  if (parsed === null) {
    return value ?? "";
  }

  return `${new Intl.NumberFormat("pt-BR").format(parsed)} km`;
};

export const getTravelDistance = (startMileage?: string, endMileage?: string) => {
  const start = parseMileageValue(startMileage);
  const end = parseMileageValue(endMileage);

  if (start === null || end === null || end < start) {
    return null;
  }

  return end - start;
};

export const getRequiredPhotoCount = (photos: OperationRequiredPhotos) =>
  requiredPhotoSlots.filter(({ key }) => photos[key]).length;

export const hasAllRequiredPhotos = (photos: OperationRequiredPhotos) =>
  requiredPhotoSlots.every(({ key }) => Boolean(photos[key]));

export const getAllOperationPhotos = (
  photos: OperationRequiredPhotos,
  additionalPhotos: OperationPhoto[],
  damagePhotos: OperationPhoto[]
) => [
  ...requiredPhotoSlots.map(({ key }) => photos[key]).filter(Boolean),
  ...additionalPhotos,
  ...damagePhotos,
] as OperationPhoto[];

export const hasSignature = (signature?: OperationSignature | null) =>
  Boolean(signature && signature.strokes.length > 0);

export const pointsToSvgPath = (points: SignaturePoint[]) => {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
};
