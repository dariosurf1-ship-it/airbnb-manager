import { useMemo } from "react";
import { useCloud } from "../CloudProvider";

function toDateOnly(d) {
  // accetta stringhe ISO o Date
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function isTodayBetween(checkIn, checkOut) {
  const today = toDateOnly(new Date());
  const ci = toDateOnly(checkIn);
  const co = toDateOnly(checkOut);
  if (!today || !ci || !co) return null;

  // Occupato se today >= checkin e today < checkout
  return today.getTime() >= ci.getTime() && today.getTime() < co.getTime();
}

function computeStatusForProperty(propertyId, bookings) {
  // bookings attesi: [{ property_id, check_in, check_out, status }]
  // se non c'è niente, status = unknown
  if (!Array.isArray(bookings) || bookings.length === 0) return { key: "unknown", label: "—" };

  const list = bookings.filter((b) => b.property_id === propertyId);
  if (list.length === 0) return { key: "free", label: "🟢 Libero" };

  // se trovi almeno una prenotazione oggi, è occupato
  const occupied = list.some((b) => isTodayBetween(b.check_in, b.check_out));
  if (occupied) return { key: "busy", label: "🔴 Occupato" };

  return { key: "free", label: "🟢 Libero" };
}

export default function Dashboard() {
  const { properties = [], selectedId, setSelectedId, bookings = [] } = useCloud();

  const cards = useMemo(() => {
    return properties.map((p) => {
      const st = computeStatusForProperty(p.id, bookings);
      return { p, st };
    });
  }, [properties, bookings]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22 }}>Dashboard</h2>
        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Seleziona un appartamento dalla sidebar per lavorare nel contesto corretto.
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="panel">
          <div style={{ opacity: 0.85 }}>
            Nessun appartamento accessibile.
            <br />
            Se è il primo accesso, prova a ricaricare la pagina.
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {cards.map(({ p, st }) => {
            const isActive = p.id === selectedId;

            return (
              <div
                key={p.id}
                className="property-card"
                onClick={() => setSelectedId?.(p.id)}
                role="button"
                style={{
                  cursor: "pointer",
                  outline: isActive ? "1px solid rgba(37,99,235,0.35)" : "none",
                }}
                title="Clicca per selezionare"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>{p.name}</h3>
                  {isActive ? (
                    <span className="status-pill turnover">⭐ Attivo</span>
                  ) : (
                    <span className="status-pill">Seleziona</span>
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <span className={`status-pill ${st.key === "busy" ? "busy" : st.key === "free" ? "free" : ""}`}>
                    {st.label}
                  </span>
                </div>

                <div className="small-muted">
                  <div>
                    <b>property_id:</b>{" "}
                    <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                      {String(p.id).slice(0, 8)}…{String(p.id).slice(-6)}
                    </span>
                  </div>

                  {p.check_in_time || p.check_out_time ? (
                    <div style={{ marginTop: 6 }}>
                      <b>Check-in:</b> {p.check_in_time || "—"} • <b>Check-out:</b> {p.check_out_time || "—"}
                    </div>
                  ) : null}

                  {p.address ? (
                    <div style={{ marginTop: 6 }}>
                      <b>Indirizzo:</b> {p.address}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
