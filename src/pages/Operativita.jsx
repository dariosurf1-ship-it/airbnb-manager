import React, { useEffect, useMemo, useState } from "react";
import { useCloud } from "../CloudProvider.jsx";
import { fetchCleaning, toISODate, addDaysISO } from "../lib/data";

export default function Operativita() {
  const { selectedId } = useCloud();

  const today = useMemo(() => toISODate(new Date()), []);
  const in7 = useMemo(() => addDaysISO(today, 7), [today]);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!selectedId) return;
      setLoading(true);
      try {
        const data = await fetchCleaning(selectedId, { from: today, to: in7 });
        if (!mounted) return;
        setTasks(data);
      } catch {
        if (!mounted) return;
        setTasks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedId, today, in7]);

  return (
    <>
      <header className="pageHeader">
        <div>
          <h1>Operatività</h1>
          <p>Pulizie e task (oggi → +7)</p>
        </div>
        {loading ? <div style={{ opacity: 0.75 }}>Carico…</div> : null}
      </header>

      <div className="tableCard">
        <table className="table">
          <thead>
            <tr>
              <th>Giorno</th>
              <th>Stato</th>
              <th>Assegnato</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td><b>{t.day}</b></td>
                <td>
                  <span className={`pill ${
                    t.status === "done" ? "pillGreen" : t.status === "in_progress" ? "pillBlue" : "pillGray"
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td>{t.assignee || "—"}</td>
                <td style={{ opacity: 0.85 }}>{t.notes || "—"}</td>
              </tr>
            ))}
            {!tasks.length ? (
              <tr>
                <td colSpan={4} style={{ opacity: 0.75, padding: 16 }}>
                  Nessun task pulizie programmato.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
