import { useMemo, useState } from "react";
import PropertyHeader from "../components/PropertyHeader";
import {
  loadBookings,
  loadTasks,
  saveTasks,
  loadSelectedPropertyId,
} from "../lib/storage";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyTask(today, propertyId) {
  return {
    title: "",
    type: "Pulizia",
    dueDate: today,
    status: "Da fare",
    bookingId: "",
    notes: "",
    propertyId,
  };
}

export default function Operativita() {
  const propertyId = loadSelectedPropertyId();

  const allBookings = loadBookings();
  const bookings = useMemo(
    () => allBookings.filter((b) => b.propertyId === propertyId),
    [allBookings, propertyId]
  );

  const [tasks, setTasks] = useState(loadTasks);

  const tasksForProperty = useMemo(
    () => tasks.filter((t) => t.propertyId === propertyId),
    [tasks, propertyId]
  );

  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === "Confermata"),
    [bookings]
  );

  const today = todayISO();
  const [form, setForm] = useState(emptyTask(today, propertyId));

  const arrivalsToday = useMemo(
    () => confirmed.filter((b) => b.checkIn === today),
    [confirmed, today]
  );

  const departuresToday = useMemo(
    () => confirmed.filter((b) => b.checkOut === today),
    [confirmed, today]
  );

  const urgent = useMemo(() => {
    return [...tasksForProperty]
      .filter((t) => t.status !== "Fatto")
      .filter((t) => (t.dueDate || "") <= today)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  }, [tasksForProperty, today]);

  function addTask() {
    if (!form.title || !form.dueDate) return alert("Compila Titolo e Scadenza");
    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...form,
      propertyId,
    };
    const next = [item, ...tasks];
    setTasks(next);
    saveTasks(next);
    setForm(emptyTask(today, propertyId));
  }

  function updateTask(id, patch) {
    const next = tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    );
    setTasks(next);
    saveTasks(next);
  }

  function removeTask(id) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    saveTasks(next);
  }

  function bookingLabel(bookingId) {
    const b = confirmed.find((x) => x.id === bookingId);
    if (!b) return "";
    return `${b.guest} (${b.checkIn}→${b.checkOut})`;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <PropertyHeader title="Operatività" />

        <div style={grid3}>
          <MiniBox title="Arrivi di oggi" items={arrivalsToday} empty="Nessun arrivo oggi." mode="booking" />
          <MiniBox title="Partenze di oggi" items={departuresToday} empty="Nessuna partenza oggi." mode="booking" />
          <MiniBox title="Task urgenti" items={urgent} empty="Nessun task urgente." mode="task" />
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Crea task</h3>

        <div style={grid2}>
          <Field label="Titolo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={["Pulizia", "Manutenzione", "Nota interna"]}
          />
          <Field
            label="Scadenza"
            type="date"
            value={form.dueDate}
            onChange={(v) => setForm({ ...form, dueDate: v })}
          />
          <Select
            label="Stato"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={["Da fare", "In corso", "Fatto"]}
          />
          <Select
            label="Collega a prenotazione (opz.)"
            value={form.bookingId}
            onChange={(v) => setForm({ ...form, bookingId: v })}
            options={[
              { v: "", l: "— Nessuna —" },
              ...confirmed.map((b) => ({ v: b.id, l: `${b.guest} • ${b.checkIn}→${b.checkOut}` })),
            ]}
            objectOptions
          />
        </div>

        <label style={label}>Note</label>
        <textarea
          style={{ ...input, minHeight: 90 }}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <button style={btn} onClick={addTask}>Aggiungi task</button>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Task (appartamento selezionato)</h3>

        {tasksForProperty.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Nessun task.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {[...tasksForProperty]
              .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
              .map((t) => (
                <div key={t.id} style={row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {t.type} • {t.title}{" "}
                      <span style={{ opacity: 0.75 }}>• {t.dueDate || "-"}</span>
                    </div>

                    {t.bookingId ? (
                      <div style={{ opacity: 0.85, marginTop: 4 }}>🔗 {bookingLabel(t.bookingId)}</div>
                    ) : null}

                    {t.notes ? (
                      <div style={{ opacity: 0.75, marginTop: 6 }}>{t.notes}</div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <select
                      style={selectMini}
                      value={t.status}
                      onChange={(e) => updateTask(t.id, { status: e.target.value })}
                    >
                      <option>Da fare</option>
                      <option>In corso</option>
                      <option>Fatto</option>
                    </select>

                    <button style={dangerBtn} onClick={() => removeTask(t.id)}>Elimina</button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBox({ title, items, empty, mode }) {
  return (
    <div style={miniCard}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ opacity: 0.75 }}>{empty}</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.slice(0, 5).map((x) =>
            mode === "task" ? (
              <div key={x.id} style={miniRow}>
                <div style={{ fontWeight: 800 }}>{x.type}: {x.title}</div>
                <div style={{ opacity: 0.75 }}>{x.dueDate} • {x.status}</div>
              </div>
            ) : (
              <div key={x.id} style={miniRow}>
                <div style={{ fontWeight: 800 }}>{x.guest}</div>
                <div style={{ opacity: 0.75 }}>
                  {x.checkIn} → {x.checkOut} • {x.channel}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label: l, value, onChange, type = "text" }) {
  return (
    <div>
      <div style={label}>{l}</div>
      <input style={input} value={value} type={type} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Select({ label: l, value, onChange, options, objectOptions = false }) {
  return (
    <div>
      <div style={label}>{l}</div>
      <select style={input} value={value} onChange={(e) => onChange(e.target.value)}>
        {objectOptions
          ? options.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))
          : options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
      </select>
    </div>
  );
}

/** styles */
const card = { background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.10)" };
const miniCard = { background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 12, border: "1px solid rgba(255,255,255,0.10)" };
const row = { display: "flex", gap: 12, alignItems: "flex-start", padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.20)" };
const miniRow = { padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.18)" };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 };
const label = { marginBottom: 6, opacity: 0.9 };
const input = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "white" };
const selectMini = { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "white" };
const btn = { marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "0", background: "#2f6fed", color: "white", cursor: "pointer" };
const dangerBtn = { padding: "10px 12px", borderRadius: 12, border: "0", background: "rgba(255,80,80,0.25)", color: "white", cursor: "pointer" };
