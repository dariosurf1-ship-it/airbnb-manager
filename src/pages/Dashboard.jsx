// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCloud } from "../CloudProvider.jsx";
import { fetchBookings, toISODate, nightsBetween } from "../lib/data.js";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function daysInMonth(d = new Date()) {
  const e = endOfMonth(d);
  return e.getDate();
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameISO(aISO, bISO) {
  return aISO === bISO;
}

export default function Dashboard() {
  const { selectedId, role, selectedProperty } = useCloud();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // carico prenotazioni del mese corrente (più un buffer per calcoli arrivi/pulizie)
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!selectedId) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const now = new Date();
        const from = toISODate(addDays(startOfMonth(now), -7));
        const to = toISODate(addDays(endOfMonth(now), 7));

        const data = await fetchBookings(selectedId, {
          from,
          to,
          status: "all",
        });

        if (!mounted) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  // solo confermate per KPI
  const confirmed = useMemo(() => {
    return rows.filter((r) => (r.status || "").toLowerCase() === "confirmed");
  }, [rows]);

  // KPI mese corrente
  const kpi = useMemo(() => {
    const now = new Date();
    const mStartISO = toISODate(startOfMonth(now));
    const mEndISO = toISODate(addDays(endOfMonth(now), 1)); // end esclusivo

    // notti vendute nel mese (intersezione stay vs mese)
    let nightsSold = 0;

    for (const bk of confirmed) {
      const ci = bk.start_date || bk.check_in;
      const co = bk.end_date || bk.check_out;
      if (!ci || !co) continue;

      const a = new Date(ci);
      const b = new Date(co);

      const mA = new Date(mStartISO);
      const mB = new Date(mEndISO);

      const start = a < mA ? mA : a;
      const end = b > mB ? mB : b;

      const diff = (end - start) / 86400000;
      if (diff > 0) nightsSold += Math.round(diff);
    }

    const dim = daysInMonth(now);
    const rooms = Number(selectedProperty?.rooms || 1) || 1;
    const occupancy =
      dim > 0 ? Math.round((nightsSold / (dim * rooms)) * 100) : 0;

    return { nightsSold, occupancy };
  }, [confirmed, selectedProperty]);

  // Arrivi: oggi e prossimi 7 giorni
  const arrivals = useMemo(() => {
    const todayISO = toISODate(new Date());
    const next7ISO = toISODate(addDays(new Date(), 7));

    let today = 0;
    let next7 = 0;

    for (const bk of confirmed) {
      const ci = bk.start_date || bk.check_in;
      if (!ci) continue;

      if (isSameISO(ci, todayISO)) today += 1;
      if (ci > todayISO && ci <= next7ISO) next7 += 1;
    }

    return { today, next7 };
  }, [confirmed]);

  // Pulizie (oggi -> +7) basate su check-out nel periodo
  const cleaning = useMemo(() => {
    const todayISO = toISODate(new Date());
    const next7ISO = toISODate(addDays(new Date(), 7));

    let toDo = 0;

    for (const bk of confirmed) {
      const co = bk.end_date || bk.check_out;
      if (!co) continue;

      if (co >= todayISO && co <= next7ISO) toDo += 1;
    }

    return { toDo, inProgress: 0, done: 0 };
  }, [confirmed]);

  const nextStays = useMemo(() => {
    return (confirmed || [])
      .slice()
      .sort((a, b) => {
        const da = new Date(a.start_date || a.check_in || 0);
        const db = new Date(b.start_date || b.check_in || 0);
        return da - db;
      })
      .slice(0, 5);
  }, [confirmed]);

  return (
    <>
      <header className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>
            {selectedProperty?.name ? `${selectedProperty.name} · ` : ""}
            ruolo: <b>{role}</b>
          </p>
        </div>
        {loading ? <div style={{ opacity: 0.75 }}>Carico…</div> : null}
      </header>

      <div className="cardsRow">
        <div className="card">
          <div className="cardTitle">Occupazione (mese)</div>
          <div className="cardBig">{kpi.occupancy}%</div>
          <div className="cardSub" style={{ opacity: 0.8 }}>
            Basato su {kpi.nightsSold} notti vendute nel mese corrente.
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Notti vendute (mese)</div>
          <div className="cardBig">{kpi.nightsSold}</div>
          <div className="cardSub" style={{ opacity: 0.8 }}>
            Solo prenotazioni confermate.
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Arrivi</div>
          <div className="cardSub" style={{ marginTop: 8 }}>
            Oggi: <b>{arrivals.today}</b> · Prossimi 7 giorni:{" "}
            <b>{arrivals.next7}</b>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Stato pulizie (oggi → +7)</div>

        <div className="chipsRow" style={{ marginTop: 10 }}>
          <span className="chip">
            To do: <b>{cleaning.toDo}</b>
          </span>
          <span className="chip">
            In corso: <b>{cleaning.inProgress}</b>
          </span>
          <span className="chip">
            Fatte: <b>{cleaning.done}</b>
          </span>
        </div>

        <div className="cardSub" style={{ opacity: 0.8, marginTop: 10 }}>
          Calcolo automatico dalle date di check-out. Vai su <b>Operatività</b>{" "}
          per gestione avanzata.
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Prossimi soggiorni (preview)</div>

        <div style={{ marginTop: 10, opacity: 0.9 }}>
          {nextStays.map((bk) => {
            const ci = bk.start_date || bk.check_in;
            const co = bk.end_date || bk.check_out;
            const n = nightsBetween(ci, co);

            return (
              <div
                key={bk.id}
                style={{
                  padding: "8px 0",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <b>{bk.guest_name || bk.guest || "—"}</b>
                <span style={{ opacity: 0.8 }}>
                  {" "}
                  · {ci} → {co} · {n} notti
                </span>
              </div>
            );
          })}

          {confirmed.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.75 }}>
              Nessuna prenotazione confermata trovata.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
