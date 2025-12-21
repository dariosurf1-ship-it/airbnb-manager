import { useCloud } from "../CloudProvider";
import { Button } from "../ui";

export default function PropertyHeader({ title }) {
  const { selectedProperty } = useCloud();

  const pid = selectedProperty?.id || "";

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiato ✅");
    } catch {
      alert("Impossibile copiare. Copia manualmente.");
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>{title}</h2>

        <span style={badge}>{selectedProperty?.name || "Appartamento"}</span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
        <div style={{ opacity: 0.78 }}>
          <b>property_id:</b>{" "}
          <span style={mono}>{pid ? `${pid.slice(0, 8)}…${pid.slice(-6)}` : "-"}</span>
        </div>

        {pid ? (
          <Button variant="secondary" onClick={() => copy(pid)}>
            Copia ID
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const badge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 11px",
  borderRadius: 999,
  fontWeight: 950,
  fontSize: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
};

const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  opacity: 0.95,
};
