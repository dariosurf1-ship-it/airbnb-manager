// src/pages/Prenotazioni.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCloud } from "../CloudProvider.jsx";
import BookingModal from "../components/BookingModal.jsx";
import { fetchBookings, toISODate } from "../lib/data.js";
import { supabase } from "../supabaseClient.js";

/**
 * Prenotazioni "PRO+"
 * - Colonna Telefono/Email con link tel/mail + WhatsApp se telefono valido
 * - Pulsanti rapidi: Conferma / Cancella / Dettagli
 * - Badge automatici: In arrivo / In casa / In partenza (rispetto a oggi)
 * - Ordinamento cliccabile: Ospite / Dal / Al
 * - Pulsante "Copia contatti"
 * - Filtri rapidi: Oggi / Prossimi 7 giorni / Solo in casa
 *
 * Nota: in DB manteniamo status in EN (confirmed/cancelled/pending).
 */

function normBooking(b) {
  return {
    ...b,
    id: b?.id ?? crypto.randomUUID(),
    property_id: b?.property_id ?? b?.propertyId ?? b?.property ?? null,

    guest_name: b?.guest_name ?? b?.guest ?? b?.cliente ?? b?.ospite ?? "",
    start_date: b?.start_date ?? b?.check_in ?? b?.checkIn ?? b?.from ?? "",
    end_date: b?.end_date ?? b?.check_out ?? b?.checkOut ?? b?.to ?? "",
    check_in: b?.check_in ?? b?.start_date ?? "",
    check_out: b?.check_out ?? b?.end_date ?? "",

    status: String(b?.status ?? b?.booking_status ?? b?.stato ?? "").trim(),
    channel: b?.channel ?? b?.source ?? b?.portale ?? "",
    notes: b?.notes ?? "",
    phone: b?.phone ?? b?.telefono ?? "",
    email: b?.email ?? "",
  };
}

function normalizeStatusKey(s) {
  const t = String(s || "").toLowerCase().trim();
  if (!t) return "unknown";
  if (t === "confirmed") return "confirmed";
  if (t === "cancelled") return "cancelled";
  if (t === "pending") return "pending";
  if (t === "confermata" || t === "confermato" || t === "confirmée") return "confirmed";
  if (t === "cancellata" || t === "annullata") return "cancelled";
  if (t === "in attesa") return "pending";
  return t;
}

function statusLabelIT(key) {
  if (key === "confirmed") return "Confermata";
  if (key === "cancelled") return "Cancellata";
  if (key === "pending") return "In attesa";
  if (!key || key === "unknown") return "—";
  return String(key);
}

function nightsBetween(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO);
  const b = new Date(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function compareISO(a, b) {
  if (!a || !b) return 0;
  return String(a).localeCompare(String(b));
}

function occupancyBadge(b, todayISO) {
  const s = b.start_date || b.check_in;
  const e = b.end_date || b.check_out;
  if (!s || !e) return { label: "—", kind: "muted" };
  if (compareISO(todayISO, s) === 0) return { label: "In arrivo", kind: "arr" };
  if (compareISO(todayISO, e) === 0) return { label: "In partenza", kind: "dep" };
  if (compareISO(todayISO, s) > 0 && compareISO(todayISO, e) < 0) return { label: "In casa", kind: "in" };
  return { label: "—", kind: "muted" };
}

function addDaysISO(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// ---- WhatsApp / phone helpers ----
function digitsOnly(s) {
  return String(s || "").replace(/[^\d+]/g, "");
}

// molto permissivo: prende solo cifre e +, poi prova a normalizzare
function normalizePhoneForWhatsApp(raw) {
  if (!raw) return null;
  let p = digitsOnly(raw);

  // se ha + (es +39...), ok
  if (p.startsWith("+")) {
    const digits = p.replace(/[^\d]/g, "");
    if (digits.length >= 10 && digits.length <= 15) return digits; // wa.me vuole solo cifre
    return null;
  }

  // se è italiano e parte con 0/3 ecc, prova ad aggiungere 39
  const onlyDigits = p.replace(/[^\d]/g, "");
  if (onlyDigits.length >= 9 && onlyDigits.length <= 10) return `39${onlyDigits}`;
  if (onlyDigits.length >= 11 && onlyDigits.length <= 15) return onlyDigits;

  return null;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function Prenotazioni() {
  const { selectedId, selectedProperty, canManage } = useCloud();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  // filtri base
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | confirmed | pending | cancelled
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // filtri rapidi
  const [quick, setQuick] = useState("none"); // none | today | next7 | inhouse

  // sorting
  const [sort, setSort] = useState({ key: "start_date", dir: "asc" }); // key: guest_name | start_date | end_date

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("view"); // view | create | edit
  const [selected, setSelected] = useState(null);

  // toast mini (solo testo)
  const [toast, setToast] = useState("");

  const todayISO = toISODate(new Date());
  const propertyName = selectedProperty?.name || "Appartamento";

  async function load() {
    if (!selectedId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const data = await fetchBookings(selectedId, {
        status: "all",
        from: from || undefined,
        to: to || undefined,
      });
      setRows((data || []).map(normBooking));
    } catch (e) {
      console.error("Prenotazioni load error:", e);
      setErr(e?.message || "Errore caricamento prenotazioni.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    // finestra rapida date
    const today = todayISO;
    const next7 = addDaysISO(todayISO, 7);

    return (rows || [])
      .filter((b) => {
        const stKey = normalizeStatusKey(b.status);
        if (status !== "all" && stKey !== status) return false;

        if (needle) {
          const hay = `${b.guest_name} ${b.channel} ${b.status} ${b.start_date} ${b.end_date} ${b.phone} ${b.email}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }

        // Quick filters:
        if (quick === "today") {
          // check-in oggi o check-out oggi o in casa oggi
          const occ = occupancyBadge(b, today);
          return occ.label !== "—";
        }

        if (quick === "next7") {
          // qualsiasi prenotazione che "tocca" la finestra [today, next7]
          const s = b.start_date || b.check_in;
          const e = b.end_date || b.check_out;
          if (!s || !e) return false;
          // overlap: s <= next7 && e >= today
          return compareISO(s, next7) <= 0 && compareISO(e, today) >= 0;
        }

        if (quick === "inhouse") {
          const occ = occupancyBadge(b, today);
          return occ.kind === "in";
        }

        return true;
      })
      .sort((a, b) => {
        const dirMul = sort.dir === "asc" ? 1 : -1;

        if (sort.key === "guest_name") {
          return String(a.guest_name || "").localeCompare(String(b.guest_name || "")) * dirMul;
        }
        if (sort.key === "end_date") {
          return String(a.end_date || "").localeCompare(String(b.end_date || "")) * dirMul;
        }
        // default start_date
        return String(a.start_date || "").localeCompare(String(b.start_date || "")) * dirMul;
      });
  }, [rows, q, status, quick, sort, todayISO]);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  function sortArrow(key) {
    if (sort.key !== key) return "↕";
    return sort.dir === "asc" ? "↑" : "↓";
  }

  function openCreate() {
    if (!canManage) return alert("Sei VIEWER: non puoi creare prenotazioni.");
    setSelected(null);
    setMode("create");
    setOpen(true);
  }

  function openRow(b) {
    setSelected(b);
    setMode(canManage ? "edit" : "view");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    setMode("view");
  }

  async function onSaved() {
    await load();
    closeModal();
  }

  async function quickSetStatus(booking, nextStatusKey) {
    if (!canManage) return;

    const label = statusLabelIT(nextStatusKey);
    const ok = window.confirm(`Confermi cambio stato a "${label}" per ${booking.guest_name || "ospite"}?`);
    if (!ok) return;

    try {
      const r = await supabase
        .from("bookings")
        .update({ status: nextStatusKey })
        .eq("id", booking.id)
        .select("*")
        .single();

      if (r.error) throw r.error;

      await load();
      setToast(`Stato aggiornato: ${label}`);
    } catch (e) {
      console.error("quickSetStatus error:", e);
      alert(e?.message || "Errore cambio stato.");
    }
  }

  async function onCopyContacts(b) {
    const phone = b.phone ? String(b.phone).trim() : "";
    const email = b.email ? String(b.email).trim() : "";
    const name = b.guest_name ? String(b.guest_name).trim() : "Ospite";

    const text = `Contatti - ${name}\nTelefono: ${phone || "—"}\nEmail: ${email || "—"}`;
    const ok = await copyToClipboard(text);
    setToast(ok ? "Contatti copiati ✅" : "Impossibile copiare ❌");
  }

  // ------- STILI INLINE -------
  const S = {
    card: {
      background: "rgba(255,255,255,0.06)",
      borderRadius: 16,
      padding: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      position: "relative",
    },
    header: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
    title: { fontSize: 28, fontWeight: 900, margin: 0 },
    sub: { opacity: 0.8, marginTop: 4 },
    actions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    filters: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 12,
    },
    input: {
      height: 34,
      padding: "0 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.25)",
      color: "white",
      outline: "none",
      minWidth: 220,
    },
    select: {
      height: 34,
      padding: "0 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.25)",
      color: "white",
      outline: "none",
      minWidth: 160,
    },
    small: { fontSize: 12, opacity: 0.8 },
    tableWrap: {
      marginTop: 12,
      borderRadius: 14,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.18)",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      textAlign: "left",
      padding: 12,
      fontSize: 12,
      opacity: 0.85,
      borderBottom: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      whiteSpace: "nowrap",
      userSelect: "none",
    },
    thSort: {
      cursor: "pointer",
    },
    td: {
      padding: 12,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      verticalAlign: "top",
    },
    tr: { cursor: "pointer" },
    muted: { opacity: 0.85 },

    pill: (kind) => {
      const base = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.06)",
        whiteSpace: "nowrap",
      };
      if (kind === "arr") return { ...base, borderColor: "rgba(90,170,255,0.35)", background: "rgba(90,170,255,0.12)" };
      if (kind === "dep") return { ...base, borderColor: "rgba(255,120,120,0.35)", background: "rgba(255,120,120,0.12)" };
      if (kind === "in") return { ...base, borderColor: "rgba(80,220,160,0.35)", background: "rgba(80,220,160,0.12)" };
      return base;
    },

    statusPill: (key) => {
      const base = {
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.06)",
        whiteSpace: "nowrap",
      };
      if (key === "confirmed")
        return { ...base, borderColor: "rgba(80,220,160,0.35)", background: "rgba(80,220,160,0.12)" };
      if (key === "cancelled")
        return { ...base, borderColor: "rgba(255,120,120,0.35)", background: "rgba(255,120,120,0.12)" };
      if (key === "pending")
        return { ...base, borderColor: "rgba(255,190,90,0.35)", background: "rgba(255,190,90,0.12)" };
      return base;
    },

    btnMini: {
      height: 30,
      padding: "0 10px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap",
    },
    btnMiniPrimary: {
      height: 30,
      padding: "0 10px",
      borderRadius: 10,
      border: "0",
      background: "rgba(80,220,160,0.18)",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    },
    btnMiniDanger: {
      height: 30,
      padding: "0 10px",
      borderRadius: 10,
      border: "0",
      background: "rgba(255,120,120,0.18)",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    },

    empty: {
      padding: 14,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      marginTop: 12,
      opacity: 0.9,
    },
    err: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      border: "1px solid rgba(255,120,120,0.35)",
      background: "rgba(255,120,120,0.12)",
    },
    contactBox: {
      display: "grid",
      gap: 6,
      minWidth: 240,
    },
    contactRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    link: {
      color: "white",
      textDecoration: "none",
      opacity: 0.9,
    },
    linkMuted: {
      color: "white",
      textDecoration: "none",
      opacity: 0.8,
    },
    waBtn: {
      height: 26,
      padding: "0 8px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(80,220,160,0.14)",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 900,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
    },
    quickWrap: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    chip: (active) => ({
      height: 30,
      padding: "0 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: active ? "rgba(90,170,255,0.16)" : "rgba(255,255,255,0.06)",
      color: "white",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    }),
    toast: {
      position: "absolute",
      right: 16,
      bottom: 16,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(0,0,0,0.45)",
      color: "white",
      fontSize: 12,
      fontWeight: 900,
      pointerEvents: "none",
      opacity: toast ? 1 : 0,
      transform: toast ? "translateY(0)" : "translateY(6px)",
      transition: "all 180ms ease",
    },
  };

  return (
    <>
      <div style={S.card}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Prenotazioni</h1>
            <div style={S.sub}>
              {propertyName} • <span style={S.small}>Gestione completa</span>
            </div>
          </div>

          <div style={S.actions}>
            <button className="btn" onClick={openCreate} type="button" disabled={!canManage}>
              + Nuova prenotazione
            </button>
            <button className="btn btn-ghost" onClick={load} type="button">
              Aggiorna
            </button>
          </div>
        </div>

        <div style={S.filters}>
          <input
            style={S.input}
            placeholder="Cerca ospite / canale / contatti / date…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select style={S.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="confirmed">Confermate</option>
            <option value="pending">In attesa</option>
            <option value="cancelled">Cancellate</option>
          </select>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={S.small}>Dal</span>
            <input style={{ ...S.input, minWidth: 150 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={S.small}>Al</span>
            <input style={{ ...S.input, minWidth: 150 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div style={S.quickWrap}>
            <span style={S.small}>Filtri rapidi:</span>

            <button
              type="button"
              style={S.chip(quick === "today")}
              onClick={() => setQuick((v) => (v === "today" ? "none" : "today"))}
              title="Arrivi/Partenze/In casa oggi"
            >
              Oggi
            </button>

            <button
              type="button"
              style={S.chip(quick === "next7")}
              onClick={() => setQuick((v) => (v === "next7" ? "none" : "next7"))}
              title="Prenotazioni che toccano i prossimi 7 giorni"
            >
              Prossimi 7 giorni
            </button>

            <button
              type="button"
              style={S.chip(quick === "inhouse")}
              onClick={() => setQuick((v) => (v === "inhouse" ? "none" : "inhouse"))}
              title="Solo ospiti attualmente in casa"
            >
              Solo in casa
            </button>
          </div>

          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setQ("");
              setStatus("all");
              setFrom("");
              setTo("");
              setQuick("none");
            }}
          >
            Reset filtri
          </button>

          <div style={{ marginLeft: "auto", opacity: 0.85, fontSize: 12 }}>
            Oggi: <b>{todayISO}</b> • Trovate: <b>{filtered.length}</b> • Ordine:{" "}
            <b>
              {sort.key === "guest_name" ? "Ospite" : sort.key === "end_date" ? "Al" : "Dal"} {sort.dir === "asc" ? "↑" : "↓"}
            </b>{" "}
            • Permessi: <b>{canManage ? "admin" : "viewer"}</b>
          </div>
        </div>

        {err ? (
          <div style={S.err}>
            <b>Errore:</b> {err}
          </div>
        ) : null}

        {loading ? <div style={{ marginTop: 12, opacity: 0.8 }}>Carico…</div> : null}

        {!loading && filtered.length === 0 ? <div style={S.empty}>Nessuna prenotazione con questi filtri.</div> : null}

        {!loading && filtered.length > 0 ? (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Occupazione</th>
                  <th style={S.th}>Stato</th>

                  <th
                    style={{ ...S.th, ...S.thSort }}
                    onClick={() => toggleSort("guest_name")}
                    title="Ordina per Ospite"
                  >
                    Ospite {sortArrow("guest_name")}
                  </th>

                  <th
                    style={{ ...S.th, ...S.thSort }}
                    onClick={() => toggleSort("start_date")}
                    title="Ordina per Dal"
                  >
                    Dal {sortArrow("start_date")}
                  </th>

                  <th
                    style={{ ...S.th, ...S.thSort }}
                    onClick={() => toggleSort("end_date")}
                    title="Ordina per Al"
                  >
                    Al {sortArrow("end_date")}
                  </th>

                  <th style={S.th}>Notti</th>
                  <th style={S.th}>Canale</th>
                  <th style={S.th}>Telefono / Email</th>
                  <th style={S.th}>Azioni</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((b) => {
                  const stKey = normalizeStatusKey(b.status);
                  const stLabel = statusLabelIT(stKey);
                  const occ = occupancyBadge(b, todayISO);
                  const nights = nightsBetween(b.start_date, b.end_date);

                  const phone = b.phone ? String(b.phone).trim() : "";
                  const email = b.email ? String(b.email).trim() : "";
                  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;
                  const mailHref = email ? `mailto:${email}` : null;

                  const waDigits = normalizePhoneForWhatsApp(phone);
                  const waHref = waDigits ? `https://wa.me/${waDigits}` : null;

                  return (
                    <tr
                      key={b.id}
                      style={S.tr}
                      onClick={() => openRow(b)}
                      title={canManage ? "Click per modifica/dettagli" : "Click per dettagli"}
                    >
                      <td style={S.td}>
                        {occ.label !== "—" ? <span style={S.pill(occ.kind)}>{occ.label}</span> : <span style={S.muted}>—</span>}
                      </td>

                      <td style={S.td}>
                        <span style={S.statusPill(stKey)}>{stLabel}</span>
                      </td>

                      <td style={S.td}>
                        <b>{b.guest_name || "—"}</b>
                      </td>

                      <td style={S.td}>
                        <span style={S.muted}>{b.start_date || "—"}</span>
                      </td>

                      <td style={S.td}>
                        <span style={S.muted}>{b.end_date || "—"}</span>
                      </td>

                      <td style={S.td}>
                        <b>{nights}</b>
                      </td>

                      <td style={S.td}>
                        <span style={S.muted}>{b.channel || "—"}</span>
                      </td>

                      <td style={S.td}>
                        <div style={S.contactBox}>
                          <div style={S.contactRow}>
                            <div style={S.muted}>
                              📞{" "}
                              {phone ? (
                                <a href={telHref} style={S.link} onClick={(e) => e.stopPropagation()} title="Chiama">
                                  {phone}
                                </a>
                              ) : (
                                "—"
                              )}
                            </div>

                            {waHref ? (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noreferrer"
                                style={S.waBtn}
                                onClick={(e) => e.stopPropagation()}
                                title="Apri WhatsApp"
                              >
                                🟢 WhatsApp
                              </a>
                            ) : null}

                            <button
                              type="button"
                              style={S.btnMini}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyContacts(b);
                              }}
                              title="Copia telefono + email"
                            >
                              Copia contatti
                            </button>
                          </div>

                          <div style={S.muted}>
                            ✉️{" "}
                            {email ? (
                              <a href={mailHref} style={S.linkMuted} onClick={(e) => e.stopPropagation()} title="Invia email">
                                {email}
                              </a>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={S.td}>
                        {canManage ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              style={S.btnMiniPrimary}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                quickSetStatus(b, "confirmed");
                              }}
                              title="Imposta stato: Confermata"
                              disabled={stKey === "confirmed"}
                            >
                              Conferma
                            </button>

                            <button
                              style={S.btnMiniDanger}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                quickSetStatus(b, "cancelled");
                              }}
                              title="Imposta stato: Cancellata"
                              disabled={stKey === "cancelled"}
                            >
                              Cancella
                            </button>

                            <button
                              style={S.btnMini}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRow(b);
                              }}
                              title="Apri dettagli"
                            >
                              Dettagli
                            </button>
                          </div>
                        ) : (
                          <button
                            style={S.btnMini}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRow(b);
                            }}
                            title="Apri dettagli"
                          >
                            Dettagli
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div style={S.toast}>{toast}</div>
      </div>

      <BookingModal
        open={open}
        mode={mode}
        canManage={canManage}
        booking={selected}
        onClose={() => {
          setOpen(false);
          setSelected(null);
          setMode("view");
        }}
        onSaved={async () => {
          await load();
          setOpen(false);
          setSelected(null);
          setMode("view");
        }}
      />
    </>
  );
}
