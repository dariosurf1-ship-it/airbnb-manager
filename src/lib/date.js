// src/lib/date.js

export function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(isoDate, days) {
  if (!isoDate) return "";
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return "";
  dt.setDate(dt.getDate() + Number(days || 0));
  return toISODate(dt);
}

export function startOfMonthISO(isoDate) {
  const dt = isoDate ? new Date(isoDate) : new Date();
  dt.setDate(1);
  return toISODate(dt);
}

export function endOfMonthISO(isoDate) {
  const dt = isoDate ? new Date(isoDate) : new Date();
  // ultimo giorno del mese: giorno 0 del mese successivo
  const y = dt.getFullYear();
  const m = dt.getMonth();
  const last = new Date(y, m + 1, 0);
  return toISODate(last);
}

export function isSameDayISO(a, b) {
  return String(a || "") === String(b || "");
}
