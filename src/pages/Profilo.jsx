import { useCloud } from "../CloudProvider";
import { Card, Button, Banner } from "../ui";

export default function Profilo() {
  const { session } = useCloud();

  if (!session) {
    return (
      <Card title="Profilo" subtitle="Non loggato">
        <Banner variant="warn">Devi fare login.</Banner>
      </Card>
    );
  }

  const userId = session.user.id;
  const email = session.user.email;

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiato ✅");
    } catch {
      alert("Copia manualmente.");
    }
  }

  return (
    <Card
      title="Profilo"
      subtitle="Questi dati servono per la condivisione"
      right={
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => copy(userId)}>Copia User ID</Button>
          <Button variant="secondary" onClick={() => copy(email)}>Copia Email</Button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        <Banner>
          Se vuoi farti aggiungere come <b>viewer</b> o <b>admin</b> su un appartamento, manda al proprietario il tuo <b>User ID</b>.
        </Banner>

        <div style={box}>
          <div style={label}>Email</div>
          <div style={value}>{email}</div>
        </div>

        <div style={box}>
          <div style={label}>User ID (UUID)</div>
          <div style={mono}>{userId}</div>
        </div>
      </div>
    </Card>
  );
}

const box = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.14)",
};

const label = { opacity: 0.75, fontWeight: 900, fontSize: 12, marginBottom: 6 };
const value = { fontWeight: 900 };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", opacity: 0.95 };
