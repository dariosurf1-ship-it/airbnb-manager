import { Navigate, Route, Routes } from "react-router-dom";

import PropertyLayout from "./layouts/PropertyLayout.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Prenotazioni from "./pages/Prenotazioni.jsx";
import Calendario from "./pages/Calendario.jsx";
import Codici from "./pages/Codici.jsx";
import Operativita from "./pages/Operativita.jsx";
import Profilo from "./pages/Profilo.jsx";
import Accessi from "./pages/Accessi.jsx";
import Condivisione from "./pages/Condivisione.jsx";
import Login from "./pages/Login.jsx";

import { useCloud } from "./CloudProvider.jsx";

function PropertyLayoutKeyed() {
  // IMPORTANTISSIMO: quando cambia property, rimonta tutto -> niente pagine “vuote” finché non refreshi
  const { selectedId } = useCloud();
  return <PropertyLayout key={selectedId || "no-prop"} />;
}

export default function App() {
  const { loading, properties, selectedId, session } = useCloud();

  if (loading) {
    return (
      <div className="page page-center">
        <div className="card glass" style={{ maxWidth: 520, padding: 16 }}>
          <div className="h2">Caricamento…</div>
          <div className="muted">Sto preparando i tuoi appartamenti.</div>
        </div>
      </div>
    );
  }

  // se non loggato, vai al login (se il tuo Login gestisce già auth, ok)
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // se non hai proprietà
  if (!properties?.length) {
    return (
      <div className="page page-center">
        <div className="card glass" style={{ maxWidth: 520, padding: 16 }}>
          <div className="h2">Nessun appartamento</div>
          <div className="muted">
            Non risultano proprietà associate al tuo account.
          </div>
        </div>
      </div>
    );
  }

  // se non è selezionata una property, CloudProvider la imposta (ma qui gestiamo il caso)
  if (!selectedId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      {/* Tutte le pagine dentro PropertyLayout (che contiene sidebar/topbar ecc.) */}
      <Route path="/" element={<PropertyLayoutKeyed />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="prenotazioni" element={<Prenotazioni />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="codici" element={<Codici />} />
        <Route path="operativita" element={<Operativita />} />
        <Route path="profilo" element={<Profilo />} />
        <Route path="accessi" element={<Accessi />} />
        <Route path="condivisione" element={<Condivisione />} />

        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
