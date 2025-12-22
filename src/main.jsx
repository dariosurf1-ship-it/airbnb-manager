import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles.css";   // CSS globale principale
// import "./App.css";   // <-- LASCIA COMMENTATO o rimuovi (spesso rompe il layout)

import { CloudProvider } from "./CloudProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CloudProvider>
      <App />
    </CloudProvider>
  </React.StrictMode>
);
