export function generateEntityId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomSuffix}`;
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function getFriendlyRepositoryErrorMessage(
  error: { message?: string; code?: string } | null | undefined,
  fallbackMessage: string
) {
  if (!error) {
    return fallbackMessage;
  }

  if (error.code === "23P01") {
    return "Ja existe uma reserva ativa para este veiculo no horario informado.";
  }

  if (error.code === "23505") {
    return "Ja existe um cadastro com os dados informados no backend.";
  }

  return error.message || fallbackMessage;
}

