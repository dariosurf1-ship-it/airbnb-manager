import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { useCloud } from "../CloudProvider.jsx";

export default function Sidebar() {
  const { properties, selectedId, switchProperty } = useCloud();

  const menu = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/prenotazioni", label: "Prenotazioni", icon: NotebookPen },
      { to: "/calendario", label: "Calendario", icon: CalendarDays },
      { to: "/codici", label: "Codici", icon: KeyRound },
      { to: "/operativita", label: "Operatività", icon: ListChecks },
    ],
    []
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-title">Gestore Airbnb</div>
        <div className="brand-subtitle">Cloud · Supabase</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Appartamenti</div>

        <div className="property-list">
          {(properties || []).map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                className={`property-item ${active ? "active" : ""}`}
                onClick={() => switchProperty(p.id)}
                type="button"
              >
                <div className="property-name">{p.name || "Appartamento"}</div>
                <div className="property-meta">
                  ID: {String(p.id).slice(0, 8)}…
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Menu</div>

        <nav className="nav">
          {menu.map((m) => {
            const Icon = m.icon;
            return (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                end
              >
                <Icon size={18} />
                <span>{m.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="muted">
          Property: <b>{selectedId ? String(selectedId).slice(0, 8) + "…" : "-"}</b>
        </div>
      </div>
    </aside>
  );
}
