const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export const getFamilyTimeZone = (override?: string) => {
  return override ?? import.meta.env?.VITE_FAMILY_TIMEZONE ?? DEFAULT_TIMEZONE;
};

const getParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
};

export const getFamilyDate = (date: Date = new Date(), timeZone?: string) => {
  const tz = getFamilyTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  return new Date(year, month - 1, day);
};

export const getFamilyDateKey = (date: Date = new Date(), timeZone?: string) => {
  const tz = getFamilyTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

export const getFamilyHour = (date: Date = new Date(), timeZone?: string) => {
  const tz = getFamilyTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour: '2-digit',
    hourCycle: 'h23',
  });
  return Number(formatter.format(date));
};

export const formatFamilyDateTime = (
  date: Date = new Date(),
  options: Intl.DateTimeFormatOptions,
  locale = 'pt-BR',
  timeZone?: string,
) => {
  const tz = getFamilyTimeZone(timeZone);
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: tz,
  }).format(date);
};

export const parseDateOnly = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
};
