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

export const toDate = (value: string | Date) =>
  value instanceof Date ? new Date(value) : new Date(value);

export const startOfDay = (value: string | Date) => {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const formatDate = (value: string | Date) => dateFormatter.format(toDate(value));

export const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(value));

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
  const copy = new Date(date);
  copy.setHours(hours, 0, 0, 0);
  return copy.toISOString();
};

export const addHours = (value: string | Date, hours: number) => {
  const date = toDate(value);
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

export const isSameCalendarDay = (left: string | Date, right: string | Date) => {
  const a = toDate(left);
  const b = toDate(right);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const next = new Date(referenceDate);
  const shouldAdvanceHour =
    next.getMinutes() > 0 || next.getSeconds() > 0 || next.getMilliseconds() > 0;
  next.setSeconds(0, 0);

  if (shouldAdvanceHour) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }

  return next;
};
