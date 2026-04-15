const USERNAME_CONNECTORS = new Set(["DA", "DAS", "DE", "DO", "DOS", "E"]);
export const TECHNICAL_AUTH_LOGIN_DOMAIN = "auth.sigmalithium.local";

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeUsernameInput(value: string) {
  return stripAccents(String(value ?? ""))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
}

export function buildUsernameSeedFromFullName(fullName: string) {
  const tokens = stripAccents(fullName)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "USER";
  }

  const firstToken = tokens[0];
  const lastToken =
    [...tokens].reverse().find((token) => !USERNAME_CONNECTORS.has(token)) ?? tokens[tokens.length - 1];

  return normalizeUsernameInput(`${firstToken.slice(0, 1)}${lastToken}`) || "USER";
}

export function buildUniqueUsername(
  fullName: string,
  takenUsernames: Iterable<string>,
  preferredUsername?: string
) {
  const normalizedTaken = new Set(
    Array.from(takenUsernames, (value) => normalizeUsernameInput(value)).filter(Boolean)
  );
  const baseUsername =
    normalizeUsernameInput(preferredUsername ?? "") || buildUsernameSeedFromFullName(fullName);

  if (!normalizedTaken.has(baseUsername)) {
    return baseUsername;
  }

  let counter = 2;
  let candidate = `${baseUsername}${counter}`;

  while (normalizedTaken.has(candidate)) {
    counter += 1;
    candidate = `${baseUsername}${counter}`;
  }

  return candidate;
}

export function buildAuthLoginEmail(email?: string, username?: string) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  if (normalizedEmail) {
    return normalizedEmail;
  }

  const normalizedUsername = normalizeUsernameInput(String(username ?? ""));

  if (!normalizedUsername) {
    return "";
  }

  return `${normalizedUsername.toLowerCase()}@${TECHNICAL_AUTH_LOGIN_DOMAIN}`;
}
