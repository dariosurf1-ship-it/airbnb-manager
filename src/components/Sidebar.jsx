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

function roleBadgeClass(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "viewer") return "viewer";
  return "editor";
}

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();

  const { properties = [], selectedId, setSelectedId, myRolesByProperty = {} } = useCloud();

  const active = useMemo(
    () => properties.find((p) => p.id === selectedId) || null,
    [properties, selectedId]
  );

  function go(path) {
    nav(path);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">🏡</div>
        <div className="title">
          <b>Airbnb Manager</b>
          <span>Gestione appartamenti</span>
        </div>
      </div>

      <h3>Appartamenti</h3>

      {properties.length === 0 ? (
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.4 }}>
          Non vedo appartamenti.
          <br />
          Se è il primo accesso, prova a ricaricare la pagina.
        </div>
      ) : (
        <div className="list">
          {properties.map((p) => {
            const isActive = p.id === selectedId;
            const role = myRolesByProperty?.[p.id] || "editor";

            return (
              <div
                key={p.id}
                className={`item ${isActive ? "active" : ""}`}
                onClick={() => setSelectedId?.(p.id)}
                role="button"
                title={p.id}
              >
                <span style={{ fontSize: 16 }}>🏠</span>
                <div style={{ display: "grid" }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div className="sub">{p.address ? p.address : `ID: ${String(p.id).slice(0, 8)}…`}</div>
                </div>

                <span className={`badge ${roleBadgeClass(role)}`}>{role}</span>
              </div>
            );
          })}
        </div>
      )}

      {active ? (
        <div style={{ marginTop: 14 }}>
          <h3>Menu</h3>

          <div className="list">
            {PAGES.map((p) => {
              const isHere = loc.pathname === p.path;
              return (
                <div
                  key={p.path}
                  className={`item ${isHere ? "active" : ""}`}
                  onClick={() => go(p.path)}
                  role="button"
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <div style={{ fontWeight: 900 }}>{p.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
