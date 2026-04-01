import type { User } from "@/types";

export function normalizeUserSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findUserByReference(users: User[], reference?: string) {
  const normalizedReference = normalizeUserSearchValue(reference ?? "");

  if (!normalizedReference) {
    return undefined;
  }

  const exactMatch = users.find((user) => {
    const candidates = [
      user.id,
      user.userId,
      user.fullName,
      user.name,
      user.matricula,
      user.email,
      user.emailCorporativo,
    ];

    return candidates.some(
      (candidate) => normalizeUserSearchValue(candidate ?? "") === normalizedReference
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatches = users.filter((user) => {
    const candidates = [user.fullName, user.name, user.matricula, user.emailCorporativo];

    return candidates.some((candidate) =>
      normalizeUserSearchValue(candidate ?? "").includes(normalizedReference)
    );
  });

  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  return undefined;
}

export function getUserDisplayName(users: User[], userId?: string) {
  if (!userId?.trim()) {
    return "";
  }

  return users.find((user) => user.id === userId)?.fullName ?? userId;
}
