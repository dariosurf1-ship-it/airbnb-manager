import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import { useCloud } from "../CloudProvider.jsx";

export default function PropertyLayout() {
  const { selectedProperty, selectedId } = useCloud();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          <div className="content-header">
            <div>
              <div className="h1">{selectedProperty?.name || "Dashboard"}</div>
              <div className="muted">
                Property ID: {selectedId ? String(selectedId).slice(0, 8) + "…" : "-"}
              </div>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
