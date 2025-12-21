import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPassword } from "../lib/cloud";
import { Card, Button, Input, Banner } from "../ui";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login fallito.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "50px auto" }}>
      <Card title="Accesso" subtitle="Login sicuro (Supabase Auth)">
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuo@email.it"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {err ? <Banner variant="danger">{err}</Banner> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Accesso..." : "Entra"}
          </Button>

          <div style={{ opacity: 0.7, fontSize: 12 }}>
            L’utente lo crei in Supabase → Authentication → Users.
          </div>
        </form>
      </Card>
    </div>
  );
}
