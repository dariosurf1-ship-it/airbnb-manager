import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PropertyProvider } from "./context/PropertyContext";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PropertyProvider>
      <App />
    </PropertyProvider>
  </React.StrictMode>
);
