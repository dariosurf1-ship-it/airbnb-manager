import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCloud } from "../CloudProvider";

const PAGES = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/prenotazioni", label: "Prenotazioni", icon: "🧾" },
  { path: "/calendario", label: "Calendario", icon: "🗓️" },
  { path: "/codici", label: "Codici", icon: "🔐" },
  { path: "/operativita", label: "Operatività", icon: "✅" },
];

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();

  const { properties = [], selectedId, setSelectedId } = useCloud();

  const active = useMemo(
    () => properties.find((p) => p.id === selectedId) || null,
    [properties, selectedId]
  );

  function go(path) {
    nav(path);
  }

  function onPickProperty(p) {
    setSelectedId?.(p.id);

    // UX: se scegli un appartamento e sei su /login o su route strane,
    // ti porto sulla dashboard.
    if (loc.pathname === "/login") go("/");
  }

  return (
    <aside className="sidebar">
      <h3>Appartamenti</h3>

      {properties.length === 0 ? (
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.4 }}>
          Non vedo appartamenti.
          <br />
          Se è il primo accesso, prova a ricaricare la pagina.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {properties.map((p) => {
            const isActive = p.id === selectedId;
            return (
              <div
                key={p.id}
                className={`property-item ${isActive ? "active" : ""}`}
                onClick={() => onPickProperty(p)}
                title={p.id}
                role="button"
              >
                <span style={{ fontSize: 16 }}>🏠</span>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>
                    {p.address ? p.address : `ID: ${String(p.id).slice(0, 8)}…`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Menu pagine: compare solo quando hai un appartamento selezionato */}
      {active ? (
        <div style={{ marginTop: 16 }}>
          <h3>Menu</h3>

          <div style={{ display: "grid", gap: 8 }}>
            {PAGES.map((p) => {
              const isHere = loc.pathname === p.path;
              return (
                <div
                  key={p.path}
                  className={`property-item ${isHere ? "active" : ""}`}
                  onClick={() => go(p.path)}
                  role="button"
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <div style={{ fontWeight: 900 }}>{p.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12, lineHeight: 1.35 }}>
            Attivo: <b>{active.name}</b>
            <br />
            property_id: <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
              {String(active.id).slice(0, 8)}…{String(active.id).slice(-6)}
            </span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
