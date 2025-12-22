import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Prenotazioni from "./pages/Prenotazioni.jsx";
import Calendario from "./pages/Calendario.jsx";
import Codici from "./pages/Codici.jsx";
import Operativita from "./pages/Operativita.jsx";
import Profilo from "./pages/Profilo.jsx";
import Condivisione from "./pages/Condivisione.jsx";
import Accessi from "./pages/Accessi.jsx";

import Sidebar from "./components/Sidebar.jsx";

function Layout() {
  return (
    <div className="appShell">
      {/* 🔴 TEST: se non lo vedi, non stai eseguendo questo file */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 999999,
          background: "red",
          color: "white",
          padding: "8px 10px",
          borderRadius: 10,
          fontWeight: 800,
          letterSpacing: 0.3,
        }}
      >
        LAYOUT OK
      </div>

      <div className="sidebar">
        <Sidebar />
      </div>

      <main className="main">
        <div className="mainInner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prenotazioni" element={<Prenotazioni />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/codici" element={<Codici />} />
          <Route path="/operativita" element={<Operativita />} />
          <Route path="/profilo" element={<Profilo />} />
          <Route path="/condivisione" element={<Condivisione />} />
          <Route path="/accessi" element={<Accessi />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
