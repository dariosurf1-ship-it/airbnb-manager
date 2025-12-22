import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// IMPORT CSS (attenzione a maiuscole/minuscole!)
import "./styles.css";
import "./App.css";

import { CloudProvider } from "./CloudProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CloudProvider>
      <App />
    </CloudProvider>
  </React.StrictMode>
);
