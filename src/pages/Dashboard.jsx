import { useMemo } from "react";
import { useCloud } from "../CloudProvider";
import { Card } from "../ui";

function shortId(id) {
  if (!id) return "";
  return String(id).slice(0, 8) + "…";
}

function statusFromProperty(p) {
  // Se in futuro aggiungi un campo nel DB tipo p.is_occupied o p.status, qui lo usi.
  if (typeof p?.status === "string") return p.status;
  if (typeof p?.is_occupied === "boolean") return p.is_occupied ? "Occupato" : "Libero";
  return "—";
}

export default function Dashboard() {
  const { properties, selectedId, selectedProperty, selectProperty, loading } = useCloud();

  const cards = useMemo(() => properties || [], [properties]);

  return (
    <div style={s.wrap}>
      <div style={s.headerRow}>
        <div>
          <div style={s.h1}>Dashboard</div>
          <div style={s.h2}>
            Stai lavorando su{" "}
            <b>{selectedProperty?.name || "—"}</b>
            {selectedProperty?.id ? (
              <>
                {" "}
                • <span style={{ opacity: 0.8 }}>ID:</span> {shortId(selectedProperty.id)}
              </>
            ) : null}
          </div>
        </div>

        <div style={s.pill}>
          {loading ? "Caricamento…" : `${cards.length} appartamenti`}
        </div>
      </div>

      <div style={s.grid}>
        {loading ? (
          <Card title="Caricamento" subtitle="Recupero appartamenti dal cloud…">
            <div style={{ opacity: 0.8 }}>Attendi qualche secondo.</div>
          </Card>
        ) : cards.length === 0 ? (
          <Card title="Nessun appartamento" subtitle="Se è il primo accesso, ricarica la pagina.">
            <div style={{ opacity: 0.8 }}>
              Se continui a non vedere nulla, controlla le policy RLS e i permessi.
            </div>
          </Card>
        ) : (
          cards.map((p) => {
            const active = p.id === selectedId;
            const st = statusFromProperty(p);

            return (
              <div key={p.id} style={{ ...s.card, ...(active ? s.cardActive : null) }}>
                <div style={s.cardTop}>
                  <div style={{ minWidth: 0 }}>
                    <div style={s.cardTitle}>{p.name || "Appartamento"}</div>
                    <div style={s.cardSub}>
                      ID: <span style={{ opacity: 0.85 }}>{shortId(p.id)}</span>
                      {p.role ? (
                        <>
                          {" "}
                          • <span style={s.rolePill}>{p.role}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ ...s.badge, ...(st === "Occupato" ? s.badgeBusy : st === "Libero" ? s.badgeFree : null) }}>
                    {st}
                  </div>
                </div>

                <div style={s.cardBody}>
                  <div style={s.kpiRow}>
                    <div style={s.kpiBox}>
                      <div style={s.kpiLabel}>Check-in</div>
                      <div style={s.kpiValue}>{p.check_in_time || "—"}</div>
                    </div>
                    <div style={s.kpiBox}>
                      <div style={s.kpiLabel}>Check-out</div>
                      <div style={s.kpiValue}>{p.check_out_time || "—"}</div>
                    </div>
                  </div>

                  <button onClick={() => selectProperty(p.id)} style={{ ...s.selectBtn, ...(active ? s.selectBtnActive : null) }}>
                    {active ? "Selezionato" : "Seleziona"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { width: "100%" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-end",
    marginBottom: 14,
  },
  h1: { fontSize: 22, fontWeight: 850 },
  h2: { marginTop: 6, opacity: 0.8, fontSize: 13 },

  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.12)",
    fontSize: 12,
    opacity: 0.9,
    height: "fit-content",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  card: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    boxShadow: "0 22px 70px rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  cardActive: {
    boxShadow: "0 0 0 1px rgba(47,111,237,0.25) inset, 0 26px 80px rgba(0,0,0,0.28)",
  },
  cardTop: {
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  cardTitle: { fontWeight: 850, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardSub: { marginTop: 6, opacity: 0.75, fontSize: 12 },

  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  badgeFree: {
    background: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.22)",
  },
  badgeBusy: {
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  rolePill: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 11,
    textTransform: "lowercase",
  },

  cardBody: { padding: 16 },
  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 },
  kpiBox: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.10)",
  },
  kpiLabel: { fontSize: 12, opacity: 0.75 },
  kpiValue: { marginTop: 6, fontSize: 14, fontWeight: 800 },

  selectBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "var(--text)",
    fontWeight: 800,
    cursor: "pointer",
  },
  selectBtnActive: {
    background: "rgba(47,111,237,0.16)",
    boxShadow: "0 0 0 1px rgba(47,111,237,0.25) inset",
  },
};
