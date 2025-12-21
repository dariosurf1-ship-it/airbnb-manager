import { Link, useLocation } from "react-router-dom";
import { useCloud } from "../CloudProvider";
import { Icon, Banner } from "../ui";

function isActivePath(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname.startsWith(to);
}

function aptGlow(i) {
  if (i === 0) return "0 0 0 1px rgba(0,255,150,0.25) inset, 0 0 26px rgba(0,255,150,0.12)";
  if (i === 1) return "0 0 0 1px rgba(70,140,255,0.25) inset, 0 0 26px rgba(70,140,255,0.12)";
  return "0 0 0 1px rgba(255,170,60,0.25) inset, 0 0 26px rgba(255,170,60,0.12)";
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { properties, selectedId, selectProperty, loading } = useCloud();

  return (
    <aside style={sidebar}>
      <div style={brand}>
        <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>
          <Icon name="home" /> Gestore Airbnb
        </div>
        <div style={{ opacity: 0.72, fontSize: 12 }}>Cloud • Supabase</div>
      </div>

      <div style={sectionTitle}>APPARTAMENTI</div>

      {loading ? <Banner>Caricamento appartamenti...</Banner> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {properties.map((p, idx) => {
          const active = p.id === selectedId;
          return (
            <div key={p.id} style={{ display: "grid", gap: 8 }}>
              <button
                onClick={() => selectProperty(p.id)}
                style={{
                  ...aptBtn,
                  ...(active ? aptBtnActive : null),
                  boxShadow: active ? aptGlow(idx) : "none",
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 950 }}>{p.name || "Appartamento"}</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    {active ? "Selezionato" : "Clicca per selezionare"}
                  </span>
                </div>
                {active ? <span style={pill}>ATTIVO</span> : null}
              </button>

              {active ? (
                <nav style={{ display: "grid", gap: 8, paddingLeft: 10 }}>
                  <SideLink to="/" icon="dashboard" label="Dashboard" active={isActivePath(pathname, "/")} />
                  <SideLink to="/prenotazioni" icon="bookings" label="Prenotazioni" active={isActivePath(pathname, "/prenotazioni")} />
                  <SideLink to="/calendario" icon="calendar" label="Calendario" active={isActivePath(pathname, "/calendario")} />
                  <SideLink to="/codici" icon="codes" label="Codici" active={isActivePath(pathname, "/codici")} />
                  <SideLink to="/operativita" icon="ops" label="Operatività" active={isActivePath(pathname, "/operativita")} />
                </nav>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={footerHint}>
        Ora gli appartamenti arrivano dal DB (cloud). Prossimo step: prenotazioni/task/codici.
      </div>
    </aside>
  );
}

function SideLink({ to, label, active, icon }) {
  return (
    <Link
      to={to}
      style={{
        ...navLink,
        ...(active ? navLinkActive : null),
      }}
    >
      <Icon name={icon} /> {label}
    </Link>
  );
}

/** styles */
const sidebar = {
  width: 300,
  minWidth: 300,
  padding: 16,
  borderRight: "1px solid rgba(255,255,255,0.10)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
  backdropFilter: "blur(12px)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
};

const brand = {
  padding: 14,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.16)",
  boxShadow: "0 18px 44px rgba(0,0,0,0.25)",
};

const sectionTitle = { fontSize: 12, letterSpacing: 1.2, opacity: 0.75 };

const aptBtn = {
  textAlign: "left",
  padding: "12px 12px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.14)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const aptBtnActive = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const pill = {
  fontSize: 11,
  fontWeight: 950,
  padding: "4px 9px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
};

const navLink = {
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.10)",
  color: "white",
  fontWeight: 900,
  opacity: 0.9,
};

const navLinkActive = {
  background: "rgba(47,111,237,0.18)",
  border: "1px solid rgba(47,111,237,0.40)",
  opacity: 1,
  boxShadow: "0 14px 34px rgba(47,111,237,0.12)",
};

const footerHint = {
  opacity: 0.65,
  fontSize: 12,
  paddingTop: 12,
  borderTop: "1px solid rgba(255,255,255,0.10)",
};
