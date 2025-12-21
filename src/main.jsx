import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { CloudProvider } from "./CloudProvider.jsx";

// PWA
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CloudProvider>
      <App />
    </CloudProvider>
  </React.StrictMode>
);
