// src/pages/Calendario.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCloud } from "../CloudProvider.jsx";
import { fetchBookings, toISODate, addDaysISO } from "../lib/data";
import BookingModal from "../components/BookingModal";

// ---------- date utils ----------
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfWeek(d) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isoMonth(d) {
  return toISODate(d).slice(0, 7);
}
function isWithinStay(dayISO, startISO, endISO) {
  // "in casa" per i giorni tra start (incluso) e end (escluso)
  return !!dayISO && !!startISO && !!endISO && dayISO >= startISO && dayISO < endISO;
}

// Normalizza booking in modo robusto
function normBooking(b) {
  return {
    ...b,
    id: b?.id ?? crypto.randomUUID(),
    start_date: b?.start_date ?? b?.check_in ?? b?.checkIn ?? b?.from ?? "",
    end_date: b?.end_date ?? b?.check_out ?? b?.checkOut ?? b?.to ?? "",
    guest_name: b?.guest_name ?? b?.guest ?? b?.cliente ?? b?.ospite ?? "—",
    status: String(b?.status ?? b?.booking_status ?? b?.stato ?? "").trim(),
  };
}

export default function Calendario() {
  const { selectedId } = useCloud();

  const [view, setView] = useState("month"); // month | week
  const [cursor, setCursor] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);

  const range = useMemo(() => {
    if (view === "week") {
      const a = startOfWeek(cursor);
      const b = endOfWeek(cursor);
      return { from: toISODate(a), to: toISODate(b) };
    }
    const a = startOfMonth(cursor);
    const b = endOfMonth(cursor);
    return { from: toISODate(a), to: toISODate(b) };
  }, [view, cursor]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!selectedId) {
        setBookings([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchBookings(selectedId, {
          from: range.from,
          to: range.to,
          status: "all",
        });
        if (!mounted) return;
        setBookings((data || []).map(normBooking));
      } catch (e) {
        console.error("Calendario load error:", e);
        if (!mounted) return;
        setBookings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedId, range.from, range.to]);

  const title = useMemo(() => {
    const m = cursor.toLocaleString("it-IT", { month: "long", year: "numeric" });
    if (view === "week") {
      const a = startOfWeek(cursor);
      const b = endOfWeek(cursor);
      return `Settimana ${toISODate(a)} → ${toISODate(b)}`;
    }
    return m;
  }, [cursor, view]);

  const monthCells = useMemo(() => {
    if (view !== "month") return [];
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const gridStart = startOfWeek(start);
    const gridEnd = endOfWeek(end);

    const cells = [];
    let d = new Date(gridStart);
    while (d <= gridEnd) {
      cells.push(toISODate(d));
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [cursor, view]);

  const visibleDays = useMemo(() => {
    if (view === "month") return monthCells;
    return Array.from({ length: 7 }).map((_, i) => addDaysISO(range.from, i));
  }, [view, monthCells, range.from]);

  // indicizza per giorno: arr/dep/in
  const dayIndex = useMemo(() => {
    const map = new Map();
    for (const day of visibleDays) map.set(day, { arr: [], dep: [], inh: [] });

    const days = visibleDays;

    for (const raw of bookings) {
      const b = normBooking(raw);
      const s = b.start_date;
      const e = b.end_date;
      if (!s || !e) continue;

      if (!map.has(s)) map.set(s, { arr: [], dep: [], inh: [] });
      map.get(s).arr.push(b);

      if (!map.has(e)) map.set(e, { arr: [], dep: [], inh: [] });
      map.get(e).dep.push(b);

      // in casa solo per giorni visibili
      for (const day of days) {
        if (isWithinStay(day, s, e)) {
          if (!map.has(day)) map.set(day, { arr: [], dep: [], inh: [] });
          map.get(day).inh.push(b);
        }
      }
    }

    // ordina e pulisci
    for (const [k, box] of map.entries()) {
      box.arr.sort((a, b) => (a.guest_name || "").localeCompare(b.guest_name || ""));
      box.dep.sort((a, b) => (a.guest_name || "").localeCompare(b.guest_name || ""));
      box.inh.sort((a, b) => (a.guest_name || "").localeCompare(b.guest_name || ""));
      map.set(k, box);
    }

    return map;
  }, [bookings, visibleDays]);

  const prev = () => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCursor(d);
  };
  const next = () => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCursor(d);
  };

  const weekNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  // ---------- STILI INLINE (così la griglia NON si rompe) ----------
  const S = {
    header: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-end",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    headerLeft: { display: "grid", gap: 4 },
    headerRight: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },

    // griglia “compatta” per stare tutta nella pagina
    gridWrap: {
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(0,0,0,0.18)",
    },
    gridHead: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 0,
      borderBottom: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    },
    headCell: {
      padding: "10px 10px",
      fontWeight: 800,
      fontSize: 12,
      opacity: 0.9,
      borderRight: "1px solid rgba(255,255,255,0.06)",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 0,
    },
    cell: {
      minHeight: 96, // compatto
      padding: 8,
      borderRight: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "relative",
    },
    cellOut: {
      opacity: 0.45,
    },
    dayNum: {
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: 0.2,
    },
    counters: {
      display: "flex",
      gap: 6,
      marginTop: 6,
      flexWrap: "wrap",
    },
    counter: {
      fontSize: 11,
      fontWeight: 900,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      userSelect: "none",
    },
    cArr: { borderColor: "rgba(70,140,255,0.35)", background: "rgba(70,140,255,0.12)" },
    cDep: { borderColor: "rgba(255,120,120,0.35)", background: "rgba(255,120,120,0.12)" },
    cIn: { borderColor: "rgba(80,220,160,0.35)", background: "rgba(80,220,160,0.12)" },

    events: { display: "grid", gap: 6, marginTop: 8 },
    evt: {
      width: "100%",
      textAlign: "left",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      borderRadius: 10,
      padding: "6px 8px",
      fontSize: 12,
      cursor: "pointer",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    evtArr: { borderColor: "rgba(70,140,255,0.35)", background: "rgba(70,140,255,0.10)" },
    evtDep: { borderColor: "rgba(255,120,120,0.35)", background: "rgba(255,120,120,0.10)" },
    evtIn: { borderColor: "rgba(80,220,160,0.35)", background: "rgba(80,220,160,0.10)" },

    more: { opacity: 0.75, fontSize: 11, marginTop: 2 },

    // vista week tabella
    tableCard: {
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(0,0,0,0.18)",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      textAlign: "left",
      padding: 10,
      fontSize: 12,
      opacity: 0.85,
      borderBottom: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    },
    td: { padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "top" },
    pillBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      cursor: "pointer",
      marginRight: 6,
      marginBottom: 6,
      fontSize: 12,
      fontWeight: 700,
    },
  };

  return (
    <>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>Calendario</div>
          <div style={{ opacity: 0.8 }}>{title}</div>
        </div>

        <div style={S.headerRight}>
          <button className="btn" onClick={prev} type="button">
            ◀
          </button>
          <button className="btn" onClick={() => setCursor(new Date())} type="button">
            Oggi
          </button>
          <button className="btn" onClick={next} type="button">
            ▶
          </button>

          <select className="input" value={view} onChange={(e) => setView(e.target.value)}>
            <option value="month">Mese</option>
            <option value="week">Settimana</option>
          </select>
        </div>
      </div>

      {loading ? <div style={{ opacity: 0.75, marginBottom: 12 }}>Carico…</div> : null}

      {view === "month" ? (
        <div style={S.gridWrap}>
          <div style={S.gridHead}>
            {weekNames.map((x, idx) => (
              <div
                key={x}
                style={{
                  ...S.headCell,
                  borderRight: idx === 6 ? "none" : S.headCell.borderRight,
                }}
              >
                {x}
              </div>
            ))}
          </div>

          <div style={S.grid}>
            {monthCells.map((day) => {
              const box = dayIndex.get(day) || { arr: [], dep: [], inh: [] };
              const inMonth = day.slice(0, 7) === isoMonth(startOfMonth(cursor));
              const total = box.arr.length + box.dep.length + box.inh.length;

              return (
                <div key={day} style={{ ...S.cell, ...(inMonth ? null : S.cellOut) }}>
                  <div style={S.dayNum}>{day.slice(-2)}</div>

                  {/* ✅ CONTATORI SOLO SE > 0 */}
                  {total > 0 ? (
                    <div style={S.counters}>
                      {box.arr.length > 0 ? (
                        <span style={{ ...S.counter, ...S.cArr }} title="Arrivi">
                          Arr {box.arr.length}
                        </span>
                      ) : null}
                      {box.dep.length > 0 ? (
                        <span style={{ ...S.counter, ...S.cDep }} title="Partenze">
                          Par {box.dep.length}
                        </span>
                      ) : null}
                      {box.inh.length > 0 ? (
                        <span style={{ ...S.counter, ...S.cIn }} title="In casa">
                          In {box.inh.length}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* ✅ EVENTI NELLA CELLA, SOLO SE CI SONO */}
                  {total > 0 ? (
                    <div style={S.events}>
                      {box.arr.slice(0, 1).map((b) => (
                        <button
                          key={`arr-${b.id}`}
                          style={{ ...S.evt, ...S.evtArr }}
                          type="button"
                          onClick={() => setSelected(b)}
                          title={`Arrivo • ${b.guest_name}`}
                        >
                          Arr: {b.guest_name}
                        </button>
                      ))}
                      {box.dep.slice(0, 1).map((b) => (
                        <button
                          key={`dep-${b.id}`}
                          style={{ ...S.evt, ...S.evtDep }}
                          type="button"
                          onClick={() => setSelected(b)}
                          title={`Partenza • ${b.guest_name}`}
                        >
                          Par: {b.guest_name}
                        </button>
                      ))}
                      {box.inh.slice(0, 1).map((b) => (
                        <button
                          key={`inh-${b.id}`}
                          style={{ ...S.evt, ...S.evtIn }}
                          type="button"
                          onClick={() => setSelected(b)}
                          title={`In casa • ${b.guest_name}`}
                        >
                          In: {b.guest_name}
                        </button>
                      ))}

                      {total > 3 ? <div style={S.more}>+{total - 3}…</div> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Giorno</th>
                <th style={S.th}>Arrivi</th>
                <th style={S.th}>Partenze</th>
                <th style={S.th}>In casa</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDaysISO(range.from, i);
                const box = dayIndex.get(day) || { arr: [], dep: [], inh: [] };
                return (
                  <tr key={day}>
                    <td style={S.td}>
                      <b>{day}</b>
                    </td>
                    <td style={S.td}>
                      {box.arr.length > 0
                        ? box.arr.map((b) => (
                            <button
                              key={`a-${b.id}`}
                              style={S.pillBtn}
                              type="button"
                              onClick={() => setSelected(b)}
                            >
                              Arr: {b.guest_name}
                            </button>
                          ))
                        : null}
                    </td>
                    <td style={S.td}>
                      {box.dep.length > 0
                        ? box.dep.map((b) => (
                            <button
                              key={`d-${b.id}`}
                              style={S.pillBtn}
                              type="button"
                              onClick={() => setSelected(b)}
                            >
                              Par: {b.guest_name}
                            </button>
                          ))
                        : null}
                    </td>
                    <td style={S.td}>
                      {box.inh.length > 0
                        ? box.inh.map((b) => (
                            <button
                              key={`i-${b.id}`}
                              style={S.pillBtn}
                              type="button"
                              onClick={() => setSelected(b)}
                            >
                              In: {b.guest_name}
                            </button>
                          ))
                        : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BookingModal booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
