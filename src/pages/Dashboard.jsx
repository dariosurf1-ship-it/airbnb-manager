import { useState } from "react";
import PropertyHeader from "../components/PropertyHeader";
import { useCloud } from "../CloudProvider";
import { updateProperty } from "../lib/cloud";
import { Card, Button, Input, Textarea, Banner } from "../ui";

export default function Dashboard() {
  const { selectedProperty, selectedId, properties, setProperties } = useCloud();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  if (!selectedProperty) {
    return (
      <Card title="Dashboard" subtitle="Nessun appartamento disponibile">
        <Banner variant="warn">
          Non vedo appartamenti. Se è il primo accesso, ricarica la pagina.
        </Banner>
      </Card>
    );
  }

  const p = selectedProperty;

  async function save(patch) {
    setMsg("");
    setSaving(true);
    try {
      const updated = await updateProperty(selectedId, patch);
      // aggiorna in memoria
      const next = properties.map((x) => (x.id === updated.id ? updated : x));
      setProperties(next);
      setMsg("Salvato ✅");
    } catch (e) {
      setMsg(e?.message || "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Dashboard" subtitle="Impostazioni appartamento (cloud)">
        <PropertyHeader title="Dashboard" />
        {msg ? <Banner variant={msg.includes("✅") ? "info" : "danger"}>{msg}</Banner> : null}
      </Card>

      <Card title="Impostazioni" subtitle="Questi dati entrano nei messaggi PIN e nella gestione">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Input
              label="Nome"
              value={p.name || ""}
              onChange={(e) => save({ name: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Indirizzo"
              value={p.address || ""}
              onChange={(e) => save({ address: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Wi-Fi (SSID)"
              value={p.wifi_name || ""}
              onChange={(e) => save({ wifi_name: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Wi-Fi password"
              value={p.wifi_password || ""}
              onChange={(e) => save({ wifi_password: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Check-in time"
              value={p.check_in_time || ""}
              onChange={(e) => save({ check_in_time: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Check-out time"
              value={p.check_out_time || ""}
              onChange={(e) => save({ check_out_time: e.target.value })}
              disabled={saving}
            />
            <Input
              label="House manual URL"
              value={p.house_manual_url || ""}
              onChange={(e) => save({ house_manual_url: e.target.value })}
              disabled={saving}
            />
          </div>

          <Textarea
            label="Note"
            value={p.notes || ""}
            onChange={(e) => save({ notes: e.target.value })}
            disabled={saving}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" disabled>
              Salvataggio automatico attivo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
