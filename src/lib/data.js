// src/lib/data.js
import { supabase } from "../supabaseClient.js";

/** ---------- DATE UTILS ---------- */
export function toISODate(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function nightsBetween(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO);
  const b = new Date(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function normBookingRow(b) {
  return {
    ...b,
    guest_name: b.guest_name ?? b.guest ?? "",
    start_date: b.start_date ?? b.check_in ?? "",
    end_date: b.end_date ?? b.check_out ?? "",
  };
}

/** ---------- BOOKINGS (READ) ---------- */
export async function fetchBookings(propertyId, opts = {}) {
  const { from, to, status = "all" } = opts;

  let q = supabase.from("bookings").select("*").eq("property_id", propertyId);

  if (from) q = q.gte("check_in", from);
  if (to) q = q.lte("check_out", to);

  if (status && status !== "all") q = q.eq("status", status);

  q = q.order("check_in", { ascending: true });

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map(normBookingRow);
}

/** ---------- BOOKINGS (WRITE) ---------- */
export async function createBooking(propertyId, payload) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id;

  if (!uid) throw new Error("Non sei loggato: impossibile creare prenotazione.");
  if (!propertyId) throw new Error("property_id mancante.");
  if (!payload?.guest_name?.trim()) throw new Error("Inserisci il nome ospite.");
  if (!payload?.start_date) throw new Error("Inserisci la data di check-in.");
  if (!payload?.end_date) throw new Error("Inserisci la data di check-out.");

  const row = {
    owner_id: uid,                 // NOT NULL
    property_id: propertyId,       // NOT NULL
    guest: payload.guest_name.trim(),     // NOT NULL
    check_in: payload.start_date,         // NOT NULL
    check_out: payload.end_date,          // NOT NULL

    // compatibilità UI
    guest_name: payload.guest_name.trim(),
    start_date: payload.start_date,
    end_date: payload.end_date,

    // extra
    status: payload.status || "confirmed",
    channel: payload.channel || "Airbnb",
    people: Number(payload.people || 1),
    phone: payload.phone || null,
    email: payload.email || null,
    notes: payload.notes || null,
  };

  const { data, error } = await supabase.from("bookings").insert(row).select("*").single();
  if (error) throw error;

  return normBookingRow(data);
}

export async function updateBooking(bookingId, patch) {
  if (!bookingId) throw new Error("bookingId mancante.");

  const p = { ...(patch || {}) };

  // sincronizza date
  if (p.start_date && !p.check_in) p.check_in = p.start_date;
  if (p.end_date && !p.check_out) p.check_out = p.end_date;
  if (p.check_in && !p.start_date) p.start_date = p.check_in;
  if (p.check_out && !p.end_date) p.end_date = p.check_out;

  // sincronizza ospite
  if (p.guest_name && !p.guest) p.guest = p.guest_name;

  const { data, error } = await supabase.from("bookings").update(p).eq("id", bookingId).select("*").single();
  if (error) throw error;

  return normBookingRow(data);
}

export async function cancelBooking(bookingId) {
  return updateBooking(bookingId, { status: "cancelled" });
}

/** ---------- OPERATIVITÀ / CLEANING ---------- */
/**
 * Manteniamo questo export perché Operativita.jsx lo importa.
 * Se la tua tabella si chiama diversamente, dimmelo e lo allineiamo.
 */
export async function fetchCleaning(propertyId, opts = {}) {
  const { from, to } = opts;

  // Proviamo prima su "tasks" (molti setup usano questa tabella)
  let q = supabase.from("tasks").select("*").eq("property_id", propertyId);

  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);

  q = q.order("date", { ascending: true });

  const { data, error } = await q;

  // Se la tabella "tasks" non esiste, non facciamo crashare l’app: ritorniamo array vuoto.
  if (error) {
    console.warn("fetchCleaning: fallback empty (tasks?)", error.message);
    return [];
  }

  return data || [];
}

// spesso Operatività usa anche tasks generici
export async function fetchTasks(propertyId, opts = {}) {
  return fetchCleaning(propertyId, opts);
}
