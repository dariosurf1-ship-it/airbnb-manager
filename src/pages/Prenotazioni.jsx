import { useEffect, useMemo, useState } from "react";
import PropertyHeader from "../components/PropertyHeader";
import { useCloud } from "../CloudProvider";
import {
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  fetchMyRoleForProperty,
} from "../lib/cloud";
import { Card, Button, Input, Select, Textarea, Banner } from "../ui";

const STATUS = ["Confermata", "In attesa", "Cancellata", "Check-in fatto", "Check-out fatto"];
const CHANNEL = ["Airbnb", "Booking", "Diretto", "Altro"];
const CONTACT = ["WhatsApp", "Email"];
const LANG = [
  { v: "EN", l: "EN - English" },
  { v: "IT", l: "IT - Italiano" },
  { v: "FR", l: "FR - Français" },
  { v: "ES", l: "ES - Español" },
  { v: "DE", l: "DE - Deutsch" },
  { v: "RO", l: "RO - Română" },
];

function emptyForm() {
  const today = new Date().toISOString().slice(0, 10);
  const t2 = new Date();
  t2.setDate(t2.getDate() + 2);
  const out = t2.toISOString().slice(0, 10);

  return {
    guest: "",
    channel: "Airbnb",
    status: "Confermata",
    check_in: today,
    check_out: out,
    people: 2,
    nationality: "EN",
    phone: "",
    email: "",
    preferred_contact: "WhatsApp",
    notes: "",
  };
}

export default function Prenotazioni() {
  const { selectedId, selectedProperty } = useCloud();

  const [role, setRole] = useState(null); // admin/viewer/null
  const canEdit = role !== "viewer"; // owner/admin possono

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [bookings, setBookings] = useState([]);

  const [q, setQ] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  // carica ruolo + bookings quando cambia appartamento
  useEffect(() => {
    let mounted = true;

    async function load() {
      setMsg("");
      setLoading(true);
      try {
        if (!selectedId) return;

        const r = await fetchMyRoleForProperty(selectedId);
        if (mounted) setRole(r || "admin"); // se è owner senza membership, di solito RLS lo lascia, ma ruolo potrebbe essere null
        const data = await fetchBookings(selectedId);
        if (mounted) setBookings(data);
      } catch (e) {
        console.error(e);
        if (mounted) setMsg(e?.message || "Errore caricamento prenotazioni");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return bookings;
    return bookings.filter((b) => {
      const hay = `${b.guest} ${b.status} ${b.channel} ${b.check_in} ${b.check_out} ${b.email || ""} ${b.phone || ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [bookings, q]);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm());
    setMsg("");
  }

  function startEdit(b) {
    setEditingId(b.id);
    setForm({
      guest: b.guest || "",
      channel: b.channel || "Airbnb",
      status: b.status || "Confermata",
      check_in: b.check_in,
      check_out: b.check_out,
      people: b.people || 1,
      nationality: b.nationality || "EN",
      phone: b.phone || "",
      email: b.email || "",
      preferred_contact: b.preferred_contact || "WhatsApp",
      notes: b.notes || "",
    });
    setMsg("");
  }

  async function refresh() {
    const data = await fetchBookings(selectedId);
    setBookings(data);
  }

  async function submit() {
    setMsg("");

    if (!selectedId) return setMsg("Seleziona un appartamento.");
    if (!form.guest.trim()) return setMsg("Nome ospite obbligatorio.");
    if (!form.check_in || !form.check_out) return setMsg("Inserisci check-in e check-out.");

    if (form.check_out < form.check_in) return setMsg("Check-out non può essere prima del check-in.");

    if (!canEdit) return setMsg("Sei VIEWER: non puoi modificare.");

    setLoading(true);
    try {
      if (!editingId) {
        await createBooking(selectedId, form);
        setMsg("Prenotazione creata ✅");
      } else {
        await updateBooking(editingId, {
          guest: form.guest,
          channel: form.channel,
          status: form.status,
          check_in: form.check_in,
          check_out: form.check_out,
          people: Number(form.people || 1),
          nationality: form.nationality,
          phone: form.phone || null,
          email: form.email || null,
          preferred_contact: form.preferred_contact,
          notes: form.notes || null,
        });
        setMsg("Prenotazione aggiornata ✅");
      }

      await refresh();
      startNew();
    } catch (e) {
      console.error(e);
      setMsg(e?.message || "Errore salvataggio");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!canEdit) return setMsg("Sei VIEWER: non puoi eliminare.");
    const ok = confirm("Eliminare questa prenotazione?");
    if (!ok) return;

    setLoading(true);
    try {
      await deleteBooking(id);
      setMsg("Prenotazione eliminata ✅");
      await refresh();
      if (editingId === id) startNew();
    } catch (e) {
      setMsg(e?.message || "Errore eliminazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card
        title="Prenotazioni"
        subtitle={selectedProperty?.name ? `Appartamento: ${selectedProperty.name}` : "Gestione prenotazioni (cloud)"}
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={refresh} disabled={loading}>
              🔄 Aggiorna
            </Button>
            <Button variant="secondary" onClick={startNew} disabled={loading}>
              ➕ Nuova
            </Button>
          </div>
        }
      >
        <PropertyHeader title="Prenotazioni" />

        {role === "viewer" ? (
          <Banner variant="warn">
            Modalità <b>VIEWER</b>: puoi vedere le prenotazioni ma non modificarle.
          </Banner>
        ) : null}

        {msg ? (
          <Banner variant={msg.includes("✅") ? "info" : "danger"}>{msg}</Banner>
        ) : null}
      </Card>

      <div style={grid2}>
        <Card
          title={editingId ? "Modifica prenotazione" : "Nuova prenotazione"}
          subtitle={editingId ? `ID: ${editingId.slice(0, 8)}…` : "Inserisci i dati"}
          right={
            <Button onClick={submit} disabled={loading || !canEdit}>
              {editingId ? "Salva modifiche" : "Crea prenotazione"}
            </Button>
          }
        >
          <div style={{ display: "grid", gap: 12 }}>
            <Input
              label="Ospite (nome e cognome)"
              value={form.guest}
              onChange={(e) => setForm((f) => ({ ...f, guest: e.target.value }))}
              disabled={loading || !canEdit}
            />

            <div style={grid3}>
              <Select
                label="Canale"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                options={CHANNEL}
                disabled={loading || !canEdit}
              />

              <Select
                label="Stato"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                options={STATUS}
                disabled={loading || !canEdit}
              />

              <Input
                label="Persone"
                type="number"
                min="1"
                value={form.people}
                onChange={(e) => setForm((f) => ({ ...f, people: e.target.value }))}
                disabled={loading || !canEdit}
              />
            </div>

            <div style={grid2}>
              <Input
                label="Check-in"
                type="date"
                value={form.check_in}
                onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
                disabled={loading || !canEdit}
              />
              <Input
                label="Check-out"
                type="date"
                value={form.check_out}
                onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
                disabled={loading || !canEdit}
              />
            </div>

            <div style={grid3}>
              <Select
                label="Nazionalità (lingua messaggi)"
                value={form.nationality}
                onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                options={LANG}
                objectOptions
                disabled={loading || !canEdit}
              />

              <Select
                label="Contatto preferito"
                value={form.preferred_contact}
                onChange={(e) => setForm((f) => ({ ...f, preferred_contact: e.target.value }))}
                options={CONTACT}
                disabled={loading || !canEdit}
              />

              <div style={{ opacity: 0.75, fontSize: 12, paddingTop: 22 }}>
                Se mancano phone/email, in “Codici” mostreremo il banner rosso.
              </div>
            </div>

            <div style={grid2}>
              <Input
                label="Telefono (WhatsApp)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Es. +39 333 1234567"
                disabled={loading || !canEdit}
              />
              <Input
                label="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ospite@email.com"
                disabled={loading || !canEdit}
              />
            </div>

            <Textarea
              label="Note"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              disabled={loading || !canEdit}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {editingId ? (
                <Button variant="secondary" onClick={startNew} disabled={loading}>
                  Annulla modifica
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card
          title="Lista prenotazioni"
          subtitle={`${filtered.length} risultati`}
          right={
            <div style={{ width: 280 }}>
              <Input
                label="Cerca"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="nome, date, stato, canale…"
              />
            </div>
          }
        >
          {loading ? (
            <div style={{ opacity: 0.8 }}>Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Nessuna prenotazione.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((b) => (
                <div key={b.id} style={row}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>
                      {b.guest} <span style={{ opacity: 0.75 }}>• {b.status}</span>
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                      {b.check_in} → {b.check_out} • {b.channel} • {b.people} pax • {b.nationality || "EN"}
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      {b.phone ? `📱 ${b.phone}` : "📱 (manca)"}{" "}
                      {b.email ? `• ✉️ ${b.email}` : "• ✉️ (manca)"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Button variant="secondary" onClick={() => startEdit(b)} disabled={loading}>
                      Modifica
                    </Button>
                    <Button variant="danger" onClick={() => remove(b.id)} disabled={loading || !canEdit}>
                      Elimina
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 };

const row = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.14)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};
