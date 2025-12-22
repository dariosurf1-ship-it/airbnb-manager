import { useMemo } from "react";
import { useCloud } from "../CloudProvider";

function toDateOnly(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function isTodayBetween(checkIn, checkOut) {
  const today = toDateOnly(new Date());
  const ci = toDateOnly(checkIn);
  const co = toDateOnly(checkOut);
  if (!today || !ci || !co) return null;
  return today.getTime() >= ci.getTime() && today.getTime() < co.getTime();
}

function computeStatusForProperty(propertyId, bookings) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return { key: "turnover", label: "— Stato non disponibile" };
  }

  const list = bookings.filter((b) => b.property_id === propertyId);
  if (list.length === 0) return { key: "free", label: "🟢 Libero" };

  const occupied = list.some((b) => isTodayBetween(b.check_in, b.check_out));
  if (occupied) return { key: "busy", label: "🔴 Occupato" };

  return { key: "free", label: "🟢 Libero" };
}

export default function Dashboard() {
  const { properties = [], selectedId, setSelectedId, bookings = [] } = useCloud();

  const active = useMemo(
    () => properties.find((p) => p.id === selectedId) || null,
    [properties, selectedId]
  );

  const cards = useMemo(() => {
    return properties.map((p) => ({ p, st: computeStatusForProperty(p.id, bookings) }));
  }, [properties, bookings]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="left">
          <h1>Dashboard</h1>
          <div className="hint">
            {active ? (
              <>
                Stai lavorando su <b>{active.name}</b>
              </>
            ) : (
              <>Seleziona un appartamento per iniziare.</>
            )}
          </div>
        </div>

        <div className="kpi">
          <div className="pill">
            🏠 Appartamenti <strong>{properties.length}</strong>
          </div>
          <button
            className="btn"
            onClick={() => {
              if (active?.id) {
                navigator.clipboard
                  .writeText(active.id)
                  .then(() => alert("property_id copiato ✅"))
                  .catch(() => alert("Copia manualmente."));
              } else {
                alert("Seleziona un appartamento prima.");
              }
            }}
          >
            📋 Copia property_id
          </button>
        </div>
      </div>

      {/* GRID */}
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
                title="Clicca per selezionare"
                style={{ cursor: "pointer" }}
              >
                <div className="card-head">
                  <div className="card-title">
                    <h3>{p.name}</h3>
                    <div className="addr">{p.address ? p.address : "—"}</div>
                  </div>

                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <span className={`status-pill ${st.key}`}>{st.label}</span>
                    {isActive ? <span className="status-pill active">⭐ Attivo</span> : null}
                  </div>
                </div>

                <div className="meta">
                  <div className="row">
                    <span>
                      <b>Check-in</b>
                    </span>
                    <span>{p.check_in_time || "—"}</span>
                  </div>
                  <div className="row">
                    <span>
                      <b>Check-out</b>
                    </span>
                    <span>{p.check_out_time || "—"}</span>
                  </div>
                  <div className="row">
                    <span>
                      <b>property_id</b>
                    </span>
                    <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                      {String(p.id).slice(0, 8)}…{String(p.id).slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
