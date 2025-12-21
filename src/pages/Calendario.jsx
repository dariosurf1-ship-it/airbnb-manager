import { useMemo } from "react";
import PropertyHeader from "../components/PropertyHeader";
import { loadBookings, loadSelectedPropertyId } from "../lib/storage";

export default function Calendario() {
  const propertyId = loadSelectedPropertyId();

  const all = loadBookings();
  const bookings = useMemo(
    () => all.filter((b) => b.propertyId === propertyId),
    [all, propertyId]
  );

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => (a.checkIn || "").localeCompare(b.checkIn || ""));
  }, [bookings]);

  // “vista prossimi 7 giorni” (semplice e utile)
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in7ISO = in7.toISOString().slice(0, 10);

  const next7Days = useMemo(() => {
    return sorted.filter((b) => (b.checkIn || "") <= in7ISO && (b.checkOut || "") >= todayISO);
  }, [sorted, todayISO, in7ISO]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <PropertyHeader title="Calendario" />
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Prossimi 7 giorni</h3>
        {next7Days.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Nessuna prenotazione attiva nei prossimi 7 giorni.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {next7Days.map((b) => (
              <div key={b.id} style={row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>
                    {b.guest} • {b.channel} • {b.status}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    {b.checkIn} → {b.checkOut} • {(b.nationality || "EN").toUpperCase()} • {b.people || 1} persone
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    📞 {b.phone || "-"} • ✉️ {b.email || "-"} • Preferenza: {b.preferredContact || "WhatsApp"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Tutte le prenotazioni (lista)</h3>
        {sorted.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Nessuna prenotazione per questo appartamento.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sorted.map((b) => (
              <div key={b.id} style={row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>
                    {b.guest} • {b.channel} • {b.status}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    {b.checkIn} → {b.checkOut} • {(b.nationality || "EN").toUpperCase()} • {b.people || 1} persone
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    📞 {b.phone || "-"} • ✉️ {b.email || "-"} • Preferenza: {b.preferredContact || "WhatsApp"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const card = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 16,
  border: "1px solid rgba(255,255,255,0.10)",
};

const row = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
};
