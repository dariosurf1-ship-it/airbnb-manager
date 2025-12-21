import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Prenotazioni from "./pages/Prenotazioni";
import Calendario from "./pages/Calendario";
import Codici from "./pages/Codici";
import Operativita from "./pages/Operativita";

import Profilo from "./pages/Profilo";
import Condivisione from "./pages/Condivisione";
import Accessi from "./pages/Accessi";

import { useCloud } from "./CloudProvider";
import { signOut } from "./lib/cloud";
import { Button } from "./ui";

function Protected({ children }) {
  const { session, loading } = useCloud();
  if (loading) return <div style={{ padding: 20, opacity: 0.85 }}>Caricamento...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function TopBar() {
  const { session } = useCloud();
  const nav = useNavigate();
  const loc = useLocation();

  if (!session) return null;

  const is = (p) => loc.pathname === p;

  return (
    <div style={topBar}>
      <div style={{ opacity: 0.75, fontSize: 12 }}>
        Logged as: <b>{session.user.email}</b>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => nav("/profilo")} style={is("/profilo") ? activeBtn : null}>
          Profilo
        </Button>

        <Button variant="secondary" onClick={() => nav("/accessi")} style={is("/accessi") ? activeBtn : null}>
          Accessi
        </Button>

        <Button variant="secondary" onClick={() => nav("/condivisione")} style={is("/condivisione") ? activeBtn : null}>
          Condivisione
        </Button>

        <Button
          variant="secondary"
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const { session } = useCloud();

  return (
    <BrowserRouter>
      <div style={appShell}>
        {session ? <Sidebar /> : null}

        <main style={main}>
          <TopBar />

          <div style={contentWrap}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/prenotazioni" element={<Protected><Prenotazioni /></Protected>} />
              <Route path="/calendario" element={<Protected><Calendario /></Protected>} />
              <Route path="/codici" element={<Protected><Codici /></Protected>} />
              <Route path="/operativita" element={<Protected><Operativita /></Protected>} />

              <Route path="/profilo" element={<Protected><Profilo /></Protected>} />
              <Route path="/accessi" element={<Protected><Accessi /></Protected>} />
              <Route path="/condivisione" element={<Protected><Condivisione /></Protected>} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

const appShell = { minHeight: "100vh", display: "flex", color: "var(--text)" };
const main = { flex: 1, padding: 22, maxWidth: 1280, width: "100%" };

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 14,
};

const activeBtn = {
  boxShadow: "0 0 0 1px rgba(47,111,237,0.35) inset, 0 16px 40px rgba(47,111,237,0.12)",
};

const contentWrap = {
  width: "100%",
  borderRadius: 22,
  padding: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
  backdropFilter: "blur(10px)",
};
