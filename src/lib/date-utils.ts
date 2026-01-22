const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const getTimeZone = (override?: string) => {
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
  const tz = getTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  return new Date(year, month - 1, day);
};

export const getFamilyDateKey = (date: Date = new Date(), timeZone?: string) => {
  const tz = getTimeZone(timeZone);
  const { year, month, day } = getParts(date, tz);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

export const parseDateOnly = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return new Date(NaN);
  return new Date(year, month - 1, day);
};
