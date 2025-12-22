import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCloud } from "../CloudProvider";

function shortId(id) {
  if (!id) return "";
  return String(id).slice(0, 8) + "…";
}

export default function Sidebar() {
  const { properties, selectedId, selectProperty, session, loading } = useCloud();
  const nav = useNavigate();
  const loc = useLocation();

  const menu = useMemo(
    () => [
      { label: "Dashboard", path: "/", icon: "📊" },
      { label: "Prenotazioni", path: "/prenotazioni", icon: "🗓️" },
      { label: "Calendario", path: "/calendario", icon: "📅" },
      { label: "Codici", path: "/codici", icon: "🔑" },
      { label: "Operatività", path: "/operativita", icon: "✅" },
    ],
    []
  );

  const isActivePath = (p) => loc.pathname === p;

  // Se non loggato, non mostrare nulla (ma la shell resta coerente)
  if (!session) return null;

  return (
    // ✅ NON usare <aside> qui (lo fa già la shell)
    <div style={s.container}>
      <div style={s.brand} onClick={() => nav("/")} role="button" tabIndex={0}>
        <div style={s.logo}>🏠</div>
        <div>
          <div style={s.title}>Gestore Airbnb</div>
          <div style={s.sub}>Cloud • Supabase</div>
        </div>
      </div>

      <div style={s.sectionTitle}>APPARTAMENTI</div>

      <div style={s.propsWrap}>
        {loading ? (
          <div style={s.muted}>Carico appartamenti…</div>
        ) : properties?.length ? (
          properties.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => selectProperty(p.id)}
                style={{ ...s.propBtn, ...(active ? s.propBtnActive : null) }}
                title={p.id}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ ...s.dot, ...(active ? s.dotActive : null) }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={s.propName}>{p.name || "Appartamento"}</div>
                    <div style={s.propMeta}>
                      ID: <span style={{ opacity: 0.85 }}>{shortId(p.id)}</span>
                      {p.role ? (
                        <>
                          {" "}
                          • <span style={s.rolePill}>{p.role}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div style={s.chev}>›</div>
              </button>
            );
          })
        ) : (
          <div style={s.muted}>Nessun appartamento disponibile.</div>
        )}
      </div>

      <div style={s.sectionTitle}>MENU</div>

      <nav style={s.nav}>
        {menu.map((m) => {
          const active = isActivePath(m.path);
          return (
            <button
              key={m.path}
              onClick={() => nav(m.path)}
              style={{ ...s.navBtn, ...(active ? s.navBtnActive : null) }}
            >
              <span style={s.navIcon}>{m.icon}</span>
              <span style={s.navLabel}>{m.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={s.footer}>
        <div style={s.footerLine}>
          Logged as: <b style={{ marginLeft: 6 }}>{session.user.email}</b>
        </div>
        <div style={{ ...s.footerLine, opacity: 0.7 }}>
          Selezionato:{" "}
          <b style={{ marginLeft: 6 }}>
            {properties?.find((p) => p.id === selectedId)?.name || "—"}
          </b>
        </div>
      </div>
    </div>
  );
}

const s = {
  // ✅ SOLO padding + layout interno. NIENTE width/sticky/minHeight qui.
  container: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.12)",
    boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
    cursor: "pointer",
    userSelect: "none",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(47,111,237,0.30), rgba(16,185,129,0.20))",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 20,
  },
  title: { fontWeight: 800, letterSpacing: 0.2 },
  sub: { opacity: 0.7, fontSize: 12, marginTop: 2 },

  sectionTitle: { marginTop: 16, marginBottom: 10, opacity: 0.75, fontSize: 12, letterSpacing: 1 },

  propsWrap: { display: "grid", gap: 10 },
  muted: { opacity: 0.7, fontSize: 13, padding: "6px 2px" },

  propBtn: {
    width: "100%",
    textAlign: "left",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "var(--text)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  propBtnActive: {
    background: "linear-gradient(135deg, rgba(47,111,237,0.18), rgba(16,185,129,0.10))",
    boxShadow: "0 0 0 1px rgba(47,111,237,0.25) inset, 0 18px 60px rgba(0,0,0,0.25)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.25)",
    boxShadow: "0 0 0 3px rgba(255,255,255,0.04)",
    flex: "0 0 auto",
  },
  dotActive: {
    background: "rgba(16,185,129,0.95)",
    boxShadow: "0 0 0 3px rgba(16,185,129,0.15)",
  },
  propName: { fontWeight: 750, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  propMeta: { opacity: 0.75, fontSize: 12, marginTop: 4 },
  rolePill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 11,
    textTransform: "lowercase",
  },
  chev: { opacity: 0.5, fontSize: 18 },

  nav: { display: "grid", gap: 10 },
  navBtn: {
    width: "100%",
    textAlign: "left",
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  navBtnActive: {
    background: "rgba(47,111,237,0.14)",
    boxShadow: "0 0 0 1px rgba(47,111,237,0.25) inset",
  },
  navIcon: { width: 22, textAlign: "center" },
  navLabel: { fontWeight: 650 },

  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    opacity: 0.9,
  },
  footerLine: { fontSize: 12, opacity: 0.85, marginTop: 6 },
};
