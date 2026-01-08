import { NavLink } from "react-router-dom";
import { LogOut, Share2, Shield, User } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useCloud } from "../CloudProvider.jsx";

export default function Topbar() {
  const { selectedProperty } = useCloud();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="pill">
          {selectedProperty?.name || "Gestore Airbnb"}
        </div>
      </div>

      <div className="topbar-right">
        <NavLink className="btn btn-ghost" to="/profilo">
          <User size={16} /> Profilo
        </NavLink>
        <NavLink className="btn btn-ghost" to="/accessi">
          <Shield size={16} /> Accessi
        </NavLink>
        <NavLink className="btn btn-ghost" to="/condivisione">
          <Share2 size={16} /> Condivisione
        </NavLink>
        <button className="btn btn-primary" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
