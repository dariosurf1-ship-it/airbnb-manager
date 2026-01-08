// src/components/BookingModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCloud } from "../CloudProvider.jsx";
import { createBooking, updateBooking, nightsBetween } from "../lib/data.js";
import "./BookingModal.css";

function dbStatusToLabel(v) {
  const t = String(v || "").toLowerCase().trim();
  if (t === "confirmed") return "Confermata";
  if (t === "tentative") return "Opzione";
  if (t === "cancelled") return "Cancellata";
  return "Confermata";
}

function labelToDbStatus(label) {
  const t = String(label || "").toLowerCase().trim();
  if (t === "confermata") return "confirmed";
  if (t === "opzione") return "tentative";
  if (t === "cancellata") return "cancelled";
  // se già DB
  if (t === "confirmed" || t === "tentative" || t === "cancelled") return t;
  return "confirmed";
}

export default function BookingModal({
  open,
  mode = "view", // "create" | "edit" | "view"
  canManage = false,
  booking = null,
  onClose,
  onSaved,
}) {
  const { selectedId } = useCloud();

  const isView = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [guest, setGuest] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [status, setStatus] = useState("confirmed"); // DB values
  const [channel, setChannel] = useState("Airbnb");
  const [people, setPeople] = useState(1);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setErr("");

    if (booking) {
      const b = booking;
      setGuest(b.guest_name ?? b.guest ?? "");
      setStart(b.start_date ?? b.check_in ?? "");
      setEnd(b.end_date ?? b.check_out ?? "");
      setStatus(labelToDbStatus(b.status));
      setChannel(b.channel ?? "Airbnb");
      setPeople(b.people ?? 1);
      setPhone(b.phone ?? "");
      setEmail(b.email ?? "");
      setNotes(b.notes ?? "");
    } else {
      setGuest("");
      setStart("");
      setEnd("");
      setStatus("confirmed");
      setChannel("Airbnb");
      setPeople(1);
      setPhone("");
      setEmail("");
      setNotes("");
    }
  }, [open, booking]);

  const nights = useMemo(() => nightsBetween(start, end), [start, end]);

  if (!open) return null;

  async function save() {
    if (!canManage) return;
    setSaving(true);
    setErr("");

    try {
      if (!selectedId) throw new Error("Seleziona un appartamento.");

      const payload = {
        guest_name: guest,
        start_date: start,
        end_date: end,
        status,
        channel,
        people,
        phone,
        email,
        notes,
      };

      if (isCreate) {
        await createBooking(selectedId, payload);
      } else if (isEdit && booking?.id) {
        await updateBooking(booking.id, payload);
      }

      onSaved?.();
    } catch (e) {
      console.error("BookingModal save error:", e);
      setErr(e?.message || "Errore salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{isCreate ? "Nuova prenotazione" : isEdit ? "Modifica prenotazione" : "Dettagli prenotazione"}</div>
            <div className="modalSub">Inserisci i dati e salva.</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Chiudi
          </button>
        </div>

        <div className="modalGrid">
          <div className="field">
            <label>Ospite</label>
            <input value={guest} onChange={(e) => setGuest(e.target.value)} disabled={isView} />
          </div>

          <div className="field">
            <label>Dal (check-in)</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={isView} />
          </div>

          <div className="field">
            <label>Al (check-out)</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} disabled={isView} />
          </div>

          <div className="field">
            <label>Stato</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={isView}>
              <option value="confirmed">Confermata</option>
              <option value="tentative">Opzione</option>
              <option value="cancelled">Cancellata</option>
            </select>
          </div>

          <div className="field">
            <label>Canale</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} disabled={isView}>
              <option value="Airbnb">Airbnb</option>
              <option value="Booking">Booking</option>
              <option value="Diretto">Diretto</option>
            </select>
          </div>

          <div className="field">
            <label>Persone</label>
            <input
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(Number(e.target.value || 1))}
              disabled={isView}
            />
          </div>

          <div className="field">
            <label>Telefono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isView} />
          </div>

          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isView} />
          </div>

          <div className="field fieldWide">
            <label>Note</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isView} />
          </div>
        </div>

        <div className="modalFooter">
          <div className="modalMeta">
            <div><b>Notti:</b> {nights}</div>
            <div><b>Stato:</b> {dbStatusToLabel(status)}</div>
            <div><b>Appartamento:</b> {selectedId ? "OK" : "Seleziona un appartamento"}</div>
          </div>

          <div className="modalActions">
            {err ? <div className="modalError">{err}</div> : null}

            {!isView ? (
              <button className="btn" onClick={save} disabled={saving || !canManage} type="button">
                {saving ? "Salvo..." : "Salva"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
