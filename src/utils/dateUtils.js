/**
 * Parses a date string, treating timezone-less datetime strings (like YYYY-MM-DD HH:mm:ss) as UTC.
 */
export const parseUTCToDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  let str = String(dateStr).trim();
  // If it's a standard YYYY-MM-DD HH:mm:ss string without timezone, assume it's UTC and parse it as UTC
  if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    if (str.includes(' ')) {
      str = str.replace(' ', 'T');
    }
    if (!str.includes('T')) {
      // Just a date like "2026-07-10"
      return new Date(str);
    }
    // Append Z to treat as UTC
    str = str + 'Z';
  }
  return new Date(str);
};

/**
 * Returns the current/provided date as a YYYY-MM-DD string in Europe/Copenhagen timezone.
 */
export const getDenmarkDateString = (date = new Date()) => {
  const copenhagenString = date.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
  const d = new Date(copenhagenString);
  const pad = (num) => String(num).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
};

/**
 * Returns the current/provided date as a YYYY-MM-DD HH:mm:ss string in Europe/Copenhagen timezone.
 */
export const getDenmarkTimeISOString = (date = new Date()) => {
  const copenhagenString = date.toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
  const d = new Date(copenhagenString);
  const pad = (num) => String(num).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a date string (interpreting timezone-less datetime strings as UTC) into Europe/Copenhagen timezone.
 */
export const formatToDenmarkDateTime = (dateStr, locale = "en-US", options = {}) => {
  let finalLocale = locale;
  let finalOptions = options;
  if (typeof locale === "object") {
    finalOptions = locale;
    finalLocale = "en-US";
  }
  
  const date = parseUTCToDate(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr || "—";
  
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  
  return date.toLocaleString(finalLocale, {
    timeZone: "Europe/Copenhagen",
    ...defaultOptions,
    ...finalOptions
  });
};

/**
 * Formats a date string (interpreting timezone-less datetime strings as UTC) into Europe/Copenhagen timezone using 24-hour time.
 * Returns formatted string like "25 Sep 2026 14:30" (or with seconds if includeSeconds is true).
 */
export const formatToDenmark24Hour = (dateStr, includeSeconds = false, options = {}) => {
  if (!dateStr) return "—";
  const date = parseUTCToDate(dateStr) || new Date(dateStr);
  if (!date || isNaN(date.getTime())) return String(dateStr) || "—";

  return date.toLocaleString("en-GB", {
    timeZone: "Europe/Copenhagen",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: false,
    ...options
  }).replace(",", "");
};

/**
 * Formats a date string into { date, time } in Europe/Copenhagen timezone using 24-hour time.
 * e.g., { date: "25 Sep 2026", time: "14:30" }
 */
export const formatToDenmark24HourObj = (dateStr, includeSeconds = false) => {
  if (!dateStr) return { date: "—", time: "—" };
  try {
    const d = parseUTCToDate(dateStr) || new Date(dateStr);
    if (isNaN(d.getTime())) {
      const s = String(dateStr);
      return { date: s.split("T")[0] || s, time: s.split("T")[1] || "—" };
    }
    const date = d.toLocaleString("en-GB", {
      timeZone: "Europe/Copenhagen",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const time = d.toLocaleString("en-GB", {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
      hour12: false
    });
    return { date, time };
  } catch (e) {
    return { date: String(dateStr), time: "—" };
  }
};

/**
 * Formats a date string to a date-only format in Europe/Copenhagen timezone.
 */
export const formatToDenmarkDate = (dateStr, options = {}) => {
  const date = parseUTCToDate(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr || "—";
  return date.toLocaleDateString("en-US", {
    timeZone: "Europe/Copenhagen",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  });
};
