import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPassword } from "../lib/cloud";
import { Card, Button, Input, Banner } from "../ui";

function friendlyAuthError(err) {
  const msg = (err?.message || "").toLowerCase();

  // Network / Supabase down / timeout
  if (
    msg.includes("failed to fetch") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("timeout")
  ) {
    return "Supabase non raggiungibile (timeout o disservizio). Riprova tra qualche minuto.";
  }

  // Common Supabase auth messages
  if (msg.includes("invalid login credentials")) {
    return "Credenziali non valide: controlla email e password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email non confermata. Controlla la casella di posta e conferma l’account.";
  }
  if (msg.includes("user not found")) {
    return "Utente non trovato. Verifica l’email oppure crea l’utente in Supabase.";
  }
  if (msg.includes("too many requests")) {
    return "Troppi tentativi. Aspetta qualche minuto e riprova.";
  }

  return err?.message || "Login fallito.";
}

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
      await signInWithPassword(email.trim(), password);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(friendlyAuthError(e2));
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
            disabled={loading}
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
          />

          {err ? <Banner variant="danger">{err}</Banner> : null}

          <Button type="submit" disabled={loading || !email || !password}>
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
