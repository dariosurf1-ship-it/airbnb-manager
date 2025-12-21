import { useMemo, useState } from "react";
import { useCloud } from "../CloudProvider";
import { supabase } from "../supabaseClient";
import { Card, Button, Banner, Input } from "../ui";

export default function Condivisione() {
  const { properties, selectedId } = useCloud();

  const [propertyId, setPropertyId] = useState(selectedId || "");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("viewer");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const property = useMemo(
    () => properties.find((p) => p.id === propertyId) || properties[0] || null,
    [properties, propertyId]
  );

  async function addMember() {
    setMsg("");
    const pid = propertyId || property?.id;
    const uid = userId.trim();

    if (!pid) return setMsg("Seleziona un appartamento.");
    if (!uid) return setMsg("Inserisci un User ID valido (UUID).");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
      return setMsg("User ID non sembra un UUID valido.");
    }

    setLoading(true);
    try {
      // Inserisce membership. RLS permette al proprietario dell’appartamento di farlo.
      const { error } = await supabase.from("memberships").insert([
        { property_id: pid, user_id: uid, role },
      ]);

      if (error) throw error;

      setMsg(`Condivisione completata ✅ (role: ${role})`);
      setUserId("");
    } catch (e) {
      // gestione errori comuni
      const m = e?.message || "Errore durante la condivisione.";
      if (m.toLowerCase().includes("duplicate")) {
        setMsg("Questo utente è già condiviso su questo appartamento (duplicato).");
      } else {
        setMsg(m);
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeMember() {
    setMsg("");
    const pid = propertyId || property?.id;
    const uid = userId.trim();
    if (!pid) return setMsg("Seleziona un appartamento.");
    if (!uid) return setMsg("Inserisci il User ID da rimuovere.");

    setLoading(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("property_id", pid)
        .eq("user_id", uid);

      if (error) throw error;
      setMsg("Accesso rimosso ✅");
      setUserId("");
    } catch (e) {
      setMsg(e?.message || "Errore durante la rimozione.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Condivisione" subtitle="Aggiungi o rimuovi accesso (viewer/admin)">
      <div style={{ display: "grid", gap: 12 }}>
        <Banner>
          Il tuo amico deve aprire <b>Profilo</b> e mandarti il suo <b>User ID</b>.
          Poi qui lo incolli e scegli <b>viewer</b> (sola lettura) o <b>admin</b>.
        </Banner>

        <div style={grid2}>
          <div>
            <div style={label}>Appartamento</div>
            <select
              style={input}
              value={propertyId || (property?.id || "")}
              onChange={(e) => setPropertyId(e.target.value)}
              disabled={loading}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={label}>Ruolo</div>
            <select
              style={input}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="viewer">viewer (sola lettura)</option>
              <option value="admin">admin (può modificare)</option>
            </select>
          </div>
        </div>

        <Input
          label="User ID (UUID) dell’utente"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="es: 3f1c7e1a-....-....-....-..........."
          disabled={loading}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={addMember} disabled={loading}>
            {loading ? "Salvo..." : "Condividi accesso"}
          </Button>

          <Button variant="danger" onClick={removeMember} disabled={loading}>
            {loading ? "..." : "Rimuovi accesso"}
          </Button>
        </div>

        {msg ? (
          <Banner variant={msg.includes("✅") ? "info" : "danger"}>{msg}</Banner>
        ) : null}
      </div>
    </Card>
  );
}

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const label = { marginBottom: 6, opacity: 0.85, fontWeight: 900, fontSize: 12 };

const input = {
  width: "100%",
  padding: 11,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.18)",
  color: "white",
};
