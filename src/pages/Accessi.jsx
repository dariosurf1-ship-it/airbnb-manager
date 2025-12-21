import { useEffect, useMemo, useState } from "react";
import PropertyHeader from "../components/PropertyHeader";
import { useCloud } from "../CloudProvider";
import {
  fetchMembers,
  addMember,
  removeMember,
  fetchMyRoleForProperty,
} from "../lib/cloud";
import { Card, Button, Input, Select, Banner } from "../ui";

const ROLE_OPTIONS = ["viewer", "admin"];

function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || "");
}

export default function Accessi() {
  const { selectedId, session } = useCloud();

  const [myRole, setMyRole] = useState(null);
  const canManage = myRole !== "viewer";

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("viewer");

  const me = session?.user?.id;

  const membersWithMe = useMemo(() => {
    return (members || []).map((m) => ({ ...m, isMe: m.user_id === me }));
  }, [members, me]);

  async function load() {
    if (!selectedId) return;
    setLoading(true);
    setMsg("");
    try {
      const r = await fetchMyRoleForProperty(selectedId);
      setMyRole(r || "admin"); // owner spesso risulta null: consideriamolo admin
      const list = await fetchMembers(selectedId);
      setMembers(list);
    } catch (e) {
      setMsg(e?.message || "Errore caricamento accessi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function onAdd() {
    setMsg("");
    const uid = userId.trim();

    if (!selectedId) return setMsg("Seleziona un appartamento.");
    if (!uid) return setMsg("Inserisci un User ID.");
    if (!isUUID(uid)) return setMsg("User ID non valido (deve essere un UUID).");
    if (!canManage) return setMsg("Sei VIEWER: non puoi gestire accessi.");

    setLoading(true);
    try {
      await addMember(selectedId, uid, role);
      setMsg("Accesso aggiunto ✅");
      setUserId("");
      await load();
    } catch (e) {
      const t = String(e?.message || "Errore aggiunta");
      if (t.toLowerCase().includes("duplicate")) {
        setMsg("Questo utente ha già un accesso su questo appartamento.");
      } else {
        setMsg(t);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(uid) {
    setMsg("");
    if (!canManage) return setMsg("Sei VIEWER: non puoi gestire accessi.");
    const ok = confirm("Rimuovere l’accesso a questo utente?");
    if (!ok) return;

    setLoading(true);
    try {
      await removeMember(selectedId, uid);
      setMsg("Accesso rimosso ✅");
      await load();
    } catch (e) {
      setMsg(e?.message || "Errore rimozione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Gestione accessi" subtitle="Aggiungi/rimuovi utenti per l’appartamento selezionato">
        <PropertyHeader title="Gestione accessi" />

        {myRole === "viewer" ? (
          <Banner variant="warn">
            Modalità <b>VIEWER</b>: puoi vedere gli accessi, ma non modificarli.
          </Banner>
        ) : (
          <Banner>
            Inserisci il <b>User ID</b> del tuo amico (lo trova nella pagina <b>Profilo</b>).
          </Banner>
        )}

        {msg ? <Banner variant={msg.includes("✅") ? "info" : "danger"}>{msg}</Banner> : null}
      </Card>

      <div style={grid2}>
        <Card
          title="Aggiungi accesso"
          subtitle="Usa User ID (UUID) + ruolo"
          right={
            <Button onClick={onAdd} disabled={loading || !canManage}>
              Aggiungi
            </Button>
          }
        >
          <div style={{ display: "grid", gap: 12 }}>
            <Input
              label="User ID (UUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="es: 3f1c7e1a-....-....-....-..........."
              disabled={loading || !canManage}
            />

            <Select
              label="Ruolo"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLE_OPTIONS}
              disabled={loading || !canManage}
            />

            <div style={{ opacity: 0.75, fontSize: 12 }}>
              <b>viewer</b> = sola lettura • <b>admin</b> = può modificare
            </div>
          </div>
        </Card>

        <Card title="Accessi attuali" subtitle={`${membersWithMe.length} utenti`}>
          {loading ? (
            <div style={{ opacity: 0.8 }}>Caricamento...</div>
          ) : membersWithMe.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Nessun accesso trovato.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {membersWithMe.map((m) => (
                <div key={m.user_id} style={row}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 950 }}>
                      {m.user_id.slice(0, 8)}…{m.user_id.slice(-6)}{" "}
                      {m.isMe ? <span style={pill}>TU</span> : null}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                      ruolo: <b>{m.role}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(m.user_id);
                          alert("User ID copiato ✅");
                        } catch {
                          alert("Copia manualmente.");
                        }
                      }}
                    >
                      Copia
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => onRemove(m.user_id)}
                      disabled={loading || !canManage || m.isMe}
                      title={m.isMe ? "Non puoi rimuovere te stesso" : "Rimuovi accesso"}
                    >
                      Rimuovi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };

const row = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.14)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const pill = {
  marginLeft: 8,
  fontSize: 11,
  fontWeight: 950,
  padding: "4px 9px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
};
