import { useCloud } from "../CloudProvider";

export default function PropertyHeader({ title }) {
  const { selectedProperty } = useCloud();

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>
          {title}
        </h2>

        <span style={badge}>
          {selectedProperty?.name || "Appartamento"}
        </span>
      </div>

      {selectedProperty?.address ? (
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          {selectedProperty.address}
        </div>
      ) : (
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Stai lavorando sull’appartamento selezionato.
        </div>
      )}
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
