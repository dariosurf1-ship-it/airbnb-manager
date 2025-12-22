import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

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
  const cloud = useCloud();
  const session = cloud?.session;
  const loading = cloud?.loading;

  if (loading) return <div style={{ padding: 20, opacity: 0.85 }}>Caricamento...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function TopBar() {
  const cloud = useCloud();
  const session = cloud?.session;

  // ✅ anti-crash: se non esistono, non rompiamo nulla
  const properties = Array.isArray(cloud?.properties) ? cloud.properties : [];
  const selectedId = cloud?.selectedId ?? cloud?.activePropertyId ?? null;

  const nav = useNavigate();
  const loc = useLocation();

  if (!session) return null;

  const is = (p) => loc.pathname === p;
  const active = selectedId ? properties.find((p) => p.id === selectedId) : null;

  return (
    <div className="topbar">
      <div className="left">
        <h1>Airbnb Manager</h1>
        <div className="hint">
          {active ? (
            <>
              Stai lavorando su <b>{active.name}</b>
            </>
          ) : (
            <>Seleziona un appartamento dalla sidebar.</>
          )}
          {" "}• Logged as: <b>{session.user.email}</b>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
  const cloud = useCloud();
  const session = cloud?.session;

  return (
    <BrowserRouter>
      <div className="app-shell">
        {session ? <Sidebar /> : null}

        <main className="main">
          <TopBar />

          <div className="panel">
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

const activeBtn = {
  boxShadow: "0 0 0 1px rgba(47,111,237,0.35) inset, 0 16px 40px rgba(47,111,237,0.12)",
};
