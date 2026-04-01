export const APP_TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
});

const appDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const appDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: APP_TIME_ZONE,
});

const appTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: APP_TIME_ZONE,
});

const appDateTimePartsFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIME_ZONE,
});

const appOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  timeZoneName: "shortOffset",
});

export const toDate = (value: string | Date) =>
  value instanceof Date ? new Date(value) : new Date(value);

const getAppDateTimeParts = (value: string | Date) => {
  const parts = Object.fromEntries(
    appDateTimePartsFormatter
      .formatToParts(toDate(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const getAppTimeZoneOffsetMinutes = (value: string | Date) => {
  const timeZoneToken = appOffsetFormatter
    .formatToParts(toDate(value))
    .find((part) => part.type === "timeZoneName")?.value;

  const match = timeZoneToken?.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
};

export const createDateInAppTimeZone = ({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
}: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}) => {
  let utcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let date = new Date(utcTimestamp);
  let offsetMinutes = getAppTimeZoneOffsetMinutes(date);

  utcTimestamp -= offsetMinutes * 60 * 1000;
  date = new Date(utcTimestamp);

  const verifiedOffset = getAppTimeZoneOffsetMinutes(date);
  if (verifiedOffset !== offsetMinutes) {
    utcTimestamp -= (verifiedOffset - offsetMinutes) * 60 * 1000;
    date = new Date(utcTimestamp);
  }

  return date;
};

export const mergeDateAndTimeInAppTimeZone = (dateValue: string | Date, timeValue: string | Date) => {
  const dateParts = getAppDateTimeParts(dateValue);
  const timeParts = getAppDateTimeParts(timeValue);

  return createDateInAppTimeZone({
    year: dateParts.year,
    month: dateParts.month,
    day: dateParts.day,
    hour: timeParts.hour,
    minute: timeParts.minute,
  });
};

export const startOfDay = (value: string | Date) => {
  const parts = getAppDateTimeParts(value);

  return createDateInAppTimeZone({
    year: parts.year,
    month: parts.month,
    day: parts.day,
  });
};

export const formatDate = (value: string | Date) => dateFormatter.format(toDate(value));

export const formatAppDate = (value: string | Date) => appDateFormatter.format(toDate(value));

export const formatDateTime = (value: string | Date) => appDateTimeFormatter.format(toDate(value));

export const formatTime = (value: string | Date) => appTimeFormatter.format(toDate(value));

export const formatMonthYear = (value: Date) => {
  const formatted = monthFormatter.format(value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const addMonths = (value: Date, amount: number) =>
  new Date(value.getFullYear(), value.getMonth() + amount, 1);

export const startOfMonth = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1);

export const endOfMonth = (value: Date) => new Date(value.getFullYear(), value.getMonth() + 1, 0);

export const eachDayOfInterval = (start: Date, end: Date) => {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);

  while (cursor <= limit) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export const isSameDay = (left: string | Date, right: string | Date) => {
  const a = toDate(left);
  const b = toDate(right);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const isWithinRange = (target: Date, start: string | Date, end: string | Date) => {
  const value = startOfDay(target);
  const startDate = startOfDay(start);
  const endDate = startOfDay(end);
  return value >= startDate && value <= endDate;
};

export const isPastDay = (value: string | Date, referenceDate = new Date()) =>
  startOfDay(value).getTime() < startOfDay(referenceDate).getTime();

export const isPastDateTime = (value: string | Date, referenceDate = new Date()) =>
  toDate(value).getTime() < referenceDate.getTime();

export const getWeekdayLabel = (date: Date) => {
  const label = weekdayFormatter.format(date).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1, 3);
};

export const getMonthMatrix = (value: Date) => {
  const firstDay = startOfMonth(value);
  const offset = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

export const toIsoDateTime = (date: Date, hours = 9) => {
  const parts = getAppDateTimeParts(date);

  return createDateInAppTimeZone({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: hours,
  }).toISOString();
};

export const addHours = (value: string | Date, hours: number) => {
  const date = toDate(value);
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

export const isSameCalendarDay = (left: string | Date, right: string | Date) => {
  const a = getAppDateTimeParts(left);
  const b = getAppDateTimeParts(right);

  return a.year === b.year && a.month === b.month && a.day === b.day;
};

export const getDurationHours = (start: string | Date, end: string | Date) => {
  const startDate = toDate(start).getTime();
  const endDate = toDate(end).getTime();

  if (endDate <= startDate) {
    return 0;
  }

  return (endDate - startDate) / (1000 * 60 * 60);
};

export const getNextWholeHour = (referenceDate = new Date()) => {
  const parts = getAppDateTimeParts(referenceDate);
  const currentHour = createDateInAppTimeZone({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
  });
  const shouldAdvanceHour =
    parts.minute > 0 || parts.second > 0 || toDate(referenceDate).getMilliseconds() > 0;

  return shouldAdvanceHour ? addHours(currentHour, 1) : currentHour;
};
