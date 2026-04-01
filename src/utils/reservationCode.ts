import type { Reservation } from "@/types";

const RESERVATION_CODE_PATTERN = /^[A-Z]{3}-(\d{4})-(\d{3,})$/i;

function getReservationYear(reservation: Reservation) {
  const reservationTime = Date.parse(reservation.startDate);

  if (Number.isNaN(reservationTime)) {
    return new Date().getFullYear();
  }

  return new Date(reservation.startDate).getFullYear();
}

export function formatReservationCode(year: number, sequence: number) {
  return `RSV-${year}-${String(sequence).padStart(3, "0")}`;
}

export function parseReservationCode(code?: string) {
  if (!code?.trim()) {
    return null;
  }

  const match = code.trim().match(RESERVATION_CODE_PATTERN);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  };
}

export function getNextReservationCode(
  reservations: Reservation[],
  referenceDate: string | Date = new Date()
) {
  const year =
    referenceDate instanceof Date ? referenceDate.getFullYear() : new Date(referenceDate).getFullYear();
  const normalizedYear = Number.isNaN(year) ? new Date().getFullYear() : year;

  const highestSequence = reservations.reduce((currentHighest, reservation) => {
    const parsed = parseReservationCode(reservation.code);

    if (!parsed || parsed.year !== normalizedYear) {
      return currentHighest;
    }

    return Math.max(currentHighest, parsed.sequence);
  }, 0);

  return formatReservationCode(normalizedYear, highestSequence + 1);
}

export function normalizeReservationCodes(reservations: Reservation[]) {
  const highestSequenceByYear = new Map<number, number>();

  reservations.forEach((reservation) => {
    const parsed = parseReservationCode(reservation.code);

    if (!parsed) {
      return;
    }

    highestSequenceByYear.set(
      parsed.year,
      Math.max(highestSequenceByYear.get(parsed.year) ?? 0, parsed.sequence)
    );
  });

  const usedCodes = new Set<string>();

  return reservations.map((reservation) => {
    const reservationYear = getReservationYear(reservation);
    const parsed = parseReservationCode(reservation.code);
    const normalizedCode =
      parsed && parsed.year === reservationYear
        ? formatReservationCode(parsed.year, parsed.sequence)
        : null;

    if (normalizedCode && !usedCodes.has(normalizedCode)) {
      usedCodes.add(normalizedCode);

      return normalizedCode === reservation.code
        ? reservation
        : {
            ...reservation,
            code: normalizedCode,
          };
    }

    const nextSequence = (highestSequenceByYear.get(reservationYear) ?? 0) + 1;
    const nextCode = formatReservationCode(reservationYear, nextSequence);

    highestSequenceByYear.set(reservationYear, nextSequence);
    usedCodes.add(nextCode);

    return {
      ...reservation,
      code: nextCode,
    };
  });
}
